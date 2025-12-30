'use client'

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 rounded-lg transition-colors cursor-pointer text-base mt-2 flex justify-center items-center gap-2 ${pending ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {pending && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
      {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, null);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',_Arial,_sans-serif]">
      {/* HEADER */}
      <header className="bg-white h-[60px] flex items-center shadow-[0_2px_8px_0_rgba(0,0,0,0.03)] border-b border-[#e5e7eb] px-6 sm:px-12">
        <div className="max-w-[1200px] mx-auto w-full flex items-center">
          <div className="flex items-center">
            <span className="bg-[#2563eb] font-bold rounded-lg w-8 h-8 flex items-center justify-center text-lg text-white mr-2">W</span>
            <span className="text-[#2563eb] font-bold text-xl">WebApp</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center p-4 pt-[4vh] sm:pt-[5vh]">
        <div className="bg-white rounded-2xl shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)] p-6 sm:p-12 w-full max-w-[448px] box-border">
          <h2 className="text-[#2563eb] text-[30px] font-bold text-center mb-2">Đăng nhập</h2>
          <p className="text-[#6b7280] text-center mb-4">Chào mừng bạn trở lại!</p>

          <form action={formAction} className="flex flex-col">
            {state?.error && (
              <div className="mb-4 bg-rose-50 text-rose-600 text-sm font-semibold px-4 py-3 rounded-lg border border-rose-100 flex items-center gap-2">
                ⚠️ {state.error}
              </div>
            )}

            <div className="mt-2 mb-0">
              <label className="block text-[#374151] font-semibold text-sm mb-1 mt-0">
                Tài khoản <span className="text-[#ef4444]">*</span>
              </label>
              <input
                name="username"
                type="text"
                placeholder="Nhập tài khoản của bạn"
                required
                className="w-full px-3 py-[9px] border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#2563eb] mt-2 box-border"
              />
            </div>

            <div className="mt-4 mb-4">
              <label className="block text-[#374151] font-semibold text-sm mb-1 mt-0">
                Mật khẩu <span className="text-[#ef4444]">*</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                required
                className="w-full px-3 py-[9px] border border-[#d1d5db] rounded-lg text-sm outline-none focus:border-[#2563eb] box-border mt-2"
              />
            </div>

            <SubmitButton />
          </form>
        </div>
      </main>

    </div>
  );
}
