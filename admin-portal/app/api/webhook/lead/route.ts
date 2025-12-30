import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';
import { sendLeadEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      conversation_id,
      customer_name,
      phone_number,
      note,
      user_id,
      tenant_id
    } = body;

    console.log("📥 Nhận Webhook:", { conversation_id, user_id, tenant_id });

    if (!conversation_id) {
      return NextResponse.json({ error: 'Thiếu conversation_id' }, { status: 400 });
    }

    // ==================================================================
    // 🟡 BƯỚC 1: KIỂM TRA TỒN TẠI & TRẢ TÍN HIỆU CHO DIFY
    // ==================================================================
    const checkExist = await adminDb.query(
      'SELECT id FROM leads WHERE conversation_id = $1',
      [conversation_id]
    );

    // ==> TRƯỜNG HỢP 1: KHÁCH CŨ (Đã có trong DB)
    // - Không lưu lại.
    // - Không gửi mail.
    // - Trả về is_new_conversation = FALSE để Dify biết được phép lấy lịch sử.
    if ((checkExist.rowCount ?? 0) > 0) {
      console.log("⛔ Lead đã tồn tại -> Bỏ qua lưu & gửi mail.");
      return NextResponse.json({
        status: 'skipped',
        message: 'Lead already exists',
        is_new_conversation: false // <--- Tín hiệu QUAN TRỌNG: "Cũ rồi, lấy lịch sử đi"
      });
    }

    // ==================================================================
    // 🟢 TRƯỜNG HỢP 2: KHÁCH MỚI (Chưa có trong DB)
    // ==================================================================

    // A. Xác định Tenant (Logic tìm tenant để gán khách)
    let targetTenantId = 1;
    let targetTenantEmail = "";

    if (tenant_id) {
      const res = await adminDb.query('SELECT id, email FROM tenants WHERE id = $1', [tenant_id]);
      if (res.rows.length > 0) {
        targetTenantId = res.rows[0].id;
        targetTenantEmail = res.rows[0].email;
      } else {
        // Fallback nếu ID gửi lên không tồn tại
        const fallbackRes = await adminDb.query('SELECT id, email FROM tenants LIMIT 1');
        targetTenantId = fallbackRes.rows[0]?.id || 1;
        targetTenantEmail = fallbackRes.rows[0]?.email;
      }
    } else {
      // Fallback nếu không có tenant_id
      const res = await adminDb.query('SELECT id, email FROM tenants LIMIT 1');
      targetTenantId = res.rows[0]?.id || 1;
      targetTenantEmail = res.rows[0]?.email;
    }

    // B. Lưu vào Database (Insert mới hoàn toàn)
    await adminDb.query(
      `INSERT INTO leads (
          tenant_id, 
          conversation_id, 
          customer_name, 
          phone_number, 
          note, 
          user_id, 
          total_chat_tokens,
          created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, NOW())`,
      [
        targetTenantId,
        conversation_id,
        customer_name || 'Khách vãng lai',
        phone_number || '',
        note || '',
        user_id || 'user-unknown'
      ]
    );

    // C. Gửi Email thông báo (Chỉ chạy 1 lần duy nhất tại đây)
    if (targetTenantEmail) {
      console.log("📧 Phát hiện khách mới -> Đang gửi Email...");
      try {
        await sendLeadEmail(targetTenantEmail, {
          customer_name: customer_name || 'Khách mới',
          phone_number: phone_number || '---',
          need: note || ''
        });
      } catch (e) { console.error("⚠️ Lỗi gửi mail:", e); }
    }

    // ==> Trả về is_new_conversation = TRUE để Dify biết KHÔNG ĐƯỢC lấy lịch sử (tránh lỗi 404)
    return NextResponse.json({
      status: 'success',
      is_new_conversation: true // <--- Tín hiệu QUAN TRỌNG: "Mới tinh, đừng lấy lịch sử vội"
    });

  } catch (error: any) {
    console.error('❌ LỖI SERVER:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}