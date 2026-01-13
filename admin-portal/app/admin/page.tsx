import { adminDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logout } from '@/app/actions';
import AdminDashboardClient from './AdminDashboardClient';

const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);

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
      (SELECT COUNT(*) FROM tenants WHERE is_active = true AND role != 'SUPER_ADMIN') as active_tenants,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM token_logs) as total_system_tokens
    `);
  const stats = statsRes.rows[0] || { total_tenants: 0, active_tenants: 0, total_system_tokens: 0 };

  // QUERY CẬP NHẬT: Lấy thêm t.token_limit
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

  // Lấy danh sách khách hàng (leads) cho admin
  const leadsRes = await adminDb.query(`
    SELECT l.*, t.company_name as tenant_name, COALESCE(SUM(tl.total_tokens), 0) as total_chat_tokens
    FROM leads l
    LEFT JOIN tenants t ON l.tenant_id = t.id
    LEFT JOIN token_logs tl ON l.conversation_id = tl.conversation_id
    GROUP BY l.id, t.company_name
    ORDER BY l.created_at DESC
  `);

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="BlueData Logo" className="h-9 w-auto object-contain" />
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-800 leading-none">BlueAI Admin</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                  Quản trị: <span className="text-blue-600 font-black">{user.username}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-widest leading-none shadow-sm">Super Admin</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <form action={logout}>
                <button className="flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors text-sm font-bold uppercase tracking-widest group">
                  <span className="inline">Thoát</span>
                  <div className="group-hover:translate-x-1 transition-transform">
                    <LogOutIcon />
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto p-6 sm:p-8">
        <AdminDashboardClient tenants={tenantsRes.rows} leads={leadsRes.rows} stats={stats} />
      </main>
    </div>
  );
}