import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';
import { decrypt } from '@/lib/crypto'; // <--- THÊM LẠI HÀM GIẢI MÃ

export async function POST(req: Request) {
  try {
    const { tenant_id } = await req.json();

    if (!tenant_id) {
      return NextResponse.json({ allowed: false, error: 'Missing tenant_id' });
    }

    // 1. Lấy thông tin Tenant và Tổng token đã dùng
    const res = await adminDb.query(`
      SELECT 
        t.is_active, 
        t.is_bot_enabled, 
        t.token_limit, 
        t.openai_api_key,
        COALESCE(SUM(tl.total_tokens), 0) as used_tokens
      FROM tenants t
      LEFT JOIN token_logs tl ON t.id = tl.tenant_id
      WHERE t.id = $1
      GROUP BY t.id
    `, [tenant_id]);

    const tenant = res.rows[0];

    // 2. Các lớp bảo vệ
    if (!tenant) return NextResponse.json({ allowed: false, message: 'Tenant not found' });
    if (!tenant.is_active) return NextResponse.json({ allowed: false, message: 'Account locked' });
    if (!tenant.is_bot_enabled) return NextResponse.json({ allowed: false, message: 'Bot disabled' });

    // 3. Kiểm tra giới hạn Token
    if (Number(tenant.used_tokens) >= Number(tenant.token_limit)) {
      return NextResponse.json({ allowed: false, message: 'Over quota' });
    }

    // 4. GIẢI MÃ API KEY TRƯỚC KHI TRẢ VỀ
    const rawApiKey = decrypt(tenant.openai_api_key || "");

    return NextResponse.json({
      allowed: true,
      api_key: rawApiKey // Trả về Key đã giải mã (sk-...)
    });


  } catch (error) {
    console.error("Config API Error:", error);
    return NextResponse.json({ allowed: false });
  }
}