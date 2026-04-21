import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const revalidate = 0;

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('tenant_id')?.value;

  if (!tenantId) redirect('/login');

  const adminCheck = await adminDb.query('SELECT role, username FROM tenants WHERE id = $1', [tenantId]);
  const user = adminCheck.rows[0];

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const statsRes = await adminDb.query(`
    SELECT
      (SELECT COUNT(*) FROM tenants WHERE role != 'SUPER_ADMIN') as total_tenants,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM token_logs) as total_system_tokens
    `);
  const stats = statsRes.rows[0] || { total_tenants: 0, active_tenants: 0, total_system_tokens: 0 };

  const tenantsRes = await adminDb.query(`
    SELECT 
        t.id, t.company_name, t.email, t.username, t.role, t.is_active, t.created_at, t.token_limit, t.dify_app_id, t.openai_api_key, t.dify_api_url,
        COALESCE(SUM(tl.total_tokens), 0) as total_usage
    FROM tenants t
    LEFT JOIN token_logs tl ON t.id = tl.tenant_id
    WHERE t.role != 'SUPER_ADMIN'
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `);

  const leadsRes = await adminDb.query(`
    SELECT l.*, t.company_name as tenant_name, COALESCE(SUM(tl.total_tokens), 0) as total_chat_tokens
    FROM leads l
    LEFT JOIN tenants t ON l.tenant_id = t.id
    LEFT JOIN token_logs tl ON l.conversation_id = tl.conversation_id
    GROUP BY l.id, t.company_name
    ORDER BY l.created_at DESC
  `);

  // FETCH ALL ORDERS FOR ADMIN
  const ordersRes = await adminDb.query(`
    SELECT o.*, t.company_name as tenant_name
    FROM orders o
    LEFT JOIN tenants t ON o.tenant_id = t.id
    ORDER BY o.created_at DESC
  `);

  return (
    <AdminDashboardClient 
      tenants={tenantsRes.rows} 
      leads={leadsRes.rows} 
      orders={ordersRes.rows}
      stats={stats} 
      username={user.username} 
    />
  );
}