'use server'

import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { decrypt } from '@/lib/crypto';
import { sendResetPasswordEmail } from '@/lib/mail';
import { headers } from 'next/headers';

// --- 1. LOGIN (MAIN - CALLS SSO API) ---
export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  let ssoRes: Response | null = null;
  let ssoData: any = null;

  try {
    // 1. Thử xác thực qua SSO API công ty
    console.log(`🌐 Đang xác thực SSO cho: ${username}`);

    // Sử dụng AbortController để giới hạn thời gian chờ SSO (tránh treo khi server không phản hồi)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 giây timeout

    try {
      ssoRes = await fetch('https://bluesso.bluedata.vn/api/Auth/authenticate', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username,
          password: password
        }),
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (ssoRes.ok) {
        ssoData = await ssoRes.json();
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.warn(`⚠️ Cảnh báo: SSO không phản hồi hoặc timeout cho ${username}. Báo lỗi:`, fetchError.message);
      // Không ném lỗi ra ngoài catch lớn, mà để cascade xuống Local Auth bên dưới
    }

    // 2. Nếu SSO thất bại (không phản hồi, timeout, hoặc SAI tài khoản từ SSO)
    // Thử kiểm tra Database cục bộ (Dự phòng cho Admin hoặc khi SSO chết)
    if (!ssoData) {
      console.log(`🕒 Đang kiểm tra Database nội bộ làm dự phòng cho: ${username}`);
      const localResult = await adminDb.query(
        'SELECT * FROM tenants WHERE (username = $1 OR email = $1) AND password_hash = $2',
        [username, password]
      );
      const localUser = localResult.rows[0];

      if (localUser) {
        if (!localUser.is_active) return { error: 'Tài khoản này đang bị khóa.' };
        return await establishSession(localUser, 'local_session');
      }

      // Nếu Local cụng không có, và SSO có phản hồi lỗi (ví dụ 401), dùng lỗi đó
      if (ssoRes && !ssoRes.ok) {
        const errorData = await ssoRes.json().catch(() => ({}));
        return { error: errorData?.message || 'Sai tài khoản hoặc mật khẩu!' };
      }

      // Nếu SSO hoàn toàn không phản hồi và Local cũng không khớp
      if (!ssoRes) {
        return { error: 'Hệ thống xác thực hiện không khả dụng (SSO Down) và không tìm thấy tài khoản cục bộ.' };
      }

      return { error: 'Sai tài khoản hoặc mật khẩu!' };
    }

    // 3. Nếu SSO thành công, lấy Token
    const token = ssoData.token || ssoData.accessToken || ssoData.access_token;

    if (!token) {
      return { error: 'Không nhận được access token từ hệ thống SSO.' };
    }

    // 4. Tìm user trong DB để phân quyền (JIT Provisioning cho SSO User)
    const userRes = await adminDb.query(
      'SELECT * FROM tenants WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [username]
    );
    let user = userRes.rows[0];

    // --- BỔ SUNG: TỰ ĐỘNG TẠO USER NẾU CHƯA CÓ (JIT Provisioning) ---
    if (!user) {
      console.log(`✨ Đang tự động khởi tạo tài khoản mới cho: ${username}`);

      let email = username.includes('@') ? username : `${username}@bluedata.vn`;
      let displayName = username;

      // Thử giải mã JWT để lấy thông tin chính xác hơn
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          email = payload.email || payload.unique_name || email;
          displayName = payload.name || payload.unique_name || payload.userName || username;
        }
      } catch (e) {
        console.error("Lỗi giải mã Token khi tạo user mới:", e);
      }

      // Thêm user mới vào database với vai trò mặc định là TENANT
      const insertRes = await adminDb.query(
        `INSERT INTO tenants (username, email, role, is_active, company_name) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [username, email, 'TENANT', true, `Tenant ${displayName}`]
      );
      user = insertRes.rows[0];
      console.log(`✅ Đã tạo tài khoản ID: ${user.id} cho ${username}`);
    }

    // 5. Lưu session và token
    return await establishSession(user, token);

  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error("Critical Login Error:", error);
    return { error: 'Lỗi hệ thống khi xử lý đăng nhập.' };
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
      'SELECT * FROM tenants WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
      [identification]
    );
    let user = userRes.rows[0];

    if (!user) {
      console.log(`✨ Đang tự động khởi tạo tài khoản mới cho: ${identification}`);
      const insertRes = await adminDb.query(
        `INSERT INTO tenants (username, email, role, is_active, company_name) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [identification, payload.email || `${identification}@bluedata.vn`, 'TENANT', true, `Tenant ${payload.name || identification}`]
      );
      user = insertRes.rows[0];
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
  cookieStore.delete('sso_token');
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

