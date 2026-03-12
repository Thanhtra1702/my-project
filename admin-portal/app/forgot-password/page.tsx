import Link from 'next/link';

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',_Arial,_sans-serif]">
            {/* HEADER */}
            <header className="bg-white h-[60px] flex items-center shadow-[0_2px_8px_0_rgba(0,0,0,0.03)] border-b border-[#e5e7eb] px-6 sm:px-12">
                <div className="max-w-[1200px] mx-auto w-full flex items-center">
                    <img src="/logo.png" alt="BlueAI Logo" className="h-9 w-auto object-contain" />
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-12 w-full max-w-[448px] box-border border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    
                    <h2 className="text-[#2563eb] text-[28px] font-bold mb-4 tracking-tight">Quản lý tài khoản SSO</h2>
                    
                    <p className="text-[#4b5563] text-base leading-relaxed mb-8">
                        Tài khoản của bạn được quản lý bởi hệ thống <strong>SSO doanh nghiệp</strong>. 
                        Để thay đổi hoặc khôi phục mật khẩu, vui lòng liên hệ trực tiếp với <strong>Bộ phận Quản trị hệ thống</strong> hoặc <strong>Phòng IT</strong> của công ty.
                    </p>

                    <Link 
                        href="/login" 
                        className="inline-block w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-3 rounded-lg transition-colors text-base"
                    >
                        Quay lại đăng nhập
                    </Link>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-[#181e29] text-[#9ca3af] py-6 px-10 flex justify-center items-center text-sm mt-auto">
                <div>© 2024 BlueData. Tất cả quyền được bảo lưu.</div>
            </footer>
        </div>
    );
}
