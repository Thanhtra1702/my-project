import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenant_id, conversation_id, input, output, total } = body;

    console.log("📝 Logging Token:", { tenant_id, total });

    // 1. Ghi vào bảng lịch sử chi tiết (token_logs)
    await adminDb.query(
      `INSERT INTO token_logs (tenant_id, conversation_id, input_tokens, output_tokens, total_tokens, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [tenant_id, conversation_id, input || 0, output || 0, total || 0]
    );

    // 2. Cập nhật tổng token vào bảng leads (Để Dashboard hiển thị nhanh mà không cần join)
    if (conversation_id) {
      await adminDb.query(
        `UPDATE leads 
             SET total_chat_tokens = COALESCE(total_chat_tokens, 0) + $1 
             WHERE conversation_id = $2`,
        [total || 0, conversation_id]
      );
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Log Token Error:", error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}