'use server'

import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { decrypt } from '@/lib/crypto';

// --- 1. LOGIN ---
export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const result = await adminDb.query(
      'SELECT * FROM tenants WHERE username = $1 AND password_hash = $2',
      [username, password]
    );
    const user = result.rows[0];

    if (!user) return { error: 'Sai tài khoản hoặc mật khẩu!' };
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

    if (tenantConfig?.dify_api_key) {
      apiKey = decrypt(tenantConfig.dify_api_key);
    } else {
      apiKey = process.env.DIFY_API_KEY || '';
    }

    if (tenantConfig?.dify_api_url) {
      apiUrl = tenantConfig.dify_api_url;
    } else {
      apiUrl = process.env.DIFY_API_URL || '';
    }

    if (!apiUrl || !apiKey) {
      console.error(`❌ Thiếu cấu hình Dify cho tenant ${tenant_id}`);
      return [];
    }

    // 🟢 BƯỚC 2: Lấy user_id chính chủ từ Database
    const leadRes = await adminDb.query(
      'SELECT user_id FROM leads WHERE conversation_id = $1',
      [conversation_id]
    );

    // Nếu không tìm thấy, dùng tạm 'abc-123' (fallback)
    const realUser = leadRes.rows[0]?.user_id || 'abc-123';

    // 🟢 BƯỚC 3: Gọi API sang Dify
    // Lưu ý: Dùng endpoint /messages (Dành cho Chatbot)
    const fullUrl = `${apiUrl}/messages?conversation_id=${conversation_id}&user=${realUser}&limit=100`;

    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`❌ Dify Error (${res.status}):`, await res.text());
      return [];
    }

    const json = await res.json();
    return json.data || [];

  } catch (error) {
    console.error('❌ Server Error fetching history:', error);
    return [];
  }
}