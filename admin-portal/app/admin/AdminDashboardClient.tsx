'use client'

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import TenantModal from './tenants/TenantModal';

const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const SortIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const RefreshIcon = ({ spin }: { spin: boolean }) => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-700 ${spin ? 'animate-spin' : ''}`}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);

import { getChatHistory } from '../actions';

export default function AdminDashboardClient({ tenants, leads, stats }: { tenants: any[], leads: any[], stats: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tenants' | 'leads'>('tenants');

    // States Lọc & Sắp xếp (Chung)
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [tenantFilter, setTenantFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // States Tenant
    const [showModal, setShowModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any>(null);

    // States Lead/Chat
    const [selectedLead, setSelectedLead] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingChat, setLoadingChat] = useState(false);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleViewChat = async (lead: any) => {
        setSelectedLead(lead);
        setLoadingChat(true);
        setMessages([]);
        const history = await getChatHistory(lead.conversation_id, lead.tenant_id);
        setMessages(history);
        setLoadingChat(false);
    };

    const handleTabChange = (tab: 'tenants' | 'leads') => {
        setActiveTab(tab);
        setSearchTerm('');
        setTenantFilter('all');
        setCurrentPage(1);
    };

    const filteredTenants = useMemo(() => {
        let result = tenants.filter(t =>
            t.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [tenants, searchTerm, sortOrder]);

    const filteredLeads = useMemo(() => {
        let result = leads.filter(l => {
            const matchesSearch = l.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.phone_number?.includes(searchTerm) ||
                l.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesTenant = tenantFilter === 'all' || l.tenant_id.toString() === tenantFilter;

            return matchesSearch && matchesTenant;
        });

        result.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [leads, searchTerm, sortOrder, tenantFilter]);

    const displayedData = activeTab === 'tenants' ? filteredTenants : filteredLeads;
    const totalPages = Math.ceil(displayedData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return displayedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [displayedData, currentPage]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <StatCard label="Tổng Tenants" value={stats.total_tenants} unit="Accounts" />
                <StatCard label="Đang Hoạt Động" value={stats.active_tenants} unit="Active Tenants" highlighted />
                <StatCard label="Tổng Token Hệ Thống" value={Number(stats.total_system_tokens).toLocaleString()} unit="Total Usage" />
            </div>

            <div className="flex gap-8 border-b border-slate-200">
                <button onClick={() => handleTabChange('tenants')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'tenants' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Danh sách Tenancy</button>
                <button onClick={() => handleTabChange('leads')} className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'leads' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Danh sách Khách hàng</button>
            </div>

            <div className="space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{activeTab === 'tenants' ? 'Danh sách khách hàng' : 'Tất cả khách hàng (Leads)'}</h2>
                        <p className="text-sm text-slate-500">{activeTab === 'tenants' ? 'Quản lý tài nguyên và trạng thái hoạt động.' : 'Theo dõi khách hàng và lịch sử hội thoại trên hệ thống.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleRefresh} disabled={isRefreshing} className="bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 px-4 py-2 rounded-xl font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 text-sm h-[42px]">
                            <RefreshIcon spin={isRefreshing} />
                            <span className="hidden sm:inline">Làm mới</span>
                        </button>
                        {activeTab === 'tenants' && (
                            <button onClick={() => { setSelectedTenant(null); setShowModal(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20 text-sm flex items-center gap-2 transition-all h-[42px]">
                                <span>+</span> Thêm mới
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><SearchIcon /></div>
                        <input type="text" placeholder={activeTab === 'tenants' ? "Tìm công ty, tài khoản..." : "Tìm tên khách hàng, SĐT, công ty..."} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-700" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>

                    {/* Tenant Filter (Chi hien thi o tab Leads) */}
                    {activeTab === 'leads' && (
                        <div className="relative w-full md:w-auto min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </div>
                            <select
                                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                                value={tenantFilter}
                                onChange={(e) => { setTenantFilter(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="all">Tất cả công ty</option>
                                {tenants.map((t: any) => (
                                    <option key={t.id} value={t.id}>{t.company_name}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    )}

                    <div className="relative w-full md:w-auto min-w-[180px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><SortIcon /></div>
                        <select className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as 'desc' | 'asc'); setCurrentPage(1); }}>
                            <option value="desc">Mới nhất trước</option>
                            <option value="asc">Cũ nhất trước</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                    <div className="text-xs font-bold text-slate-500 whitespace-nowrap">Kết quả: <span className="text-blue-600">{displayedData.length}</span></div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        {activeTab === 'tenants' ? (
                            <>
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Khách hàng</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Tài khoản</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Tiến độ Token</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider text-right">Trạng thái</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.length === 0 ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu.</td></tr>
                                    ) : paginatedData.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><UserIcon /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{t.company_name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-slate-400 font-mono">ID: {t.id}</p>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <p className="text-[10px] text-blue-500 font-medium lowercase">{t.email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-600 text-xs">{t.username}</td>
                                            <td className="px-6 py-4 w-48">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-xs mb-1">
                                                        {Number(t.total_usage || 0).toLocaleString()}
                                                        <span className="text-slate-400 mx-1 font-normal">/</span>
                                                        {Number(t.token_limit || 0).toLocaleString()}
                                                    </span>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${(Number(t.total_usage) / Number(t.token_limit || 1)) > 0.9 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min((Number(t.total_usage || 0) / Number(t.token_limit || 1)) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${t.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                                    {t.is_active ? 'Active' : 'Locked'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setSelectedTenant(t); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all text-xs">Sửa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Khách hàng</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Công ty (Tenant)</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Liên hệ</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Token Chat</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 uppercase text-xs tracking-wider">Ngày tạo</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.length === 0 ? (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Không tìm thấy dữ liệu.</td></tr>
                                    ) : paginatedData.map((l: any) => (
                                        <tr key={l.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><UserIcon /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{l.customer_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">ID: {l.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-blue-600 text-xs underline decoration-blue-200 underline-offset-4">{l.tenant_name}</td>
                                            <td className="px-6 py-4 font-mono text-slate-600 text-xs">{l.phone_number}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                                                    {Number(l.total_chat_tokens).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleViewChat(l)} className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-all">Xem Chat</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2 py-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Trang {currentPage} / {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 bg-white'}`}
                            >
                                <ChevronLeftIcon />
                            </button>

                            <div className="flex items-center gap-1">
                                {(() => {
                                    let startPage = Math.max(1, currentPage - 2);
                                    let endPage = Math.min(totalPages, startPage + 4);
                                    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
                                    const pages = [];
                                    for (let p = startPage; p <= endPage; p++) pages.push(p);
                                    return pages.map(pageNum => (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    ));
                                })()}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg border border-slate-200 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 bg-white'}`}
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showModal && <TenantModal tenant={selectedTenant} onClose={() => setShowModal(false)} />}

            {selectedLead && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{selectedLead.customer_name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-slate-500 font-mono">{selectedLead.phone_number}</p>
                                    <span className="text-slate-300">•</span>
                                    <p className="text-xs font-bold text-blue-600">Tenant: {selectedLead.tenant_name}</p>
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

function StatCard({ label, value, unit, highlighted = false }: any) {
    return (
        <div className={`p-6 rounded-2xl border shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md ${highlighted ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent text-white' : 'bg-white border-slate-200'}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${highlighted ? 'text-blue-100' : 'text-slate-400'}`}>{label}</p>
            <div className="flex items-baseline gap-1"><span className={`text-3xl font-black ${highlighted ? 'text-white' : 'text-slate-900'}`}>{value}</span></div>
            <p className={`text-[10px] font-bold mt-1 uppercase ${highlighted ? 'text-blue-200' : 'text-slate-400'}`}>{unit}</p>
        </div>
    );
}