// --- 5. GET SMART DASHBOARD STATS ---
export async function getSmartStats(tenantId: number, startDate?: string, endDate?: string) {
  try {
    let dateFilter = '';

    // Explicitly handle "all" to mean no date filtering
    if (startDate === 'all') {
      dateFilter = '';
    } else if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
    } else {
      // Default to 30 days if nothing specified
      dateFilter = `AND created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }

    // 1 & 2. Phân tích Dựa trên Lịch sử Chat Thực Tế (Gọi API Dify)
    // Giới hạn 30 cuộc hội thoại gần nhất để tránh quá tải Server và Rate limit Dify
    const recentLeadsRes = await adminDb.query(`
      SELECT conversation_id, created_at 
      FROM leads 
      WHERE tenant_id = $1 AND conversation_id IS NOT NULL AND conversation_id != ''
      ${dateFilter}
      ORDER BY created_at DESC 
      LIMIT 30
    `, [tenantId]);

    const stopWords = [
      'và', 'của', 'là', 'cho', 'có', 'trong', 'được', 'với', 'không', 'đến', 'về', 'cái', 'này', 'mình', 'em', 'anh', 'tôi', 'bot', 'chatbot',
      'muốn', 'cần', 'xin', 'chào', 'giúp', 'cho', 'hỏi', 'làm', 'sao', 'thế', 'nào', 'cũng', 'biết', 'thêm', 'nhé', 'đi', 'lại', 'luôn',
      'chưa', 'rồi', 'đang', 'vừa', 'xong', 'như', 'vậy', 'đó', 'kia', 'nào', 'đâu', 'ở', 'tại', 'vào', 'ra', 'lên', 'xuống', 'qua', 'lại'
    ];

    const phraseMap: Record<string, number> = {};
    const knowledgeGaps: any[] = [];

    // Gọi API lấy lịch sử đồng loạt
    const histories = await Promise.all(
      recentLeadsRes.rows.map(async (lead) => {
        const history = await getChatHistory(lead.conversation_id, tenantId);
        return { history, fallbackDate: lead.created_at };
      })
    );

    histories.forEach(({ history, fallbackDate }) => {
      if (!Array.isArray(history)) return;

      history.forEach((msg: any) => {
        if (!msg.query) return;

        // A. Xử lý Cụm từ (Keywords) từ câu hỏi user (query)
        const cleanNote = msg.query.toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
          .trim();

        const words = cleanNote.split(/\s+/).filter((w: string) => w.length > 0);
        const seenInThisMsg = new Set<string>();

        // 1. Đếm nguyên câu (nếu câu ngắn - dưới 7 từ)
        if (words.length > 0 && words.length <= 7) {
          phraseMap[cleanNote] = (phraseMap[cleanNote] || 0) + 1;
          seenInThisMsg.add(cleanNote);
        }

        // 2. Tách Trigrams (Cụm 3 từ) - Chỉ đếm nếu chưa nằm trong câu đã đếm
        for (let i = 0; i < words.length - 2; i++) {
          const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
          if (Array.from(seenInThisMsg).some(seen => seen.includes(trigram))) continue;

          let validWordsCount = 0;
          if (!stopWords.includes(words[i])) validWordsCount++;
          if (!stopWords.includes(words[i + 1])) validWordsCount++;
          if (!stopWords.includes(words[i + 2])) validWordsCount++;

          if (validWordsCount >= 2) {
            phraseMap[trigram] = (phraseMap[trigram] || 0) + 1;
            seenInThisMsg.add(trigram);
          }
        }

        // 3. Tách Bi-grams (Cụm 2 từ) - Chỉ đếm nếu chưa nằm trong cụm/câu đã đếm
        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} ${words[i + 1]}`;
          if (Array.from(seenInThisMsg).some(seen => seen.includes(bigram))) continue;

          if (!stopWords.includes(words[i]) && !stopWords.includes(words[i + 1])) {
            phraseMap[bigram] = (phraseMap[bigram] || 0) + 1;
            seenInThisMsg.add(bigram);
          }
        }

        // 4. Tách từ đơn (Dài > 3 ký tự)
        words.forEach((w: string) => {
          if (w.length > 3 && !stopWords.includes(w) && !Array.from(seenInThisMsg).some(seen => seen.includes(w))) {
            phraseMap[w] = (phraseMap[w] || 0) + 1;
            seenInThisMsg.add(w);
          }
        });

        // B. Xử lý Điểm mù (Knowledge Gaps) từ câu trả lời của Bot (answer)
        if (msg.answer) {
          const ans = msg.answer.toLowerCase();
          if (
            ans.includes('không tìm thấy') ||
            ans.includes('không có thông tin') ||
            ans.includes('thiếu') ||
            ans.includes('chưa có') ||
            ans.includes('xin lỗi') ||
            ans.includes('chưa rõ') ||
            ans.includes('chưa hiểu rõ') ||
            ans.includes('mô tả rõ hơn')
          ) {
            // Chống trùng lặp câu hỏi
            if (!knowledgeGaps.find(g => g.question.toLowerCase() === msg.query.toLowerCase())) {
              knowledgeGaps.push({
                question: msg.query,
                created_at: msg.created_at ? new Date(msg.created_at * 1000).toISOString() : fallbackDate
              });
            }
          }
        }
      });
    });

    // D. Tiền xử lý loại bỏ các cụm từ trùng lặp một phần (Subset Cleanup)
    // Ví dụ: có "tem khuyến mãi" và "tem khuyến", ta sẽ gộp vào "tem khuyến mãi"
    const phraseEntries = Object.entries(phraseMap);

    // Sắp xếp theo chiều dài chuỗi giảm dần (để xét chuỗi dài trước)
    phraseEntries.sort((a, b) => b[0].length - a[0].length);

    const finalPhraseMap: Record<string, number> = {};
    const skipList = new Set<string>();

    for (let i = 0; i < phraseEntries.length; i++) {
      const [longPhrase, longCount] = phraseEntries[i];

      if (skipList.has(longPhrase)) continue;

      finalPhraseMap[longPhrase] = longCount;

      for (let j = i + 1; j < phraseEntries.length; j++) {
        const [shortPhrase, shortCount] = phraseEntries[j];

        if (skipList.has(shortPhrase)) continue;

        // Nếu chuỗi dài chứa hoàn toàn chuỗi ngắn (tính theo từ)
        // Ví dụ: "tem khuyến mãi" chứa "tem khuyến"
        if (longPhrase.includes(shortPhrase)) {
          // Cộng dồn điểm cho chuỗi có nghĩa đầy đủ hơn (chuỗi dài)
          finalPhraseMap[longPhrase] += shortCount;
          skipList.add(shortPhrase); // Xóa sổ chuỗi bị cắt cụt
        }
      }
    }

    const topTopics = Object.entries(finalPhraseMap)
      .map(([name, value]) => ({ name, value: Math.ceil(value) }))
      .sort((a, b) => b.value - a.value)
      .filter(item => item.value >= 2) // Lọc bỏ các cụm quá ít người hỏi
      .slice(0, 15);

    // Cắt danh sách Knowledge Gaps lấy 20 mới nhất
    knowledgeGaps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const finalGaps = knowledgeGaps.slice(0, 20);

    // 3. Phân tích Giờ cao điểm
    const peakHoursRes = await adminDb.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') as hour,
        COUNT(*) as count
      FROM token_logs
      WHERE tenant_id = $1 
      ${dateFilter}
      GROUP BY hour
      ORDER BY hour ASC
    `, [tenantId]);

    const peakHours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      count: Number(peakHoursRes.rows.find(r => Number(r.hour) === i)?.count || 0)
    }));

    return {
      topTopics,
      knowledgeGaps: finalGaps,
      peakHours,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("Smart Stats Error:", error);
    return {
      topTopics: [],
      knowledgeGaps: [],
      peakHours: [],
      lastUpdated: new Date().toISOString()
    };
  }
}
