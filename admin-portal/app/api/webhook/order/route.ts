import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      conversation_id,
      tenant_id,
      // Ánh xạ linh hoạt các trường tiếng Việt & tiếng Anh
      customer_name, ten_nguoi_nhan,
      phone_number, sdt,
      address, dia_chi,
      products, danh_sach_san_pham,
      total_amount, tong_tien, tong_tien_don_hang
    } = body;

    console.log("📥 Nhận Webhook Đơn hàng:", { conversation_id, tenant_id });

    if (!tenant_id) {
      return NextResponse.json({ error: 'Thiếu tenant_id' }, { status: 400 });
    }

    // Giá trị cuối cùng để lưu
    const finalCustomerName = customer_name || ten_nguoi_nhan || 'Khách vãng lai';
    const finalPhoneNumber = phone_number || sdt || '';
    const finalAddress = address || dia_chi || '';
    
    let finalOrderDetails = "";
    let calculatedTotal = 0;

    // Xử lý danh sách sản phẩm (Array of Objects)
    const items = products || danh_sach_san_pham;
    if (Array.isArray(items)) {
      finalOrderDetails = items.map((item: any) => {
        if (typeof item === 'object') {
          // Trích xuất thông tin món ăn từ object (hỗ trợ cả Việt/Anh)
          const name = item.ten_san_pham || item.product_name || item.name || "Sản phẩm";
          const qty = item.so_luong || item.quantity || item.qty || 1;
          const price = item.don_gia || item.unit_price || item.price || 0;
          const itemTotal = item.thanh_tien || item.item_total || (Number(qty) * Number(price)) || 0;

          calculatedTotal += Number(itemTotal);
          
          return `${qty}x ${name} (${Number(price).toLocaleString()}đ)`;
        }
        return String(item);
      }).join("\n"); // Sử dụng xuống dòng để hiển thị đẹp hơn trong Dashboard
    }

    // Ưu tiên lấy tổng tiền gửi trực tiếp từ Dify, nếu không có thì dùng tiền đã tính từ danh sách sản phẩm
    const finalTotal = Number(tong_tien_don_hang || tong_tien || total_amount || calculatedTotal || 0);

    // Lưu vào database
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

    return NextResponse.json({
      status: 'success',
      order_id: res.rows[0].id
    });

  } catch (error: any) {
    console.error('❌ LỖI SERVER KHI LƯU ĐƠN HÀNG:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
