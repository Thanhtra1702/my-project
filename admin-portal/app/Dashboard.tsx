'use client'

import { useState, useMemo, useTransition } from 'react';
// SỬA DÒNG NÀY: Dùng ./actions thay vì @/lib/actions để trỏ đúng file cùng thư mục app
import { getChatHistory, logout, toggleBotStatus } from './actions';
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
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);

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

interface DashboardProps {
  leads: Lead[];
  tenantId: string;
  companyName: string;
  email: string;
  stats: any;
  chartData: any[];
  isSystemLocked: boolean;
  initialBotStatus: boolean;
  tokenLimit: number;
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

export default function Dashboard({ leads, tenantId, companyName, email, stats, chartData, isSystemLocked, initialBotStatus, tokenLimit }: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'embed'>('overview');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);

  // States Lọc & Sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

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
      await toggleBotStatus(botEnabled);
    });
  };

  const handleViewChat = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoadingChat(true);
    setMessages([]);

    // Gọi hàm từ actions.ts (giờ là gọi API)
    const history = await getChatHistory(lead.conversation_id, Number(tenantId));

    // SỬA: Không dùng .reverse() nữa vì Dify hoặc API đã trả về đúng thứ tự Cũ -> Mới
    if (Array.isArray(history)) {
      setMessages(history);
    } else {
      setMessages([]);
    }

    setLoadingChat(false);
  };

  // --- LOGIC FILTER (Giữ nguyên) ---
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

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val: 'desc' | 'asc') => {
    setSortOrder(val);
    setCurrentPage(1);
  };

  const usagePercent = Math.min((Number(stats.total_tokens_all_time) / (tokenLimit || 1)) * 100, 100);

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50/50">

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-opacity-90 backdrop-blur-md">
        {isSystemLocked && (
          <div className="bg-rose-500 text-white text-center py-2 text-xs font-bold tracking-wide flex items-center justify-center gap-2">
            HỆ THỐNG ĐANG BỊ KHÓA BỞI QUẢN TRỊ VIÊN.
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">B</div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">{companyName || 'BlueData'}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-medium text-slate-400 tracking-wider lowercase">{email || `Tenant ID: #${tenantId}`}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bot Status</p>
                  <p className={`text-xs font-bold ${botEnabled && !isSystemLocked ? 'text-emerald-600' : 'text-slate-500'}`}>{isSystemLocked ? 'Locked' : (botEnabled ? 'ON' : 'OFF')}</p>
                </div>
                <button onClick={handleToggleBot} disabled={isSystemLocked || isPending} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${botEnabled && !isSystemLocked ? 'bg-emerald-500' : 'bg-slate-300'} ${isSystemLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <span className={`${botEnabled && !isSystemLocked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm`} />
                </button>
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

              <button onClick={() => logout()} className="group flex items-center gap-2 text-slate-500 hover:text-red-600 text-sm font-medium transition-colors">
                <span className="hidden sm:inline">Thoát</span>
                <LogOutIcon />
              </button>
            </div>
          </div>
          <div className="flex gap-8 mt-1">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Tổng quan" />
            <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} label="Danh sách khách hàng" />
            <TabButton active={activeTab === 'embed'} onClick={() => setActiveTab('embed')} label="Mã nhúng" />
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl w-full mx-auto p-6 sm:p-8">
        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <StatCard label="Chat hôm nay" value={stats.chats_today} unit="Cuộc hội thoại" />
              <StatCard label="Token hôm nay" value={Number(stats.tokens_today).toLocaleString()} unit="Tokens usage" />

              <div className={`p-6 rounded-2xl border shadow-sm ring-1 ring-slate-900/5 bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white transition-all hover:shadow-md hover:scale-[1.02]`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Tổng Token tích lũy</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{Number(stats.total_tokens_all_time).toLocaleString()}</span>
                  <span className="text-sm font-medium text-blue-200">/ {Number(tokenLimit).toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/30 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-400' : 'bg-white/90'}`} style={{ width: `${usagePercent}%` }}></div>
                </div>
                <p className="text-[10px] font-bold mt-2 uppercase text-blue-200">Đã dùng {usagePercent.toFixed(1)}% giới hạn</p>
              </div>

              <StatCard label="Tổng khách hàng" value={leads.length} unit="Leads collected" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-6"><h3 className="text-base font-bold text-slate-800">Khách hàng mới (Leads)</h3></div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="lead_count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} name="Khách hàng" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-6"><h3 className="text-base font-bold text-slate-800">Lưu lượng Token sử dụng</h3></div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="token_count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" name="Tokens" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'leads' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header của Tab với Nút Làm mới */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Tất cả khách hàng (Leads)</h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi khách hàng và lịch sử hội thoại của bạn.</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshIcon spin={isRefreshing} />
                <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><SearchIcon /></div>
                <input type="text" placeholder="Tìm kiếm tên, số điện thoại..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700" onChange={(e) => handleSearchChange(e.target.value)} />
              </div>
              <div className="relative w-full md:w-auto min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><SortIcon /></div>
                <select className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer" value={sortOrder} onChange={(e) => handleSortChange(e.target.value as 'desc' | 'asc')}>
                  <option value="desc">Mới nhất trước</option>
                  <option value="asc">Cũ nhất trước</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
              <div className="text-xs font-bold text-slate-500 whitespace-nowrap">Kết quả: <span className="text-blue-600">{filteredLeads.length}</span></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Liên hệ</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Ghi chú</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Token Chat</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Thời gian</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLeads.length === 0 ? (
                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu nào.</td></tr>
                  ) : paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><UserIcon /></div>
                          <div><p className="font-bold text-slate-900">{lead.customer_name}</p><p className="text-[10px] text-slate-400 font-mono">ID: {lead.id}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 bg-slate-50/0 group-hover:bg-slate-50/0 rounded">{lead.phone_number}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{lead.note || "---"}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{Number(lead.total_chat_tokens).toLocaleString()}</span></td>
                      <td className="px-6 py-4 text-slate-500">{new Date(lead.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleViewChat(lead)} className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Xem Chat</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trang {currentPage} / {totalPages}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 bg-white'}`}><ChevronLeftIcon /></button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);
                      if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
                      const pages = []; for (let p = startPage; p <= endPage; p++) pages.push(p);
                      return pages.map(pageNum => (
                        <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}>{pageNum}</button>
                      ));
                    })()}
                  </div>
                  <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 bg-white'}`}><ChevronRightIcon /></button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Cấu hình mã nhúng</h2>
                <p className="text-sm text-slate-500 mt-1">Sử dụng đoạn mã sau để tích hợp Chatbot vào website của bạn.</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs">1</span>
                    Dán mã này vào cuối thẻ <code>&lt;body&gt;</code> website của bạn:
                  </h4>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                      {`<script>
  window.bluebotConfig = {
    tenantId: '${tenantId}',
    baseUrl: 'https://bluebot.vn'
  };
</script>
<script src="https://bluebot.vn/embed.js" defer></script>`}
                    </pre>
                    <button
                      onClick={() => {
                        const code = `<script>\n  window.bluebotConfig = {\n    tenantId: '${tenantId}',\n    baseUrl: 'https://bluebot.vn'\n  };\n</script>\n<script src="https://bluebot.vn/embed.js" defer></script>`;
                        navigator.clipboard.writeText(code);
                        alert('Đã sao chép mã nhúng!');
                      }}
                      className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-white/10 backdrop-blur-sm"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-amber-900">Lưu ý quan trọng:</h5>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        - Đảm bảo bạn đã cấu hình <b>Dify API Key</b> và <b>Dify App ID</b> trong phần Cấu hình để chatbot có thể hoạt động.<br />
                        - Chatbot này sẽ hiển thị dưới dạng một nút bong bóng nổi ở góc dưới bên phải màn hình website của bạn.<br />
                        - Mọi hội thoại sẽ được lưu lại trong danh sách khách hàng của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- CHAT MODAL --- */}
      {selectedLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{selectedLead.customer_name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 font-mono">{selectedLead.phone_number}</p>
                  <span className="text-slate-300">•</span>
                  <p className="text-xs font-bold text-blue-600">Token: {Number(selectedLead.total_chat_tokens).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
              {loadingChat ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">Chưa có lịch sử tin nhắn.</div>
              ) : messages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  {msg.query && <div className="flex justify-end"><div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-[85%] shadow-sm leading-relaxed">{msg.query}</div></div>}
                  {msg.answer && <div className="flex justify-start gap-3"><div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0 shadow-sm">AI</div><div className="bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm max-w-[85%] shadow-sm leading-relaxed">{msg.answer}</div></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS (Giữ nguyên) ---
function TabButton({ active, onClick, label }: any) {
  return <button onClick={onClick} className={`pb-3 text-sm font-semibold transition-all border-b-2 ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>{label}</button>
}
function StatCard({ label, value, unit, highlighted = false, icon }: any) {
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md group ${highlighted ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-start mb-2"><p className={`text-[11px] font-bold uppercase tracking-wider ${highlighted ? 'text-blue-100' : 'text-slate-400'}`}>{label}</p>{icon && <div className={`${highlighted ? 'text-blue-200' : 'text-slate-300'} group-hover:scale-110 transition-transform`}>{icon}</div>}</div>
      <div className="flex items-baseline gap-1"><span className={`text-3xl font-black ${highlighted ? 'text-white' : 'text-slate-900'}`}>{value}</span></div>
      <p className={`text-[10px] font-bold mt-1 uppercase ${highlighted ? 'text-blue-200' : 'text-slate-400'}`}>{unit}</p>
    </div>
  );
}