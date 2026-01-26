'use server'

import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { decrypt } from '@/lib/crypto';
import { sendResetPasswordEmail } from '@/lib/mail';
import { headers } from 'next/headers';

// --- 1. LOGIN (LOCAL) ---
export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const result = await adminDb.query(
      'SELECT * FROM tenants WHERE (username = $1 OR email = $1) AND password_hash = $2',
      [username, password]
    );
    const user = result.rows[0];

    if (!user) {
      // Nếu không tìm thấy local, thử gọi SSO API
      return await loginWithSSO(username, password);
    }

    if (!user.is_active) return { error: 'Tài khoản này đang bị khóa.' };

    const cookieStore = await cookies();
    cookieStore.set('tenant_id', user.id.toString(), {
      httpOnly: true, path: '/', maxAge: 86400,
      secure: process.env.NODE_ENV === 'production', sameSite: 'lax'
    });

    if (user.role === 'SUPER_ADMIN') redirect('/admin');
    else redirect('/');
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error("Login Error:", error);
    return { error: 'Lỗi đăng nhập hệ thống' };
  }
}

// --- 1.1 LOGIN (COMPANY SSO API) ---
export async function loginWithSSO(username: string, password: string) {
  try {
    console.log(`🌐 Đang xác thực SSO cho: ${username}`);
    const res = await fetch('https://bluesso.bluedata.vn/api/Auth/authenticate', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: username,
        password: password
      }),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { error: errorData?.message || 'Xác thực SSO thất bại hoặc sai tài khoản!' };
    }

    const data = await res.json();
    const token = data.token || data.accessToken || data.access_token;

    if (!token) {
      return { error: 'Không nhận được access token từ hệ thống SSO.' };
    }

    // Sau khi có token, ta cần tìm user tương ứng trong hệ thống của mình
    console.log(`🔍 Tìm kiếm tenant cho identification: ${username}`);
    const userRes = await adminDb.query(
      'SELECT * FROM tenants WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );
    const user = userRes.rows[0];

    if (!user) {
      console.error(`❌ Không tìm thấy user '${username}' trong bảng tenants.`);
      return { error: `Tài khoản '${username}' đã xác thực SSO thành công nhưng chưa được cấp quyền trên Admin Portal này.` };
    }

    return await establishSession(user, token);

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error("SSO Login Error:", error);
    return { error: 'Lỗi kết nối tới hệ thống SSO công ty' };
  }
}

// --- 1.1.1 LOGIN WITH TOKEN (CALLBACK) ---
export async function loginWithToken(token: string) {
  try {
    console.log(`🎟️ Đang xác thực token SSO nhận được...`);

    // Giả sử token là JWT, ta decode để lấy username/email
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Token không hợp lệ hoặc không đúng định dạng JWT.' };
    }

    // Decode base64 payload
    const payloadStr = Buffer.from(parts[1], 'base64').toString();
    const payload = JSON.parse(payloadStr);

    // Các field phổ biến trong JWT của BlueData (giả định)
    const identification = payload.unique_name ||
      payload.email ||
      payload.sub ||
      payload.userName ||
      payload.uniqueName ||
      payload.name ||
      payload.id;

    if (!identification) {
      return { error: 'Không thể xác định danh tính từ token SSO.' };
    }

    const userRes = await adminDb.query(
      'SELECT * FROM tenants WHERE username = $1 OR email = $1',
      [identification]
    );
    const user = userRes.rows[0];

    if (!user) {
      return { error: `Tài khoản '${identification}' chưa được phân quyền trong hệ thống.` };
    }

    return await establishSession(user, token);
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error("Token Auth Error:", error);
    return { error: 'Lỗi khi xử lý token SSO.' };
  }
}

async function establishSession(user: any, token: string) {
  if (!user.is_active) return { error: 'Tài khoản này đang bị khóa.' };

  const cookieStore = await cookies();
  cookieStore.set('tenant_id', user.id.toString(), {
    httpOnly: true, path: '/', maxAge: 86400,
    secure: process.env.NODE_ENV === 'production', sameSite: 'lax'
  });

  cookieStore.set('sso_token', token, {
    httpOnly: true, path: '/', maxAge: 86400,
    secure: process.env.NODE_ENV === 'production', sameSite: 'lax'
  });

  if (user.role === 'SUPER_ADMIN') redirect('/admin');
  else redirect('/');
}

