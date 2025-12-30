import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Dashboard from './Dashboard';

export const revalidate = 0; // Luôn lấy dữ liệu mới nhất, không dùng cache

export default async function Home() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenant_id')?.value;

  console.log("🕵️ Tenant đang đăng nhập:", tenantId);

  if (!tenantId) redirect('/login');


  // LẤY THÊM token_limit, company_name, email
  const userRes = await adminDb.query('SELECT role, is_active, is_bot_enabled, token_limit, company_name, email FROM tenants WHERE id = $1', [tenantId]);
  const user = userRes.rows[0];

  if (!user) redirect('/login');
  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const leadsRes = await adminDb.query(`
    SELECT l.*, COALESCE(SUM(tl.total_tokens), 0) as total_chat_tokens
    FROM leads l
    LEFT JOIN token_logs tl ON l.conversation_id = tl.conversation_id
    WHERE l.tenant_id = $1
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `, [tenantId]);

  const statsRes = await adminDb.query(`
    SELECT
      COUNT(DISTINCT conversation_id) FILTER (WHERE created_at::date = CURRENT_DATE) as chats_today,
      COUNT(DISTINCT conversation_id) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as chats_week,
      COUNT(DISTINCT conversation_id) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as chats_month,
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at::date = CURRENT_DATE), 0) as tokens_today,
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)), 0) as tokens_week,
      COALESCE(SUM(total_tokens) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as tokens_month,
      COALESCE(SUM(total_tokens), 0) as total_tokens_all_time
    FROM token_logs WHERE tenant_id = $1
  `, [tenantId]);

  const chartRes = await adminDb.query(`
    WITH days AS (
      SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
    ),
    daily_leads AS (
      SELECT created_at::date as day, COUNT(id) as count
      FROM leads
      WHERE tenant_id = $1
      GROUP BY created_at::date
    ),
    daily_tokens AS (
      SELECT created_at::date as day, SUM(total_tokens) as count
      FROM token_logs
      WHERE tenant_id = $1
      GROUP BY created_at::date
    )
    SELECT 
      TO_CHAR(d.day, 'DD/MM') as date,
      COALESCE(l.count, 0) as lead_count,
      COALESCE(t.count, 0) as token_count
    FROM days d
    LEFT JOIN daily_leads l ON d.day = l.day
    LEFT JOIN daily_tokens t ON d.day = t.day
    ORDER BY d.day ASC
  `, [tenantId]);

  return (
    <Dashboard
      leads={leadsRes.rows}
      tenantId={tenantId}
      companyName={user.company_name}
      email={user.email}
      stats={statsRes.rows[0]}
      chartData={chartRes.rows}
      isSystemLocked={!user.is_active}
      initialBotStatus={user.is_bot_enabled}
      tokenLimit={user.token_limit || 100000} // <--- TRUYỀN XUỐNG DASHBOARD
    />
  );
}