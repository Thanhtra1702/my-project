'use client'

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { forgotPassword } from '@/app/actions';
import Link from 'next/link';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 rounded-lg transition-colors cursor-pointer text-base mt-6 flex justify-center items-center gap-2 ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {pending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
            {pending ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
        </button>
    );
}

export default function ForgotPasswordPage() {
    const [state, formAction] = useFormState(forgotPassword, { error: null, success: false, message: null } as any);

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',_Arial,_sans-serif]">
            {/* HEADER */}
            <header className="bg-white h-[60px] flex items-center shadow-[0_2px_8px_0_rgba(0,0,0,0.03)] border-b border-[#e5e7eb] px-6 sm:px-12">
                <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="bg-[#2563eb] font-bold rounded-lg w-8 h-8 flex items-center justify-center text-lg text-white mr-2">B</span>
                        <span className="text-[#2563eb] font-bold text-xl">BlueData</span>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 p-6 sm:p-12 w-full max-w-[448px] box-border border border-gray-100">
                    <h2 className="text-[#2563eb] text-[32px] font-bold text-center mb-2 tracking-tight">Quên mật khẩu</h2>
                    <p className="text-[#6b7280] text-center mb-8 text-base">Nhập email để nhận liên kết khôi phục</p>

                    <form action={formAction} className="flex flex-col">
                        {state?.error && (
                            <div className="mb-4 bg-rose-50 text-rose-600 text-sm font-semibold px-4 py-3 rounded-lg border border-rose-100 flex items-center gap-2">
                                ⚠️ {state.error}
                            </div>
                        )}
                        {state?.success && (
                            <div className="mb-4 bg-emerald-50 text-emerald-600 text-sm font-semibold px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
                                ✅ {state.message}
                            </div>
                        )}

                        <div className="mb-0">
                            <label className="block text-[#374151] font-semibold text-sm mb-1">
                                Email <span className="text-[#ef4444]">*</span>
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="Nhập email của bạn"
                                required
                                className="w-full px-3 py-[9px] border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#2563eb] mt-2 box-border"
                            />
                        </div>

                        <SubmitButton />
                    </form>

                    <div className="text-center mt-6 text-sm text-[#4b5563]">
                        Nhớ lại mật khẩu? <Link href="/login" className="text-[#2563eb] font-semibold hover:underline">Đăng nhập</Link>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-[#181e29] text-[#9ca3af] py-6 px-10 flex flex-col sm:flex-row justify-between items-center text-sm gap-4">
                <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center w-full max-w-[1200px]">
                    <div>© 2024 BlueData. Tất cả quyền được bảo lưu.</div>
                </div>
            </footer>
        </div>
    );
}
