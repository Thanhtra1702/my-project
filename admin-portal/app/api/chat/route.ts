import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/db';
import { decrypt } from '@/lib/crypto';

export async function POST(req: Request) {
    try {
        const { message, conversation_id, tenant_id, user_id, customer_name, phone_number, note } = await req.json();

        if (!message || !tenant_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Lấy cấu hình Dify của Tenant
        const tenantRes = await adminDb.query(
            'SELECT dify_api_key, dify_api_url, is_active, is_bot_enabled, token_limit FROM tenants WHERE id = $1',
            [tenant_id]
        );
        const tenant = tenantRes.rows[0];

        if (!tenant || !tenant.is_active || !tenant.is_bot_enabled) {
            return NextResponse.json({ error: 'Tenant is inactive or bot is disabled' }, { status: 403 });
        }

        // 2. Kiểm tra giới hạn token (tổng quát)
        const usageRes = await adminDb.query(
            'SELECT SUM(total_tokens) as total FROM token_logs WHERE tenant_id = $1',
            [tenant_id]
        );
        const currentUsage = parseInt(usageRes.rows[0]?.total || '0');
        if (currentUsage >= (tenant.token_limit || 100000)) {
            return NextResponse.json({ error: 'Token limit exceeded' }, { status: 403 });
        }

        // 3. Chuẩn bị gọi Dify
        const apiKey = decrypt(tenant.dify_api_key).trim();
        let apiUrl = tenant.dify_api_url || process.env.DIFY_API_URL || 'https://api.dify.ai/v1';

        // Đảm bảo URL kết thúc đúng
        if (!apiUrl.endsWith('/v1')) {
            apiUrl = apiUrl.replace(/\/$/, '') + (apiUrl.includes('/v1') ? '' : '/v1');
        }

        const difyResponse = await fetch(`${apiUrl}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {
                    customer_name: customer_name || '',
                    phone_number: phone_number || '',
                    note: note || ''
                },
                query: message,
                response_mode: 'blocking',
                user: user_id || 'guest-user',
                conversation_id: conversation_id || '',
            }),
        });

        if (!difyResponse.ok) {
            const errorData = await difyResponse.text();
            console.error('Dify API Error:', errorData);
            return NextResponse.json({ error: 'Failed to connect to AI engine' }, { status: difyResponse.status });
        }

        const data = await difyResponse.json();

        // 4. Lưu log usage vào Database
        const usage = data.metadata?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        await adminDb.query(
            `INSERT INTO token_logs (tenant_id, conversation_id, input_tokens, output_tokens, total_tokens, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
                tenant_id,
                data.conversation_id,
                usage.prompt_tokens,
                usage.completion_tokens,
                usage.total_tokens
            ]
        );

        return NextResponse.json({
            answer: data.answer,
            conversation_id: data.conversation_id,
        });

    } catch (error: any) {
        console.error('Chat Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