// --- 1.2 FORGOT PASSWORD ---
export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  try {
    const result = await adminDb.query(
      'SELECT * FROM tenants WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return { error: 'Email không tồn tại trong hệ thống!' };
    }

    const host = (await headers()).get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const resetLink = `${protocol}://${host}/reset-password?email=${email}`;

    const sent = await sendResetPasswordEmail(email, resetLink);

    if (sent) {
      return { success: true, message: 'Liên kết khôi phục mật khẩu đã được gửi đến email của bạn!' };
    } else {
      return { error: 'Không thể gửi email lúc này. Vui lòng thử lại sau.' };
    }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { error: 'Lỗi hệ thống khi yêu cầu khôi phục mật khẩu' };
  }
}

// --- 1.3 RESET PASSWORD ---
export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const newPassword = formData.get('password') as string;

  try {
    // Trong thực tế, cần kiểm tra token hợp lệ ở đây.
    // Demo: Cập nhật trực tiếp mật khẩu cho email này.
    await adminDb.query(
      'UPDATE tenants SET password_hash = $1 WHERE email = $2',
      [newPassword, email]
    );

    return { success: true, message: 'Mật khẩu của bạn đã được cập nhật thành công!' };
  } catch (error) {
    console.error("Reset Password Error:", error);
    return { error: 'Lỗi hệ thống khi đặt lại mật khẩu' };
  }
}

// --- 2. LOGOUT ---
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('tenant_id');
  redirect('/login');
}

// --- 3. TOGGLE BOT STATUS ---
export async function toggleBotStatus(currentStatus: boolean) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenant_id')?.value;
  if (!tenantId) return { success: false };
  try {
    await adminDb.query('UPDATE tenants SET is_bot_enabled = $1 WHERE id = $2', [!currentStatus, tenantId]);
    revalidatePath('/');
    return { success: true, newStatus: !currentStatus };
  } catch (error) { return { success: false }; }
}

// --- 4. GET CHAT HISTORY (QUAN TRỌNG) ---
export async function getChatHistory(conversation_id: string, tenant_id: number) {
  if (!conversation_id) return [];

  try {
    // 🟢 BƯỚC 1: Lấy cấu hình Dify của Tenant từ Database
    const tenantRes = await adminDb.query(
      'SELECT dify_api_key, dify_api_url FROM tenants WHERE id = $1',
      [tenant_id]
    );
    const tenantConfig = tenantRes.rows[0];

    let apiKey = '';
    let apiUrl = '';

    // 1. Lấy API Key và làm sạch (Trim) để tránh ký tự ẩn (\r, \n)
    if (tenantConfig?.dify_api_key) {
      apiKey = decrypt(tenantConfig.dify_api_key).trim();
    } else {
      apiKey = (process.env.DIFY_API_KEY || '').trim();
    }

    // 2. Lấy API URL và đảm bảo dùng HTTPS trên VPS để tránh Redirect mất Header
    let originalUrl = tenantConfig?.dify_api_url || process.env.DIFY_API_URL || 'http://localhost/v1';

    if (process.env.NODE_ENV === 'production' && originalUrl.includes('bluebot.vn')) {
      // Đảm bảo dùng HTTPS
      if (originalUrl.startsWith('http://')) {
        originalUrl = originalUrl.replace('http://', 'https://');
      }
      // Tự động chuyển từ domain cũ sang domain mới nếu cần
      if (originalUrl.includes('demo.bluebot.vn')) {
        originalUrl = originalUrl.replace('demo.bluebot.vn', 'admin.bluebot.vn');
      }
    }
    apiUrl = originalUrl;

    if (!apiUrl || !apiKey) {
      console.error(`❌ Thiếu cấu hình Dify cho tenant ${tenant_id}`);
      return [];
    }

    // Kiểm tra tính hợp lệ của Key (không in ra key thật)
    const isKeyValid = apiKey.startsWith('app-');
    console.log(`📡 Dify History: Tenant=${tenant_id} URL=${apiUrl} ValidPrefix=${isKeyValid}`);

    // ... (Giữ nguyên logic user_id)
    const leadRes = await adminDb.query(
      'SELECT user_id FROM leads WHERE conversation_id = $1',
      [conversation_id]
    );
    const realUser = leadRes.rows[0]?.user_id || 'abc-123';

    // 3. Gọi API
    const fullUrl = `${apiUrl}/messages?conversation_id=${conversation_id}&user=${realUser}&limit=100`;

    if (process.env.NODE_ENV === 'production') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (process.env.NODE_ENV === 'production') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Dify Error (${res.status}):`, errorText);
      return [];
    }

    const json = await res.json();
    return json.data || [];

  } catch (error) {
    console.error('❌ Server Error fetching history:', error);
    return [];
  }
}