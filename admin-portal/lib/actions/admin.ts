'use server'

import { adminDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/crypto'; // <--- IMPORT HÀM MÃ HÓA VỪA TẠO

// 1. Hàm lấy danh sách (Giữ nguyên - Đã bảo mật không select key)
export async function getAllTenants() {
  try {
    const result = await adminDb.query(`
      SELECT id, company_name, email, username, role, is_active, is_bot_enabled, token_limit, limit_start_date, created_at 
      FROM tenants 
      ORDER BY id ASC
    `);
    return result.rows;
  } catch (error) {
    return [];
  }
}

// 2. Hàm Lưu / Cập nhật (SỬA ĐỂ MÃ HÓA)
export async function saveTenant(formData: FormData) {
  const id = formData.get('id') as string;
  const company_name = formData.get('company_name') as string;
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const rawDifyApiKey = formData.get('difyApiKey') as string;
  let difyApiUrl = formData.get('difyApiUrl') as string;

  // Tự động chuẩn hóa domain nếu là bluebot.vn
  if (difyApiUrl && difyApiUrl.includes('demo.bluebot.vn')) {
    difyApiUrl = difyApiUrl.replace('demo.bluebot.vn', 'admin.bluebot.vn');
  }

  let finalEncryptedDifyKey = '';
  if (rawDifyApiKey && rawDifyApiKey.trim() !== '') {
    finalEncryptedDifyKey = encrypt(rawDifyApiKey.trim());
  }

  const tokenLimit = formData.get('tokenLimit') as string;
  const isActiveStr = formData.get('isActive');
  const isActive = isActiveStr === null ? true : isActiveStr === 'true';

  try {
    if (id) {
      // --- UPDATE ---
      // finalEncryptedKey sẽ là chuỗi mã hóa (nếu có nhập) hoặc chuỗi rỗng (nếu không nhập)
      // COALESCE(NULLIF($x, ''), ...) vẫn hoạt động tốt với logic này.

      if (password && password.trim() !== "") {
        await adminDb.query(
          `UPDATE tenants 
           SET company_name=$1, email=$2, username=$3, password_hash=$4, role=$5, 
               token_limit=$6, is_active=$7, 
               dify_api_key = COALESCE(NULLIF($9, ''), dify_api_key),
               dify_api_url = $10
           WHERE id=$8`,
          [company_name, email, username, password, role, tokenLimit, isActive, id, finalEncryptedDifyKey, difyApiUrl]
        );
      } else {
        await adminDb.query(
          `UPDATE tenants 
           SET company_name=$1, email=$2, username=$3, role=$4, 
               token_limit=$5, is_active=$6, 
               dify_api_key = COALESCE(NULLIF($8, ''), dify_api_key),
               dify_api_url = $9
           WHERE id=$7`,
          [company_name, email, username, role, tokenLimit, isActive, id, finalEncryptedDifyKey, difyApiUrl]
        );
      }
    } else {
      // --- INSERT (TẠO MỚI) ---
      // Mã hóa luôn khi tạo mới
      const finalPass = password || '123456';
      await adminDb.query(
        `INSERT INTO tenants (company_name, email, username, password_hash, role, token_limit, is_active, is_bot_enabled, dify_api_key, dify_api_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [company_name, email, username, finalPass, role, tokenLimit || 100000, isActive, true, finalEncryptedDifyKey, difyApiUrl]
      );
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}