import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';
import { sendOrderEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 NHẬN WEBHOOK ĐƠN HÀNG - FULL BODY:", JSON.stringify(body, null, 2));

    const {
      conversation_id,
      tenant_id,
      customer_name, ten_nguoi_nhan,
      phone_number, sdt,
      address, dia_chi,
      products, danh_sach_san_pham,
      total_amount, tong_tien, tong_tien_don_hang
    } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: 'Thiếu tenant_id' }, { status: 400 });
    }

    // 0. Chuẩn bị dữ liệu
    const finalCustomerName = customer_name || ten_nguoi_nhan || 'Khách vãng lai';
    const finalPhoneNumber = phone_number || sdt || '';
    const finalAddress = address || dia_chi || '';
    
    let finalOrderDetails = "";
    let calculatedTotal = 0;

    const items = products || danh_sach_san_pham;
    if (Array.isArray(items)) {
      finalOrderDetails = items.map((item: any) => {
        if (typeof item === 'object') {
          const name = item.product_name || item.ten_san_pham || item.name || "Sản phẩm";
          const qty = item.quantity || item.so_luong || item.qty || 1;
          const price = item.unit_price || item.don_gia || item.price || 0;
          const itemTotal = item.thanh_tien || item.item_total || (Number(qty) * Number(price)) || 0;
          calculatedTotal += Number(itemTotal);
          return `${qty}x ${name} (${Number(price).toLocaleString()}đ)`;
        }
        return String(item);
      }).join("\n");
    } else if (items) {
      finalOrderDetails = String(items);
    }

    const finalTotal = Number(tong_tien_don_hang || tong_tien || total_amount || calculatedTotal || 0);

    // 1. Kiểm tra đơn hàng rác (Không có tiền và không có chi tiết món)
    if (finalTotal === 0 && !finalOrderDetails) {
      console.log("⚠️ Bỏ qua đơn hàng rác (không có thông tin món ăn hoặc tiền)");
      return NextResponse.json({ status: 'ignored', message: 'Empty order' });
    }

    // 2. Cơ chế Cập nhật (Upsert): Nếu đã có đơn hàng từ cuộc hội thoại này, ta cập nhật thay vì tạo mới
    if (conversation_id) {
      const existingOrder = await adminDb.query(
        "SELECT id FROM orders WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1",
        [conversation_id]
      );

      if (existingOrder.rows.length > 0) {
        const orderId = existingOrder.rows[0].id;
        console.log(`🔄 Cập nhật đơn hàng cũ (ID: ${orderId}) cho conversation: ${conversation_id}`);
        
        await adminDb.query(
          `UPDATE orders SET 
            customer_name = $1, 
            phone_number = $2, 
            address = $3, 
            order_details = $4, 
            total_amount = $5,
            created_at = NOW()
          WHERE id = $6`,
          [finalCustomerName, finalPhoneNumber, finalAddress, finalOrderDetails, finalTotal, orderId]
        );

        return NextResponse.json({
          status: 'updated',
          order_id: orderId
        });
      }
    }

    // 3. Nếu chưa có thì mới Insert mới
    const res = await adminDb.query(
      `INSERT INTO orders (
          tenant_id, 
          conversation_id, 
          customer_name, 
          phone_number, 
          address, 
          order_details, 
          total_amount,
          created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
      [
        tenant_id,
        conversation_id || null,
        finalCustomerName,
        finalPhoneNumber,
        finalAddress,
        finalOrderDetails,
        finalTotal
      ]
    );

    // 4. Gửi Email thông báo cho Merchant (Lấy email tenant)
    const tenantRes = await adminDb.query('SELECT email FROM tenants WHERE id = $1', [tenant_id]);
    const orderId = res.rows[0].id;

    if (tenantRes.rows.length > 0 && tenantRes.rows[0].email) {
      console.log(`📧 Đang gửi thông báo đơn hàng #${orderId} tới: ${tenantRes.rows[0].email}`);
      
      // Gửi email bất đồng bộ, không đợi kết quả để tránh làm chậm Webhook
      sendOrderEmail(tenantRes.rows[0].email, {
        id: orderId,
        customer_name: finalCustomerName,
        phone_number: finalPhoneNumber,
        address: finalAddress,
        order_details: finalOrderDetails,
        total_amount: finalTotal
      }).catch(e => console.error("⚠️ Lỗi gửi mail đơn hàng:", e));
    }

    return NextResponse.json({
      status: 'success',
      order_id: orderId
    });

  } catch (error: any) {
    console.error('❌ LỖI SERVER KHI LƯU ĐƠN HÀNG:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
