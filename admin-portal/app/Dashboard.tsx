'use client'

import { useState, useMemo, useTransition, useEffect } from 'react';
import { getChatHistory, logout, getSmartStats, toggleOrderProcessed } from './actions';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from 'recharts';

// --- ICONS ---
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const ChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const RefreshIcon = ({ spin }: { spin: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-700 ${spin ? 'animate-spin' : ''}`}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const SortIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>);
const ShoppingBagIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const XMarkIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const MapPinIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>);
const BarChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);

// --- INTERFACES ---
interface Lead { id: number; customer_name: string; phone_number: string; note: string; conversation_id: string; created_at: string; total_chat_tokens: number; }
interface Order { id: number; customer_name: string; phone_number: string; address: string; order_details: string; total_amount: number; is_processed: boolean; created_at: string; conversation_id: string; }
interface DashboardProps { leads: Lead[]; orders: Order[]; tenantId: string; companyName: string; email: string; stats: any; chartData: any[]; isSystemLocked: boolean; tokenLimit: number; smartStats: { topTopics: { name: string; value: number }[]; knowledgeGaps: { question: string; created_at: string }[]; peakHours: { hour: string; count: number }[]; lastUpdated: string; }; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-sm text-xs z-50">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-[#007BFF] font-bold">{payload[0].name}: {Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ leads, orders: initialOrders, tenantId, companyName, email, stats, chartData, isSystemLocked, tokenLimit, smartStats }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'smart' | 'orders'>('overview');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [localSmartStats, setLocalSmartStats] = useState(smartStats);
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => { setIsRefreshing(true); router.refresh(); setTimeout(() => setIsRefreshing(false), 1000); };
  const handleToggleOrderProcessed = async (orderId: number, currentStatus: boolean) => { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_processed: !currentStatus } : o)); await toggleOrderProcessed(orderId, currentStatus); };
  const handleViewChat = async (lead: Lead) => { setSelectedLead(lead); setLoadingChat(true); setMessages([]); const history = await getChatHistory(lead.conversation_id, Number(tenantId)); setMessages(Array.isArray(history) ? history : []); setLoadingChat(false); };
  const handleRangeChange = async (range: '7d' | '30d' | '90d' | 'all' | 'custom') => { if (range === 'custom') return; setSelectedRange(range); let startDate: string | undefined; const days = range === '7d' ? 7 : range === '30d' ? 30 : 90; const start = new Date(); start.setDate(start.getDate() - days); startDate = range === 'all' ? 'all' : start.toISOString(); const newData = await getSmartStats(Number(tenantId), startDate, new Date().toISOString()); if (newData) setLocalSmartStats(newData); };

  const usagePercent = Math.min((Number(stats.total_tokens_all_time) / (tokenLimit || 1)) * 100, 100);

  const filteredLeads = useMemo(() => {
    let res = leads.filter(l => l.id.toString().includes(searchTerm) || l.phone_number?.includes(searchTerm) || l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    res.sort((a, b) => sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return res;
  }, [leads, searchTerm, sortOrder]);

  const filteredOrders = useMemo(() => {
    let res = orders.filter(o => o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || o.phone_number?.includes(searchTerm));
    res.sort((a, b) => sortOrder === 'desc' ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return res;
  }, [orders, searchTerm, sortOrder]);

  const displayedData = activeTab === 'leads' ? filteredLeads : filteredOrders;
  const paginatedData = displayedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-20">
        <div className="p-6 border-b border-slate-100">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain mb-4" />
          <h1 className="text-sm font-bold text-slate-800 leading-none truncate">{companyName || 'BlueAI'}</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1.5 tracking-widest truncate">{email || `ID: #${tenantId}`}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <TabVerticalButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tổng quan" icon={<HomeIcon />} />
          <TabVerticalButton active={activeTab === 'smart'} onClick={() => setActiveTab('smart')} label="Thống kê" icon={<ChartIcon />} />
          <TabVerticalButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Đơn hàng" icon={<ShoppingBagIcon />} />
          <TabVerticalButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Cuộc trò chuyện" icon={<UsersIcon />} />
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-3">
          <button onClick={() => logout()} className="flex items-center gap-2 w-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all"><LogOutIcon /> Thoát</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {isSystemLocked && <div className="bg-rose-500 text-white text-center py-2 text-[10px] font-bold uppercase tracking-widest">Hệ thống bị khóa</div>}
        {/* MOBILE HEADER */}
        <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex justify-between items-center p-4">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
            <button onClick={() => logout()} className="p-2 text-slate-400"><LogOutIcon /></button>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide border-t border-slate-50">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tổng quan" />
            <TabButton active={activeTab === 'smart'} onClick={() => setActiveTab('smart')} label="Thống kê" />
            <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Đơn hàng" />
            <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Cuộc trò chuyện" />
          </div>
        </div>

        <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Hội thoại hôm nay" value={stats.chats_today} unit="Lượt" />
                <StatCard label="Tokens hôm nay" value={Number(stats.tokens_today).toLocaleString()} unit="Tokens" />
                <StatCard label="Tổng hội thoại" value={leads.length} unit="Lượt" />
                <StatCard label="Tổng đơn hàng" value={orders.length} unit="Đơn" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Lượt trò chuyện 7 ngày</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} /><Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} /><Bar dataKey="lead_count" fill="#334155" radius={[2, 2, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer></div></div>
                <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Token sử dụng theo ngày</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="token_count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.05} strokeWidth={2} /></AreaChart></ResponsiveContainer></div></div>
              </div>
            </div>
          ) : activeTab === 'smart' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end"><h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Thống kê nội dung</h2><div className="flex bg-white p-0.5 border border-slate-200 rounded-sm shadow-sm">{(['7d', '30d', '90d', 'all'] as const).map(r => (<button key={r} onClick={() => handleRangeChange(r)} className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${selectedRange === r ? 'bg-[#007BFF] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{r==='7d'?'7 ngày':r==='30d'?'30 ngày':r==='90d'?'90 ngày':'Tất cả'}</button>))}</div></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden h-[450px] flex flex-col"><div className="p-4 border-b border-slate-100"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhu cầu nổi bật</h3></div><div className="flex-1 overflow-y-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 sticky top-0"><tr><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest">Nội dung</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-right">Lượt hỏi</th></tr></thead><tbody className="divide-y divide-slate-50">{localSmartStats.topTopics.map((t, i) => (<tr key={i} className="hover:bg-slate-50"><td className="px-4 py-3 font-semibold text-slate-700">{t.name}</td><td className="px-4 py-3 text-right font-bold text-[#007BFF]">{t.value}</td></tr>))}</tbody></table></div></div>
                <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden h-[450px] flex flex-col"><div className="p-4 border-b border-slate-100"><h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cần cập nhật kiến thức</h3></div><div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">{localSmartStats.knowledgeGaps.map((g, i) => (<div key={i} className="p-3 bg-white border border-slate-200 rounded-sm shadow-sm"><p className="text-xs font-bold text-slate-800">"{g.question}"</p><p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{new Date(g.created_at).toLocaleDateString('vi-VN')} {new Date(g.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p></div>))}</div></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-end">
                <div><h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{activeTab === 'leads' ? 'Danh sách cuộc trò chuyện' : 'Danh sách đơn hàng'}</h2><p className="text-xs text-slate-500 font-medium mt-1">{activeTab === 'leads' ? 'Theo dõi nội dung các cuộc hội thoại AI.' : 'Quản lý đơn hàng phát sinh từ Chatbot.'}</p></div>
                <button onClick={handleRefresh} className="p-2.5 bg-white border border-slate-200 rounded-sm text-slate-500 hover:text-[#007BFF] shadow-sm"><RefreshIcon spin={isRefreshing} /></button>
              </div>
              <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm flex flex-col md:flex-row gap-4"><div className="relative flex-1 w-full"><div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><SearchIcon /></div><input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold outline-none focus:border-slate-400" onChange={(e) => setSearchTerm(e.target.value)} /></div><div className="flex gap-2 w-full md:w-auto"><select className="flex-1 md:w-40 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold text-slate-600 outline-none" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}><option value="desc">Mới nhất</option><option value="asc">Cũ nhất</option></select><select className="flex-1 md:w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold text-slate-600 outline-none" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}><option value={50}>50 dòng</option><option value={100}>100 dòng</option></select></div></div>
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left text-xs tracking-tight">
                  <thead className="bg-slate-50 border-b border-slate-100 uppercase">
                    {activeTab === 'leads' ? (
                      <tr><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Cuộc trò chuyện</th><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Tokens</th><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Thời gian</th><th className="px-6 py-4"></th></tr>
                    ) : (
                      <tr><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Khách hàng / SĐT</th><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest">Địa chỉ giao</th><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-right">Tổng tiền</th><th className="px-6 py-4 font-bold text-slate-400 text-[10px] tracking-widest text-center">Trạng thái</th><th className="px-6 py-4"></th></tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedData.length === 0 ? (<tr><td colSpan={10} className="p-12 text-center text-slate-400 italic">Không có dữ liệu.</td></tr>) : activeTab === 'leads' ? (
                      (paginatedData as Lead[]).map(l => (<tr key={l.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-bold text-slate-700">Khách hàng #{l.id.toString().padStart(2, '0')}</td><td className="px-6 py-4 text-right font-bold text-[#007BFF]">{Number(l.total_chat_tokens).toLocaleString()}</td><td className="px-6 py-4 text-right text-slate-400 font-bold">{new Date(l.created_at).toLocaleDateString('vi-VN')}</td><td className="px-6 py-4 text-right"><button onClick={() => handleViewChat(l)} className="px-3 py-1.5 bg-[#007BFF] text-white text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#0066CC] transition-all">Xem nội dung</button></td></tr>))
                    ) : (
                      (paginatedData as Order[]).map(o => (
                        <tr key={o.id} className="hover:bg-slate-50 group border-b border-slate-50 last:border-0 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setSelectedOrder(o)}
                                className="font-bold text-slate-800 hover:text-[#007BFF] transition-colors border-b border-transparent hover:border-[#007BFF] leading-tight"
                              >
                                {o.customer_name}
                              </button>
                              <button 
                                onMouseEnter={() => setPreviewOrder(o)}
                                onMouseLeave={() => setPreviewOrder(null)}
                                className="p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">{o.phone_number}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate text-[11px] font-medium">{o.address || o.order_details}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 tabular-nums">{Number(o.total_amount).toLocaleString()} đ</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${
                              o.is_processed 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${o.is_processed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              {o.is_processed ? 'XONG' : 'MỚI'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 isolate">
                              <button 
                                onClick={() => setSelectedOrder(o)} 
                                className="px-3 py-1.5 bg-slate-100/80 text-slate-600 text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all"
                              >
                                Chi tiết
                              </button>
                              <button 
                                onClick={() => handleToggleOrderProcessed(o.id, o.is_processed)}
                                className={`p-1.5 rounded-sm transition-all ${o.is_processed ? 'text-slate-300 hover:text-amber-500' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                title={o.is_processed ? "Đánh dấu là mới" : "Đánh dấu là xong"}
                              >
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT */}
              <div className="md:hidden space-y-3">
                {paginatedData.map((item: any) => (
                  <div key={item.id} className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-800">{activeTab === 'leads' ? `Khách hàng #${item.id.toString().padStart(2, '0')}` : item.customer_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      {activeTab === 'orders' && (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm ${item.is_processed ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                          {item.is_processed ? 'XONG' : 'MỚI'}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => activeTab === 'leads' ? handleViewChat(item) : setSelectedOrder(item)} 
                      className="w-full py-3 bg-[#007BFF] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm"
                    >
                      {activeTab === 'leads' ? 'XEM HỘI THOẠI' : 'CHI TIẾT ĐƠN'}
                    </button>
                  </div>
                ))}
              </div>

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
          )}
        </div>
      </main>

      {/* PREVIEW POPUP (Floating) */}
      {previewOrder && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[300px] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/95 text-white p-5 rounded-sm shadow-2xl border border-slate-700 backdrop-blur-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Xem nhanh đơn hàng</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-400">{previewOrder.customer_name}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{previewOrder.phone_number}</p>
              </div>
              <div className="pt-3 border-t border-[#007BFF]">
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium italic">"{previewOrder.order_details}"</p>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#007BFF]">
                <span className="text-[10px] font-bold text-slate-500">TỔNG CỘNG</span>
                <span className="text-sm font-bold text-emerald-400">{Number(previewOrder.total_amount).toLocaleString()}đ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl h-full sm:h-[85vh] sm:rounded-sm border border-slate-200 shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Hội thoại: Khách hàng #{selectedLead.id.toString().padStart(2, '0')}</h3><button onClick={() => setSelectedLead(null)}><CloseIcon /></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">{loadingChat ? (<div className="flex justify-center py-20 animate-spin text-slate-300"><RefreshIcon spin={true} /></div>) : messages.length === 0 ? (<div className="text-center py-40 text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Không có lịch sử hội thoại nội bộ</div>) : (messages.map((m, i) => (<div key={i} className="space-y-2">{m.query && (<div className="flex justify-end"><div className="bg-white border border-slate-200 p-3 rounded-sm text-sm font-semibold text-slate-700 max-w-[85%]">{m.query}</div></div>)}{m.answer && (<div className="flex justify-start"><div className="bg-[#007BFF] text-white p-3 rounded-sm text-sm font-medium max-w-[85%] border-l-4 border-blue-500 whitespace-pre-wrap">{m.answer}</div></div>)}</div>)))}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---
function TabButton({ active, onClick, label }: any) { return (<button onClick={onClick} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${active ? 'border-[#007BFF] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>); }
function TabVerticalButton({ active, onClick, label, icon }: any) { return (<div className="px-2 py-0.5"><button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-sm border ${active ? 'bg-[#007BFF] text-white shadow-sm border-[#007BFF]' : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'}`}><div className={`shrink-0 ${active?'text-white':'text-slate-400'}`}>{icon}</div>{label}</button></div>); }
function StatCard({ label, value, unit }: any) { return (<div className="p-5 bg-white border border-slate-200 rounded-sm shadow-sm"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{label}</p><div className="flex items-baseline gap-2"><span className="text-2xl font-bold text-slate-900">{value}</span><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span></div></div>); }