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

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Tạo userId ngẫu nhiên nếu chưa có (lưu vào localStorage để duy trì hội thoại)
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
    }, [messages]);

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
                    user_id: userId
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
                setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi gặp chút trục trặc. Vui lòng thử lại sau.' }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Lỗi kết nối máy chủ.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-slate-800">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-3 shadow-md">
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
