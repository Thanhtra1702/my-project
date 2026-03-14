'use client'

import { useState, useMemo, useTransition, useEffect } from 'react';
// SỬA DÒNG NÀY: Dùng ./actions thay vì @/lib/actions để trỏ đúng file cùng thư mục app
import { getChatHistory, logout, toggleBotStatus, getSmartStats, toggleOrderProcessed } from './actions';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from 'recharts';

// --- ICONS (Giữ nguyên) ---
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const RefreshIcon = ({ spin }: { spin: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-700 ${spin ? 'animate-spin' : ''}`}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const SortIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);
const ChevronFirstIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>);
const ChevronLastIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>);
const ShoppingBagIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const AlertCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);

// --- INTERFACES (Giữ nguyên) ---
interface Lead {
  id: number;
  customer_name: string;
  phone_number: string;
  note: string;
  conversation_id: string;
  created_at: string;
  total_chat_tokens: number;
}

interface Order {
  id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  order_details: string;
  total_amount: number;
  is_processed: boolean;
  created_at: string;
  conversation_id: string;
}

interface DashboardProps {
  leads: Lead[];
  orders: Order[];
  tenantId: string;
  companyName: string;
  email: string;
  stats: any;
  chartData: any[];
  isSystemLocked: boolean;
  initialBotStatus: boolean;
  tokenLimit: number;
  smartStats: {
    topTopics: { name: string; value: number }[];
    knowledgeGaps: { question: string; created_at: string }[];
    peakHours: { hour: string; count: number }[];
    lastUpdated: string;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-sm z-50">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-blue-600 font-medium">
          {payload[0].name}: <span className="font-bold">{Number(payload[0].value).toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ leads, orders: initialOrders, tenantId, companyName, email, stats, chartData, isSystemLocked, initialBotStatus, tokenLimit, smartStats }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'smart' | 'orders'>('overview');
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // States Lọc & Sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Smart Dashboard States
  const [localSmartStats, setLocalSmartStats] = useState(smartStats);
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoadingSmart, setIsLoadingSmart] = useState(false);

  // Cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // States Hệ thống
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [botEnabled, setBotEnabled] = useState(initialBotStatus);
  const [isPending, startTransition] = useTransition();

  // --- ACTIONS ---
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleToggleBot = () => {
    if (isSystemLocked) return;
    const newStatus = !botEnabled;
    setBotEnabled(newStatus);
    startTransition(async () => {
      await toggleBotStatus(newStatus);
    });
  };

  const handleToggleOrderProcessed = async (orderId: number, currentStatus: boolean) => {
    // Update local state first for instant feedback
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_processed: !currentStatus } : o));

    const result = await toggleOrderProcessed(orderId, currentStatus);
    if (!result.success) {
      // Revert if failed
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_processed: currentStatus } : o));
    }
  };

  const handleViewChat = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoadingChat(true);
    setMessages([]);

    const history = await getChatHistory(lead.conversation_id, Number(tenantId));

    if (Array.isArray(history)) {
      setMessages(history);
    } else {
      setMessages([]);
    }

    setLoadingChat(false);
  };

  const handleRangeChange = async (range: '7d' | '30d' | '90d' | 'all' | 'custom') => {
    setSelectedRange(range);

    if (range === 'custom') {
      return; // Wait for user to input dates and click apply
    }

    setIsLoadingSmart(true);
    let startDate: string | undefined;
    const endDate = new Date().toISOString();

    if (range === 'all') {
      startDate = 'all';
    } else {
      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString();
    }

    const newData = await getSmartStats(Number(tenantId), startDate, endDate);
    if (newData) {
      setLocalSmartStats(newData);
    }
    setIsLoadingSmart(false);
  };

  const handleCustomRangeApply = async () => {
    if (!customStartDate || !customEndDate) return;
    setIsLoadingSmart(true);
    const start = new Date(customStartDate).toISOString();
    const endDateObj = new Date(customEndDate);
    endDateObj.setHours(23, 59, 59, 999);
    const end = endDateObj.toISOString();

    const newData = await getSmartStats(Number(tenantId), start, end);
    if (newData) {
      setLocalSmartStats(newData);
    }
    setIsLoadingSmart(false);
  };

  const usagePercent = Math.min((Number(stats.total_tokens_all_time) / (tokenLimit || 1)) * 100, 100);

  // --- LOGIC FILTER ---
  const filteredLeads = useMemo(() => {
    let result = leads.filter(l =>
      l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone_number?.includes(searchTerm)
    );

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [leads, searchTerm, sortOrder]);

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o =>
      o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone_number?.includes(searchTerm) ||
      o.order_details?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchTerm, sortOrder]);

  const displayedData = activeTab === 'leads' ? filteredLeads : filteredOrders;
  const totalItems = activeTab === 'leads' ? filteredLeads.length : filteredOrders.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedData.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedData, currentPage, itemsPerPage]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (val: number) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val: 'desc' | 'asc') => {
    setSortOrder(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50">

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-opacity-90 backdrop-blur-md">
        {isSystemLocked && (
          <div className="bg-rose-500 text-white text-center py-2 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 uppercase">
            Hệ thống đang bị khóa bởi quản trị viên
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-8 sm:h-9 w-auto object-contain" />
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="max-w-[200px] sm:max-w-none">
                <h1 className="text-sm font-black tracking-tight text-slate-800 leading-none truncate">{companyName || 'BlueAI'}</h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider lowercase mt-1.5 truncate">{email || `ID: #${tenantId}`}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 pl-3 rounded-2xl border border-slate-100 shadow-inner">
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bot Status</p>
                  <p className={`text-[11px] font-bold ${botEnabled && !isSystemLocked ? 'text-emerald-600' : 'text-slate-400'}`}>{isSystemLocked ? 'LOCKED' : (botEnabled ? 'ENABLED' : 'DISABLED')}</p>
                </div>
                <button
                  onClick={handleToggleBot}
                  disabled={isSystemLocked || isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${botEnabled && !isSystemLocked ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'} ${isSystemLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                >
                  <span className={`${botEnabled && !isSystemLocked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-md`} />
                </button>
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <button onClick={() => logout()} className="p-2 sm:p-0 flex items-center gap-2 text-slate-400 hover:text-rose-600 transition-colors">
                <span className="hidden sm:inline text-sm font-bold uppercase tracking-widest">Thoát</span>
                <LogOutIcon />
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-6 sm:gap-8 mt-1 border-t border-slate-50/50">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tổng quan" />
            <TabButton active={activeTab === 'smart'} onClick={() => setActiveTab('smart')} label="Thống kê người dùng" />
            <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} label="Đơn hàng" />
            <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Danh sách khách hàng" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === 'overview' ? (
          <div className="space-y-6 sm:y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard label="Chat hôm nay" value={stats.chats_today} unit="Hội thoại" />
              <StatCard label="Token hôm nay" value={Number(stats.tokens_today).toLocaleString()} unit="Tokens" />

              <div className={`p-6 rounded-3xl border shadow-xl ring-1 ring-slate-900/5 bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white transition-all hover:shadow-2xl hover:scale-[1.02]`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100/70">Tổng tích lũy</p>
                  <div className="bg-white/10 p-1.5 rounded-lg border border-white/10"><BarChartIcon /></div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">{Number(stats.total_tokens_all_time).toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-blue-200 uppercase">/ {Number(tokenLimit).toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full mt-5 overflow-hidden shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${usagePercent > 90 ? 'bg-rose-400' : 'bg-white'}`} style={{ width: `${usagePercent}%` }}></div>
                </div>
                <p className="text-[10px] font-bold mt-3 uppercase tracking-tighter text-blue-100">Hiệu suất dùng: {usagePercent.toFixed(1)}%</p>
              </div>

              <StatCard label="Tổng đơn hàng" value={orders.length} unit="Đơn hàng" />
              <StatCard label="Tổng khách hàng" value={leads.length} unit="Khách hàng" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
                <div className="mb-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <h3>Khách hàng mới (Leads)</h3>
                  <span>7 Ngày gần nhất</span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="lead_count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} name="Khách hàng" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
                <div className="mb-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <h3>Sử dụng Token</h3>
                  <span>Lưu lượng theo ngày</span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="token_count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTokens)" name="Tokens" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'smart' ? (
          <div className="space-y-6 sm:y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Thống kê người dùng</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Nắm bắt nhu cầu thực tế và điểm mù kiến thức của Chatbot.</p>
              </div>

              {/* DATE RANGE SELECTOR */}
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0 shadow-inner">
                  {(['7d', '30d', '90d', 'all', 'custom'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRangeChange(r)}
                      disabled={isLoadingSmart}
                      className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedRange === r
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                        } disabled:opacity-50`}
                    >
                      {r === '7d' ? '7 Ngày' : r === '30d' ? '30 Ngày' : r === '90d' ? '90 Ngày' : r === 'all' ? 'Tất cả' : 'Tùy chỉnh'}
                    </button>
                  ))}
                </div>

                {selectedRange === 'custom' && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleCustomRangeApply}
                      disabled={isLoadingSmart || !customStartDate || !customEndDate}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isLoadingSmart && (
              <div className="flex items-center justify-center py-6 gap-3 animate-pulse bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Đang tải dữ liệu...</span>
              </div>
            )}

            {/* KPI Cards (Standard Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <StatCard label="Cụm từ ghi nhận" value={localSmartStats.topTopics.reduce((acc, t) => acc + t.value, 0)} unit="cụm từ hỏi" />
              <StatCard label="Thiếu kiến thức" value={localSmartStats.knowledgeGaps.length} unit="câu chưa xử lý" />
              <StatCard label="Giờ tương tác nhiều nhất" value={
                localSmartStats.peakHours.length > 0
                  ? localSmartStats.peakHours.reduce((max, p) => p.count > max.count ? p : max, localSmartStats.peakHours[0]).hour + '00'
                  : '--'
              } unit="cao điểm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* TOP NEEDS TABLE */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col h-[450px]">
                <div className="mb-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">
                  <h3>Nhu cầu khách hàng</h3>
                  <span>{selectedRange === '7d' ? '7 Ngày' : selectedRange === '30d' ? '30 Ngày' : selectedRange === '90d' ? '90 Ngày' : selectedRange === 'all' ? 'Tất cả' : 'Tùy chỉnh'}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-sm relative">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="pl-6 pr-4 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest">Truy vấn (Query)</th>
                        <th className="px-6 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Lượt hỏi</th>
                        <th className="pr-6 pl-4 py-3 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right w-32">Mức độ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {localSmartStats.topTopics.length === 0 ? (
                        <tr><td colSpan={3} className="p-12 text-center text-slate-400 italic">Không có dữ liệu.</td></tr>
                      ) : localSmartStats.topTopics.map((topic, i) => {
                        const maxVal = Math.max(...localSmartStats.topTopics.map(t => t.value));
                        const pct = (topic.value / (maxVal || 1)) * 100;
                        return (
                          <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="pl-6 pr-4 py-3.5 font-bold text-slate-700">{topic.name}</td>
                            <td className="px-6 py-3.5 font-black text-blue-600 text-right">{topic.value}</td>
                            <td className="pr-6 pl-4 py-3.5 text-right relative">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct > 80 ? 'bg-rose-500' : pct > 40 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 w-7">{Math.ceil(pct)}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KNOWLEDGE GAPS */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 flex flex-col h-[450px]">
                <div className="mb-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">
                  <h3>Điểm mù kiến thức cần bổ sung</h3>
                  <span>{localSmartStats.knowledgeGaps.length} câu</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                  {localSmartStats.knowledgeGaps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-300">🎉</div>
                      <p className="font-medium text-sm">Tuyệt vời! Không phát hiện lỗ hổng lớn nào.</p>
                    </div>
                  ) : localSmartStats.knowledgeGaps.map((gap, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-rose-100 hover:border-rose-300 hover:shadow-md transition-all group">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-[12px] font-black shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">?</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800 leading-snug">"{gap.question}"</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(gap.created_at).toLocaleDateString('vi-VN')} • {new Date(gap.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TRAFFIC ANALYSIS - Full Width */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50">
              <div className="mb-6 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <h3>Lưu lượng tương tác theo giờ</h3>
                <span>{selectedRange === 'custom' ? `Từ ${new Date(customStartDate || Date.now()).toLocaleDateString('vi-VN')} đến ${new Date(customEndDate || Date.now()).toLocaleDateString('vi-VN')}` : 'Trong ngày khép kín'}</span>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={localSmartStats.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(val: any) => `${val}h`} interval="preserveStartEnd" minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-800 p-3 shadow-xl rounded-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.hour}h00 - {payload[0].payload.hour + 1}h00</p>
                              <p className="text-sm font-black text-emerald-400">{payload[0].value} lượt tương tác</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{activeTab === 'leads' ? 'Tất cả khách hàng (Leads)' : 'Danh sách đơn hàng'}</h2>
                <p className="text-sm text-slate-500 font-medium">{activeTab === 'leads' ? 'Theo dõi thông tin và lịch sử hội thoại AI của bạn.' : 'Quản lý và cập nhật trạng thái các đơn hàng được chốt từ Chatbot.'}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshIcon spin={isRefreshing} />
                <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><SearchIcon /></div>
                <input type="text" placeholder={activeTab === 'leads' ? "Tìm kiếm tên, số điện thoại..." : "Tìm kiếm tên, SĐT, chi tiết đơn..."} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium text-slate-700" onChange={(e) => handleSearchChange(e.target.value)} />
              </div>
              <div className="relative min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><SortIcon /></div>
                <select className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer" value={sortOrder} onChange={(e) => handleSortChange(e.target.value as 'desc' | 'asc')}>
                  <option value="desc">Mới nhất trước</option>
                  <option value="asc">Cũ nhất trước</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="relative min-w-[140px]">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
                </div>
                <select
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                >
                  <option value={10}>Hiển thị: 10 dòng</option>
                  <option value={20}>Hiển thị: 20 dòng</option>
                  <option value={50}>Hiển thị: 50 dòng</option>
                  <option value={100}>Hiển thị: 100 dòng</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden md:block mx-1"></div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center lg:text-left">Kết quả: <span className="text-blue-600 font-black">{totalItems}</span></div>
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  {activeTab === 'leads' ? (
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Khách hàng</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Liên hệ</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Ghi chú</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Token Chat</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Thời gian</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Khách hàng / Đơn hàng</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Chi tiết đơn hàng</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Tổng tiền</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Thời gian</th>
                      <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Trạng thái xử lý</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 text-[13px]">
                  {paginatedData.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic font-medium">Bạn chưa có {activeTab === 'leads' ? 'khách hàng' : 'đơn hàng'} nào.</td></tr>
                  ) : activeTab === 'leads' ? (
                    (paginatedData as Lead[]).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><UserIcon /></div>
                            <div><p className="font-bold text-slate-800 leading-none">{lead.customer_name}</p><p className="text-[10px] text-slate-400 font-mono mt-1">ID: #{lead.id}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600 font-mono text-[11px]">{lead.phone_number}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-medium">{lead.note || "---"}</td>
                        <td className="px-6 py-4"><span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-100 leading-none">{Number(lead.total_chat_tokens).toLocaleString()}</span></td>
                        <td className="px-6 py-4 text-slate-400 text-[11px] font-bold">{new Date(lead.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleViewChat(lead)} className="bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white font-black p-2 px-4 rounded-lg transition-all text-[11px] uppercase tracking-wider">Xem Chat</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    (paginatedData as Order[]).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><ShoppingBagIcon /></div>
                            <div>
                              <p className="font-bold text-slate-800 leading-none">{order.customer_name}</p>
                              <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-tighter">{order.phone_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-medium">{order.order_details || "---"}</td>
                        <td className="px-6 py-4 font-black text-slate-800">{Number(order.total_amount).toLocaleString()} đ</td>
                        <td className="px-6 py-4 text-slate-400 text-[11px] font-bold">{new Date(order.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleOrderProcessed(order.id, order.is_processed)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all focus:outline-none ${order.is_processed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <span className={`${order.is_processed ? 'translate-x-[1.1rem]' : 'translate-x-[0.1rem]'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-md`} />
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${order.is_processed ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {order.is_processed ? 'Đã xử lý' : 'Chưa xử lý'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => {
                            // Reuse handleViewChat if conversation_id exists
                            if (order.conversation_id) handleViewChat({ ...order, customer_name: order.customer_name, phone_number: order.phone_number, note: order.order_details, total_chat_tokens: 0 } as any);
                          }} disabled={!order.conversation_id} className={`p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${order.conversation_id ? 'bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white' : 'text-slate-200 cursor-not-allowed'}`}>Xem Context</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden space-y-4">
              {paginatedData.length === 0 ? (
                <div className="bg-white p-12 text-center text-slate-400 italic font-medium rounded-3xl border border-dashed border-slate-200">Bạn chưa có {activeTab === 'leads' ? 'khách hàng' : 'đơn hàng'} nào.</div>
              ) : activeTab === 'leads' ? (
                (paginatedData as Lead[]).map((lead) => (
                  <div key={lead.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><UserIcon /></div>
                        <div>
                          <p className="font-black text-slate-800 leading-tight">{lead.customer_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: #{lead.id}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-blue-100 shrink-0">
                        {Number(lead.total_chat_tokens).toLocaleString()} Tokens
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-400 text-[10px] uppercase tracking-widest">SĐT</span>
                        <span className="text-blue-600 font-mono tracking-tighter">{lead.phone_number}</span>
                      </div>
                      {lead.note && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Yêu cầu/Ghi chú</span>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{lead.note}"</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-3 mt-1">
                        <span>{new Date(lead.created_at).toLocaleDateString('vi-VN')}</span>
                        <span>{new Date(lead.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button onClick={() => handleViewChat(lead)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-blue-600/20 text-xs transition-all tracking-widest uppercase">Xem lịch sử Chat</button>
                    </div>
                  </div>
                ))
              ) : (
                (paginatedData as Order[]).map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><ShoppingBagIcon /></div>
                        <div>
                          <p className="font-black text-slate-800 leading-tight">{order.customer_name}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Đơn hàng #{order.id}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.is_processed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {order.is_processed ? 'Hoàn thành' : 'Mới'}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">SĐT</span>
                          <span className="text-slate-800 font-bold">{order.phone_number}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-1">Tổng tiền</span>
                          <span className="text-blue-600 font-black">{Number(order.total_amount).toLocaleString()} đ</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Chi tiết sản phẩm</span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{order.order_details}</p>
                        {order.address && (
                          <p className="text-[10px] text-slate-400 font-medium mt-2 border-t border-slate-200 pt-2 flex items-start gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            {order.address}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between bg-slate-100/50 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái xử lý</span>
                        <button
                          onClick={() => handleToggleOrderProcessed(order.id, order.is_processed)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${order.is_processed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200 shadow-sm'}`}
                        >
                          {order.is_processed ? <CheckCircleIcon /> : <AlertCircleIcon />}
                          {order.is_processed ? 'Đã xử lý' : 'Xử lý ngay'}
                        </button>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-3">
                        <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                        {order.conversation_id && (
                          <button onClick={() => handleViewChat({ ...order, customer_name: order.customer_name, phone_number: order.phone_number, note: order.order_details, total_chat_tokens: 0 } as any)} className="text-blue-600 hover:text-blue-700 underline font-black">Xem ngữ cảnh Chat</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages >= 1 && totalItems > 0 && (
              <div className="flex items-center justify-center gap-2 py-8">
                <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <ChevronFirstIcon />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${currentPage === 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <ChevronLeftIcon />
                  </button>

                  <div className="flex items-center gap-1 mx-1">
                    {(() => {
                      const pages = [];
                      const delta = 2; // Số trang hiển thị quanh trang hiện tại
                      const left = currentPage - delta;
                      const right = currentPage + delta;

                      for (let i = 1; i <= totalPages; i++) {
                        if (i === 1 || i === totalPages || (i >= left && i <= right)) {
                          pages.push(i);
                        } else if (i === left - 1 || i === right + 1) {
                          pages.push('...');
                        }
                      }

                      // Loại bỏ các dấu ... trùng lặp
                      const uniquePages = pages.filter((item, pos, self) => self.indexOf(item) === pos);

                      return uniquePages.map((p, idx) => (
                        p === '...' ? (
                          <span key={`gap-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-300 font-bold">...</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(Number(p))}
                            className={`w-9 h-9 rounded-xl text-[13px] font-black transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50'}`}
                          >
                            {p}
                          </button>
                        )
                      ));
                    })()}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <ChevronRightIcon />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${currentPage === totalPages ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                  >
                    <ChevronLastIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
        }
      </main>

      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300 overflow-hidden ring-1 ring-black/5">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm"><UserIcon /></div>
                <div>
                  <h3 className="font-black text-slate-800 leading-tight">{selectedLead.customer_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLead.phone_number}</p>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Khách hàng #{selectedLead.id}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 space-y-6 scrollbar-hide pb-24 sm:pb-8">
              {loadingChat ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang tải tin nhắn...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-16 h-16 bg-white rounded-full border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><MessageIcon /></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Chưa có lịch sử hội thoại</p>
                </div>
              ) : messages.map((msg, i) => (
                <div key={i} className="space-y-2 group">
                  {msg.query && (
                    <div className="flex justify-end animate-in slide-in-from-right-2 duration-300">
                      <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm text-sm font-medium max-w-[85%] shadow-lg shadow-blue-600/10 leading-relaxed">
                        {msg.query}
                      </div>
                    </div>
                  )}
                  {msg.answer && (
                    <div className="flex justify-start gap-3 animate-in slide-in-from-left-2 duration-300">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-blue-600 shrink-0 shadow-sm mt-1">AI</div>
                      <div className="bg-white border border-slate-200 text-slate-800 px-5 py-3 rounded-2xl rounded-tl-sm text-sm font-medium max-w-[85%] shadow-sm leading-relaxed border-l-4 border-l-blue-500 whitespace-pre-wrap">
                        {msg.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-white px-6 py-4 border-t border-slate-50 sm:hidden">
              <button onClick={() => setSelectedLead(null)} className="w-full bg-slate-100 text-slate-500 font-bold py-4 rounded-2xl text-[11px] uppercase tracking-widest">Đóng lịch sử</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- NEW ICONS ---
const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

// --- SUB COMPONENTS ---
const BarChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>
);
const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 pt-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
    >
      {label}
    </button>
  );
}
function StatCard({ label, value, unit, highlighted = false, icon }: any) {
  return (
    <div className={`p-6 rounded-3xl border shadow-sm shadow-slate-200/50 ring-1 ring-slate-900/5 transition-all hover:shadow-xl group hover:scale-[1.03] duration-300 ${highlighted ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${highlighted ? 'text-blue-100' : 'text-slate-400'}`}>{label}</p>
        {icon && <div className={`${highlighted ? 'text-blue-200' : 'text-slate-300'} group-hover:scale-110 transition-transform`}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1.5 align-bottom">
        <span className={`text-3xl font-black ${highlighted ? 'text-white' : 'text-slate-900'} tracking-tighter`}>{value}</span>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${highlighted ? 'text-blue-200' : 'text-slate-400'} mb-1`}>{unit}</span>
      </div>
    </div>
  );
}