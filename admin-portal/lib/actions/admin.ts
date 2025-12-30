'use server'

import { adminDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/crypto'; // <--- IMPORT HÀM MÃ HÓA VỪA TẠO

// 1. Hàm lấy danh sách (Giữ nguyên - Đã bảo mật không select key)
export async function getAllTenants() {
  try {
    const result = await adminDb.query(`
      SELECT id, company_name, email, username, role, dify_app_id, is_active, is_bot_enabled, token_limit, limit_start_date, created_at 
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

  // Lấy API Key thô từ form
  const rawApiKey = formData.get('apiKey') as string;

  // LOGIC MỚI: Nếu người dùng có nhập Key -> Mã hóa ngay lập tức
  let finalEncryptedKey = '';
  if (rawApiKey && rawApiKey.trim() !== '') {
    finalEncryptedKey = encrypt(rawApiKey.trim());
  }

  const difyAppId = formData.get('difyAppId') as string;
  const tokenLimit = formData.get('tokenLimit') as string;
  const isActive = formData.get('isActive') === 'true';
  const resetCycle = formData.get('resetCycle') === 'on';

  try {
    if (id) {
      // --- UPDATE ---
      // finalEncryptedKey sẽ là chuỗi mã hóa (nếu có nhập) hoặc chuỗi rỗng (nếu không nhập)
      // COALESCE(NULLIF($x, ''), ...) vẫn hoạt động tốt với logic này.

      if (password && password.trim() !== "") {
        await adminDb.query(
          `UPDATE tenants 
           SET company_name=$1, email=$11, username=$2, password_hash=$3, role=$4, 
               openai_api_key = COALESCE(NULLIF($5, ''), openai_api_key), 
               dify_app_id=$6, token_limit=$7, is_active=$8, 
               limit_start_date = (CASE WHEN $10 = true THEN NOW() ELSE limit_start_date END)
           WHERE id=$9`,
          [company_name, username, password, role, finalEncryptedKey, difyAppId, tokenLimit, isActive, id, resetCycle, email]
        );
      } else {
        await adminDb.query(
          `UPDATE tenants 
           SET company_name=$1, email=$10, username=$2, role=$3, 
               openai_api_key = COALESCE(NULLIF($4, ''), openai_api_key), 
               dify_app_id=$5, token_limit=$6, is_active=$7, 
               limit_start_date = (CASE WHEN $9 = true THEN NOW() ELSE limit_start_date END)
           WHERE id=$8`,
          [company_name, username, role, finalEncryptedKey, difyAppId, tokenLimit, isActive, id, resetCycle, email]
        );
      }
    } else {
      // --- INSERT (TẠO MỚI) ---
      // Mã hóa luôn khi tạo mới
      const finalPass = password || '123456';
      await adminDb.query(
        `INSERT INTO tenants (company_name, email, username, password_hash, role, openai_api_key, dify_app_id, token_limit, is_active, is_bot_enabled, limit_start_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [company_name, email, username, finalPass, role, finalEncryptedKey, difyAppId, tokenLimit || 100000, isActive, true]
      );
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}