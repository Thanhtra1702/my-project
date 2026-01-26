'use client'

import { useFormState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { login, loginWithToken } from '@/app/actions';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Lấy domain hiện tại để làm returnUrl, thêm ?sso=true để tránh lỗi nối chuỗi & từ Portal
    if (typeof window !== 'undefined') {
      setReturnUrl(encodeURIComponent(window.location.origin + '/login?sso=true'));
    }

    // Kiểm tra xem    // Portal có thể trả về token theo nhiều cách khác nhau
    const searchParams = new URLSearchParams(window.location.search);
    const fullHash = window.location.hash;

    // Gộp tất cả params từ cả query và hash vào một chỗ để tìm
    const allParams = new URLSearchParams(searchParams);

    // Xử lý nested query trong hash (ví dụ: #/login?token=...)
    const nestedQueryIdx = fullHash.indexOf('?');
    if (nestedQueryIdx !== -1) {
      new URLSearchParams(fullHash.substring(nestedQueryIdx + 1)).forEach((v, k) => allParams.append(k, v));
    }

    // Xử lý fragment params (ví dụ: #token=...)
    const fragment = fullHash.startsWith('#') ? fullHash.substring(1) : fullHash;
    if (fragment && !fragment.includes('?')) {
      new URLSearchParams(fragment).forEach((v, k) => allParams.append(k, v));
    }

    // Tìm token không phân biệt chữ hoa chữ thường
    let foundToken = '';
    allParams.forEach((val, key) => {
      const k = key.toLowerCase();
      if (k === 'token' || k === 'access_token' || k === 'accesstoken') {
        foundToken = val;
      }
    });

    if (foundToken) {
      console.log("🎟️ Đã tìm thấy SSO Token, đang tiến hành xác thực...");
      handleSsoToken(foundToken);
    }
  }, [router]);

  async function handleSsoToken(token: string) {
    setIsVerifying(true);
    setSsoError(null);
    try {
      const result = await loginWithToken(token);
      if (result?.error) {
        setSsoError(result.error);
      }
    } catch (err) {
      setSsoError("Lỗi hệ thống khi xác thực token SSO");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',_Arial,_sans-serif]">
      {/* HEADER */}
      <header className="bg-white h-[60px] flex items-center shadow-[0_2px_8px_0_rgba(0,0,0,0.03)] border-b border-[#e5e7eb] px-6 sm:px-12">
        <div className="max-w-[1200px] mx-auto w-full flex items-center">
          <img src="/logo.png" alt="BlueAI Logo" className="h-9 w-auto object-contain" />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex flex-col items-center p-4 pt-[4vh] sm:pt-[5vh]">
        <div className="bg-white rounded-2xl shadow-[0_0.5rem_1rem_rgba(0,0,0,0.15)] p-6 sm:p-12 w-full max-w-[448px] box-border">
          <h2 className="text-[#2563eb] text-[30px] font-bold text-center mb-2">Đăng nhập</h2>
          <p className="text-[#6b7280] text-center mb-4">Chào mừng bạn trở lại!</p>

          <form action={formAction} className="flex flex-col">
            {(state?.error || ssoError) && (
              <div className="mb-4 bg-rose-50 text-rose-600 text-sm font-semibold px-4 py-3 rounded-lg border border-rose-100 flex items-center gap-2">
                ⚠️ {state?.error || ssoError}
              </div>
            )}

            {isVerifying && (
              <div className="mb-4 bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-3 rounded-lg border border-blue-100 flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                Đang xác thực tài khoản từ Portal...
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

            <div className="flex justify-between items-center mb-6 mt-2">
              <label className="flex items-center text-sm text-[#374151] cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-[#d1d5db] text-[#2563eb] focus:ring-[#2563eb]" />
                Ghi nhớ đăng nhập
              </label>
              <Link href="/forgot-password" title="Quên mật khẩu?" className="text-[#2563eb] text-sm hover:underline font-medium">
                Quên mật khẩu?
              </Link>
            </div>

            <SubmitButton />

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-[#e5e7eb]"></div>
              <span className="px-4 text-[#9ca3af] text-sm">HOẶC</span>
              <div className="flex-1 border-t border-[#e5e7eb]"></div>
            </div>

            <a
              href={`https://bluesso.bluedata.vn/#/login?returnUrl=${returnUrl}&redirect_uri=${returnUrl}&callback=${returnUrl}&redirect=${returnUrl}&from=${returnUrl}`}
              className="w-full bg-[#f0f7ff] border border-[#bfdbfe] hover:bg-[#e0efff] text-[#2563eb] font-semibold py-3 rounded-lg transition-all flex justify-center items-center gap-3 text-base shadow-sm"
            >
              <ShieldCheck className="w-5 h-5" />
              Đăng nhập qua Portal Công ty
            </a>
          </form>

        </div>
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
