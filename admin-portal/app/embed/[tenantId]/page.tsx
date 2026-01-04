'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function EmbedChat() {
    const params = useParams();
    const tenantId = params.tenantId;

    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
        { role: 'bot', text: 'Xin chào! Tôi có thể hỗ trợ gì cho bạn?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState('');
    const [userId, setUserId] = useState('');

    // Form states
    const [showSetup, setShowSetup] = useState(true);
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [note, setNote] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Kiểm tra xem đã có thông tin user chưa
        const savedInfo = localStorage.getItem(`bluebot_user_info_${tenantId}`);
        if (savedInfo) {
            const info = JSON.parse(savedInfo);
            setCustomerName(info.name || '');
            setPhoneNumber(info.phone || '');
            setNote(info.note || '');
            setShowSetup(false);
        }

        // Tạo userId ngẫu nhiên nếu chưa có
        let savedId = localStorage.getItem(`bluebot_user_${tenantId}`);
        if (!savedId) {
            savedId = 'user_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem(`bluebot_user_${tenantId}`, savedId);
        }
        setUserId(savedId);

        // Lấy conversationId nếu có
        const savedConv = localStorage.getItem(`bluebot_conv_${tenantId}`);
        if (savedConv) setConversationId(savedConv);
    }, [tenantId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, showSetup]);

    const handleStartChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !phoneNumber.trim()) return;

        // Lưu thông tin vào localStorage
        localStorage.setItem(`bluebot_user_info_${tenantId}`, JSON.stringify({
            name: customerName,
            phone: phoneNumber,
            note: note
        }));

        setShowSetup(false);
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    tenant_id: tenantId,
                    conversation_id: conversationId,
                    user_id: userId,
                    customer_name: customerName,
                    phone_number: phoneNumber,
                    note: note
                })
            });

            const data = await res.json();
            if (data.answer) {
                setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
                if (data.conversation_id && data.conversation_id !== conversationId) {
                    setConversationId(data.conversation_id);
                    localStorage.setItem(`bluebot_conv_${tenantId}`, data.conversation_id);
                }
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: `Xin lỗi, tôi gặp chút trục trặc: ${data.error || 'Vui lòng thử lại sau.'}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Lỗi kết nối máy chủ.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (showSetup) {
        return (
            <div className="flex flex-col h-screen bg-[#1a1a1c] font-sans text-white items-center justify-center p-6">
                <div className="w-full max-w-[400px] bg-[#242426] rounded-2xl p-6 shadow-2xl border border-white/5 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
                        </div>
                        <h3 className="font-bold text-base tracking-tight text-white/90">New chat setup</h3>
                    </div>

                    <form onSubmit={handleStartChat} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider ml-1">Họ và tên</label>
                            <input
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Họ và tên"
                                className="w-full bg-[#1a1a1c] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-white/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider ml-1">Số điện thoại</label>
                            <input
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Số điện thoại"
                                className="w-full bg-[#1a1a1c] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-white/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider ml-1">Vấn đề cần hỗ trợ</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Vấn đề cần hỗ trợ"
                                rows={2}
                                className="w-full bg-[#1a1a1c] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-white/20 resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2"
                        >
                            Start Chat
                        </button>
                    </form>
                </div>
                <p className="text-[10px] text-white/20 mt-6 uppercase font-bold tracking-[0.2em]">
                    Powered by Bluebot AI
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Trợ lý Bluebot</h3>
                        <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Đang trực tuyến
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem(`bluebot_user_info_${tenantId}`);
                        window.location.reload();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    title="Đổi thông tin"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-center bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Nhập nội dung tin nhắn..."
                        className="flex-1 bg-transparent border-none outline-none text-sm py-1"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 p-1 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2 uppercase font-bold tracking-widest bg-white">
                    Powered by Bluebot AI
                </p>
            </div>
        </div>
    );
}
