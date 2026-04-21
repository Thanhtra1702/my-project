'use client'

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TenantModal from './tenants/TenantModal';
import { getChatHistory, logout, toggleOrderProcessed } from '../actions';

// --- ICONS ---
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const ShoppingBagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const RefreshIcon = ({ spin }: { spin: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-700 ${spin ? 'animate-spin' : ''}`}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const XMarkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

export default function AdminDashboardClient({ tenants, leads, orders: initialOrders, stats, username }: { tenants: any[], leads: any[], orders: any[], stats: any, username: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tenants' | 'leads' | 'orders'>('tenants');
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => { setIsRefreshing(true); router.refresh(); setTimeout(() => setIsRefreshing(false), 1000); };
  const handleToggleOrderProcessed = async (orderId: number, currentStatus: boolean) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_processed: !currentStatus } : o)); await toggleOrderProcessed(orderId, currentStatus); };
  const handleViewChat = async (lead: any) => {
    setSelectedLead(lead); setLoadingChat(true); setMessages([]);
    const history = await getChatHistory(lead.conversation_id, lead.tenant_id);
    setMessages(Array.isArray(history) ? history : []); setLoadingChat(false);
  };

  const filteredTenants = useMemo(() => {
    let res = tenants.filter(t => t.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.username?.toLowerCase().includes(searchTerm.toLowerCase()));
    res.sort((a, b) => sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return res;
  }, [tenants, searchTerm, sortOrder]);

  const filteredLeads = useMemo(() => {
    let res = leads.filter(l => {
      const matchesSearch = l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || l.phone_number?.includes(searchTerm) || l.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTenant = tenantFilter === 'all' || l.tenant_id.toString() === tenantFilter;
      return matchesSearch && matchesTenant;
    });
    res.sort((a, b) => sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return res;
  }, [leads, searchTerm, sortOrder, tenantFilter]);

  const filteredOrders = useMemo(() => {
    let res = orders.filter(o => {
      const matchesSearch = o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone_number?.includes(searchTerm) || o.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTenant = tenantFilter === 'all' || o.tenant_id.toString() === tenantFilter;
      return matchesSearch && matchesTenant;
    });
    res.sort((a, b) => sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return res;
  }, [orders, searchTerm, sortOrder, tenantFilter]);

  const displayedData = activeTab === 'tenants' ? filteredTenants : activeTab === 'leads' ? filteredLeads : filteredOrders;
  const paginatedData = displayedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 border-b border-slate-100">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain mb-4" />
          <h1 className="text-sm font-bold text-slate-800 leading-none truncate">BlueAI Admin Central</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest truncate">Admin: <span className="text-[#007BFF] font-bold">{username}</span></p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <TabVerticalButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} label="Danh sách đối tác" icon={<HomeIcon />} />
          <TabVerticalButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Cuộc trò chuyện" icon={<UsersIcon />} />
          <TabVerticalButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Quản trị Đơn hàng" icon={<ShoppingBagIcon />} />
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-3">
          <button onClick={() => logout()} className="flex items-center gap-2 w-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"><LogOutIcon /> Thoát</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* MOBILE HEADER */}
        <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex justify-between items-center p-4">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            <button onClick={() => logout()} className="p-2 text-slate-400"><LogOutIcon /></button>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide border-t border-slate-50">
            <TabButton active={activeTab === 'tenants'} onClick={() => setActiveTab('tenants')} label="Đối tác" />
            <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Trò chuyện" />
            <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Đơn hàng" />
          </div>
        </div>

        <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-1">
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Tổng đối tác" value={stats.total_tenants} unit="CÔNG TY" />
              <StatCard label="Tổng đơn hàng" value={stats.total_orders} unit="ĐƠN HÀNG" />
              <StatCard label="Token toàn hệ thống" value={Number(stats.total_system_tokens).toLocaleString()} unit="TOTAL USAGE" />
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex justify-between items-end gap-4 mt-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
                  {activeTab === 'tenants' ? 'Quản lý danh sách đối tác' : activeTab === 'leads' ? 'Dữ liệu hội thoại toàn cục' : 'Quản trị đơn hàng hệ thống'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {activeTab === 'tenants' ? 'Phát triển Tenancy, giới hạn sử dụng và cấp quyền.' : activeTab === 'leads' ? 'Theo dõi nội dung Chat AI giữa bot và người dùng của tất cả các tenant.' : 'Theo dõi và quản lý trạng thái xử lý đơn hàng của các đối tác.'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRefresh} className="p-2.5 bg-white border border-slate-200 rounded-sm text-slate-500 hover:text-[#007BFF] shadow-sm transition-all"><RefreshIcon spin={isRefreshing} /></button>
                {activeTab === 'tenants' && (
                  <button onClick={() => { setSelectedTenant(null); setShowModal(true); }} className="px-4 py-2 bg-[#007BFF] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#0066CC] transition-all shadow-sm">+ Thêm đối tác</button>
                )}
              </div>
            </div>

            {/* FILTERS */}
            <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><SearchIcon /></div>
                <input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold outline-none focus:border-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                {(activeTab === 'leads' || activeTab === 'orders') && (
                  <select className="flex-1 lg:w-48 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold text-slate-600 outline-none" value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)}>
                    <option value="all">Tất cả đối tác</option>
                    {tenants.map((t: any) => (<option key={t.id} value={t.id}>{t.company_name}</option>))}
                  </select>
                )}
                <select className="flex-1 lg:w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold text-slate-600 outline-none" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}>
                  <option value="desc">Mới nhất</option>
                  <option value="asc">Cũ nhất</option>
                </select>
              </div>
            </div>

            {/* MAIN TABLE */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hidden md:block text-xs">
              <table className="w-full text-left tracking-tight">
                <thead className="bg-slate-50 border-b border-slate-100 uppercase">
                  {activeTab === 'tenants' ? (
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">ID</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Khách hàng / Email</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Tài khoản</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  ) : activeTab === 'leads' ? (
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Khách hàng</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Đối tác (Tenant)</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Tokens</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Ngày tham gia</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Đơn hàng / SĐT</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Đối tác (Tenant)</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Thành tiền</th>
                      <th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-center">Trạng thái</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={10} className="p-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu.</td></tr>
                  ) : activeTab === 'tenants' ? (
                      (paginatedData as any[]).map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4"><span className="bg-blue-50 text-[#007BFF] font-black text-[10px] px-2 py-1 rounded-sm border border-blue-100">#{t.id}</span></td>
                          <td className="px-6 py-4 font-bold text-slate-800">{t.company_name} <p className="text-[10px] font-bold text-slate-400 mt-0.5 normal-case">{t.email || 'N/A'}</p></td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-600">{t.username}</td>
                          <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedTenant(t); setShowModal(true); }} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all">Sửa</button></td>
                        </tr>
                    ))
                  ) : activeTab === 'leads' ? (
                    (paginatedData as any[]).map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 group">
                        <td className="px-6 py-4 font-bold text-slate-800">Khách hàng #{l.id.toString().padStart(2, '0')}</td>
                        <td className="px-6 py-4"><span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-sm">{l.tenant_name}</span></td>
                        <td className="px-6 py-4 text-right font-bold text-[#007BFF]">{Number(l.total_chat_tokens).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-slate-400 font-bold">{new Date(l.created_at).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4 text-right"><button onClick={() => handleViewChat(l)} className="px-3 py-1.5 bg-[#007BFF] text-white text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#0066CC] transition-all">Xem nội dung</button></td>
                      </tr>
                    ))
                  ) : (
                    (paginatedData as any[]).map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50 group">
                        <td className="px-6 py-4"><button onClick={() => setSelectedOrder(o)} className="font-bold text-slate-800 hover:text-[#007BFF] transition-colors border-b border-transparent hover:border-[#007BFF] leading-tight">{o.customer_name}</button><p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">{o.phone_number}</p></td>
                        <td className="px-6 py-4"><span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-sm">{o.tenant_name}</span></td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{Number(o.total_amount).toLocaleString()} đ</td>
                        <td className="px-6 py-4 text-center"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${o.is_processed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{o.is_processed ? 'XONG' : 'MỚI'}</span></td>
                        <td className="px-6 py-4 text-right"><button onClick={() => setSelectedOrder(o)} className="px-3 py-1.5 bg-slate-100/80 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all">Chi tiết</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="md:hidden space-y-3">
              {paginatedData.map((item: any) => (
                <div key={item.id} className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-50 text-[#007BFF] font-black text-[10px] px-2 py-1 rounded-sm border border-blue-100">#{item.id}</span>
                      <div>
                        <p className="font-bold text-slate-800">{activeTab === 'tenants' ? item.company_name : activeTab === 'leads' ? `Khách hàng #${item.id.toString().padStart(2, '0')}` : item.customer_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{activeTab === 'tenants' ? item.username : item.tenant_name}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => activeTab === 'tenants' ? (setSelectedTenant(item), setShowModal(true)) : activeTab === 'leads' ? handleViewChat(item) : setSelectedOrder(item)} className="w-full py-3 bg-[#007BFF] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">CHỌN XEM</button>
                </div>
              ))}
              {/* PAGINATION CONTROLS */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Hiển thị <span className="text-slate-700">{paginatedData.length}</span> / {displayedData.length} kết quả
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1.5 px-4 font-bold text-[11px] text-slate-800">
                    <span className="text-[#007BFF]">{currentPage}</span>
                    <span className="text-slate-300">/</span>
                    <span>{Math.ceil(displayedData.length / itemsPerPage) || 1}</span>
                  </div>
                  <button 
                    disabled={currentPage >= Math.ceil(displayedData.length / itemsPerPage)}
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(displayedData.length / itemsPerPage), prev + 1))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-sm text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showModal && <TenantModal tenant={selectedTenant} onClose={() => setShowModal(false)} />}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-xl border border-slate-200 shadow-[0_25px_70px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">
             {/* Header: Minimal Identity */}
            <div className="px-10 py-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#007BFF] rounded-full"></div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">Chi tiết vận đơn #{selectedOrder.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 hover:bg-slate-100 rounded-sm transition-colors text-slate-400"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row h-[550px]">
              {/* Left Column: Essential Record */}
              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                <div className="grid grid-cols-2 gap-x-16 gap-y-10">
                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-normal">Thông tin khách hàng</h4>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-900">{selectedOrder.customer_name}</p>
                      <p className="text-sm text-slate-500">{selectedOrder.phone_number}</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-normal">Ghi nhận bởi đối tác</h4>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">{selectedOrder.tenant_name || "Hệ thống BlueAI"}</p>
                      <p className="text-[11px] text-slate-400">ID: {selectedOrder.tenant_id} • {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                  </section>

                  <section className="col-span-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-normal">Địa chỉ giao nhận</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {selectedOrder.address || "Chưa ghi nhận địa chỉ chi tiết cụ thể."}
                      </p>
                    </div>
                  </section>

                  <section className="col-span-2">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-normal">Danh mục hàng hóa</h4>
                    <div className="border border-slate-200 rounded-sm overflow-hidden bg-white">
                      <div className="bg-slate-50/50 px-5 py-2.5 border-b border-slate-200 grid grid-cols-12 gap-4">
                        <span className="col-span-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">Số lượng</span>
                        <span className="col-span-10 text-[9px] font-bold text-slate-400 uppercase tracking-tight">Chi tiết mặt hàng & Đơn giá</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {selectedOrder.order_details?.split('\n').filter((l: string) => l.trim()).map((line: string, idx: number) => {
                          const parts = line.split('x ');
                          const qty = parts.length > 1 ? parts[0] + 'x' : '';
                          const content = parts.length > 1 ? parts.slice(1).join('x ') : line;
                          
                          return (
                            <div key={idx} className="px-5 py-4 grid grid-cols-12 gap-4 items-center group hover:bg-slate-50/50 transition-colors">
                              <div className="col-span-2">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-50 text-[#007BFF] text-[11px] font-bold border border-blue-100">
                                  {qty || '1x'}
                                </span>
                              </div>
                              <div className="col-span-10 text-sm text-slate-700 font-semibold leading-relaxed">
                                {content}
                              </div>
                            </div>
                          );
                        })}
                        {(!selectedOrder.order_details || selectedOrder.order_details.trim() === "") && (
                          <div className="p-8 text-center text-slate-400 text-xs italic font-medium">
                            Chưa có thông tin sản phẩm cụ thể.
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Right Column: Processing Panel */}
              <div className="w-full lg:w-80 bg-slate-50 border-l border-slate-200 p-10 flex flex-col justify-between">
                <div className="space-y-10">
                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-6 tracking-normal">Chi tiết thanh toán</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-500">Tổng cộng</span>
                        <span className="text-2xl font-bold text-slate-900 leading-none">
                          {Number(selectedOrder.total_amount).toLocaleString()} <span className="text-xs font-medium text-slate-400">đ</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-sm mt-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase pl-1">Pháp lý</span>
                        <span className="text-[9px] font-bold text-[#007BFF] uppercase pr-1">Vận chuyển COD</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-normal">Trạng thái vận đơn</h4>
                    <select 
                      value={selectedOrder.is_processed ? 'completed' : 'processing'}
                      onChange={(e) => {
                        const val = e.target.value === 'completed';
                        handleToggleOrderProcessed(selectedOrder.id, !val);
                        setSelectedOrder(prev => prev ? {...prev, is_processed: val} : null);
                      }}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-sm text-xs font-bold outline-none focus:border-[#007BFF] appearance-none cursor-pointer"
                    >
                      <option value="new" disabled>Đơn hàng mới</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipping">Bắt đầu giao hàng</option>
                      <option value="completed">Đã bàn giao khách</option>
                      <option value="cancelled">Hủy bỏ đơn hàng</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-3 italic font-medium leading-relaxed">
                      * Cập nhật trạng thái sẽ tự động lưu vào nhật ký vận đơn.
                    </p>
                  </section>
                </div>

                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="w-full py-4 bg-slate-800 text-white font-bold text-xs uppercase tracking-wide rounded-sm hover:bg-slate-900 transition-colors shadow-lg active:scale-[0.98]"
                >
                  Xác nhận & Thoát
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full lg:h-[85vh] lg:rounded-sm border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><div><h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Cuộc trò chuyện: Khách hàng #{selectedLead.id.toString().padStart(2, '0')}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tenant: {selectedLead.tenant_name}</p></div><button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><CloseIcon /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scrollbar-hide">
              {loadingChat ? (<div className="flex justify-center py-20 animate-pulse text-slate-300"><RefreshIcon spin={true} /></div>) : messages.length === 0 ? (<div className="text-center py-40 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Không có lịch sử hội thoại</div>) : (messages.map((m, i) => (<div key={i} className="space-y-2">{m.query && <div className="flex justify-end"><div className="bg-white border border-slate-200 p-4 rounded-sm text-sm font-semibold text-slate-700 max-w-[85%]">{m.query}</div></div>}{m.answer && <div className="flex justify-start"><div className="bg-[#007BFF] text-white p-4 rounded-sm text-sm font-medium max-w-[85%] border-l-4 border-blue-500 whitespace-pre-wrap">{m.answer}</div></div>}</div>)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---
function TabButton({ active, onClick, label }: any) { return (<button onClick={onClick} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${active ? 'border-[#007BFF] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>); }
function TabVerticalButton({ active, onClick, label, icon }: any) { return (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-[#007BFF] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><div className={`shrink-0 ${active?'text-white':'text-slate-400'}`}>{icon}</div>{label}</button>); }
function StatCard({ label, value, unit }: any) { return (<div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">{label}</p><div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-slate-900 tracking-tighter">{value}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span></div></div>); }