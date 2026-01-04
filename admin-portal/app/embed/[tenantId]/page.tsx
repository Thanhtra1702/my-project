'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function EmbedChat() {
    const params = useParams();
    const tenantId = params.tenantId;

    const [messages, setMessages] = useState<{ role: 'user' | 'bot' | 'system'; text: string; isForm?: boolean }[]>([
        { role: 'bot', text: 'Chào mừng bạn đến với Bluebot AI! Đây là trợ lý ảo hỗ trợ tư vấn, chốt đơn và chăm khách tự động.' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState('');
    const [userId, setUserId] = useState('');
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);

    // Form values
    const [customerName, setCustomerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [note, setNote] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Init User ID
        let savedId = localStorage.getItem(`bluebot_user_${tenantId}`);
        if (!savedId) {
            savedId = 'user_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem(`bluebot_user_${tenantId}`, savedId);
        }
        setUserId(savedId);

        // Check if user info already exists
        const savedInfo = localStorage.getItem(`bluebot_user_info_${tenantId}`);
        if (savedInfo) {
            const info = JSON.parse(savedInfo);
            setCustomerName(info.name || '');
            setPhoneNumber(info.phone || '');
            setNote(info.note || '');
            setIsFormSubmitted(true);
            setMessages(prev => [...prev, { role: 'system', text: 'Chào mừng bạn quay lại!' }]);
        } else {
            // Add form request message
            setTimeout(() => {
                setMessages(prev => [...prev,
                { role: 'bot', text: 'Để minh tư vấn chính xác hơn, bạn vui lòng để lại Họ tên & Số điện thoại nhé:' },
                { role: 'bot', text: '', isForm: true }
                ]);
            }, 600);
        }

        const savedConv = localStorage.getItem(`bluebot_conv_${tenantId}`);
        if (savedConv) setConversationId(savedConv);
    }, [tenantId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !phoneNumber.trim()) return;

        localStorage.setItem(`bluebot_user_info_${tenantId}`, JSON.stringify({
            name: customerName,
            phone: phoneNumber,
            note: note
        }));

        setIsFormSubmitted(true);
        setMessages(prev => [
            ...prev.filter(m => !m.isForm),
            { role: 'user', text: `Tôi là ${customerName}, SĐT: ${phoneNumber}. ${note ? `Cần hỗ trợ: ${note}` : ''}` },
            { role: 'bot', text: 'Cảm ơn bạn! Tôi đã ghi nhận thông tin. Bạn có thể bắt đầu chat ngay bây giờ.' }
        ]);
    };

    const handleSend = async () => {
        if (!input.trim() || loading || !isFormSubmitted) return;

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

    const resetInfo = () => {
        localStorage.removeItem(`bluebot_user_info_${tenantId}`);
        localStorage.removeItem(`bluebot_conv_${tenantId}`);
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
            {/* Header - Premium Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 text-white flex items-center justify-between shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-blue-600 rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-tight">Trợ lý AI</h3>
                        <p className="text-[10px] text-blue-100 font-medium uppercase tracking-wider flex items-center gap-1.5">
                            Trực tuyến
                        </p>
                    </div>
                </div>
                <button
                    onClick={resetInfo}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    title="Làm mới hội thoại"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {msg.role === 'system' ? (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">{msg.text}</span>
                        ) : (
                            <div className={`flex gap-2.5 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.role === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
                                    </div>
                                )}

                                {msg.isForm ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl shadow-slate-200/50 w-full max-w-[320px]">
                                        <form onSubmit={handleFormSubmit} className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Họ và tên *</label>
                                                <input
                                                    required
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                    placeholder="Nguyễn Văn A"
                                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Số điện thoại *</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="0912 345 678"
                                                    className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all text-sm"
                                            >
                                                Gửi thông tin
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className={`p-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mr-2">
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s] mx-0.5"></span>
                            <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area - Cleaner Design */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className={`relative flex items-center bg-slate-100 rounded-2xl px-4 py-1.5 transition-all border border-transparent ${!isFormSubmitted ? 'opacity-50 grayscale pointer-events-none' : 'focus-within:bg-white focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-500/5'}`}>
                    <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={isFormSubmitted ? "Nhập tin nhắn... (Enter để gửi)" : "Vui lòng nhập thông tin trước..."}
                        className="flex-1 bg-transparent border-none outline-none text-[14px] py-2 resize-none max-h-32"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim() || !isFormSubmitted}
                        className={`ml-2 p-2 rounded-xl transition-all ${input.trim() && isFormSubmitted ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95' : 'text-slate-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
                <div className="flex justify-center items-center gap-1.5 mt-3">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Powered by</span>
                    <span className="text-[10px] font-black text-blue-600/40 italic">BLUEBOT AI</span>
                </div>
            </div>
        </div>
    );
}
