'use client'

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { resetPassword } from '@/app/actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className={`w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 rounded-lg transition-colors cursor-pointer text-base mt-6 flex justify-center items-center gap-2 ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {pending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
            {pending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </button>
    );
}

function ResetForm() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [state, formAction] = useFormState(resetPassword, { error: null, success: false, message: null } as any);

    return (
        <div className="bg-white rounded-2xl shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)] p-6 sm:p-12 w-full max-w-[448px] box-border">
            <h2 className="text-[#2563eb] text-[30px] font-bold text-center mb-2">Đặt lại mật khẩu</h2>
            <p className="text-[#6b7280] text-center mb-6">Nhập mật khẩu mới cho tài khoản của bạn</p>

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

                <input type="hidden" name="email" value={email} />

                <div className="mb-4">
                    <label className="block text-[#374151] font-semibold text-sm mb-1">
                        Mật khẩu mới <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                        name="password"
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        required
                        className="w-full px-3 py-[9px] border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#2563eb] mt-2 box-border"
                    />
                </div>

                <div className="mb-0">
                    <label className="block text-[#374151] font-semibold text-sm mb-1">
                        Xác nhận mật khẩu <span className="text-[#ef4444]">*</span>
                    </label>
                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Xác nhận mật khẩu mới"
                        required
                        className="w-full px-3 py-[9px] border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#2563eb] mt-2 box-border"
                    />
                </div>

                <SubmitButton />
            </form>

            <div className="text-center mt-6 text-sm text-[#4b5563]">
                <Link href="/login" className="text-[#2563eb] font-semibold hover:underline">Quay lại đăng nhập</Link>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',_Arial,_sans-serif]">
            {/* HEADER */}
            <header className="bg-white h-[60px] flex items-center shadow-[0_2px_8px_0_rgba(0,0,0,0.03)] border-b border-[#e5e7eb] px-6 sm:px-12">
                <div className="max-w-[1200px] mx-auto w-full flex items-center">
                    <div className="flex items-center">
                        <span className="bg-[#2563eb] font-bold rounded-lg w-8 h-8 flex items-center justify-center text-lg text-white mr-2">B</span>
                        <span className="text-[#2563eb] font-bold text-xl">BlueData</span>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetForm />
                </Suspense>
            </main>

            {/* FOOTER */}
            <footer className="bg-[#181e29] text-[#9ca3af] py-6 px-10 flex flex-col sm:flex-row justify-between items-center text-sm gap-4 mt-auto">
                <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center w-full max-w-[1200px]">
                    <div>© 2024 BlueData. Tất cả quyền được bảo lưu.</div>
                </div>
            </footer>
        </div>
    );
}
