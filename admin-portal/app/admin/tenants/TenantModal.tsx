'use client'

import { useState } from 'react';
import { saveTenant } from '@/lib/actions/admin';

export default function TenantModal({ tenant, onClose }: { tenant: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveTenant(formData);
    if (result.success) {
      onClose();
      window.location.reload();
    } else {
      alert("Lỗi: " + result.error);
    }
    setLoading(false);
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-gray-800 text-sm font-medium placeholder:text-gray-400 bg-white transition-all shadow-sm hover:border-gray-300";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-0.5 tracking-wide";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <input type="hidden" name="id" value={tenant?.id || ''} />

          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {tenant ? 'Cập nhật Tenant' : 'Thêm mới Tenant'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cấu hình hệ thống khách hàng</p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto scrollbar-hide">

            {/* Tên Công Ty */}
            <div>
              <label className={labelClass}>Tên công ty / Tenant</label>
              <input name="company_name" defaultValue={tenant?.company_name} required className={inputClass} placeholder="VD: Công ty TNHH Giải Pháp AI" />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email liên hệ (Nhận Lead)</label>
              <input name="email" type="email" defaultValue={tenant?.email} className={inputClass} placeholder="partner@example.com" />
            </div>

            {/* Tài Khoản & Mật Khẩu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Tài khoản</label>
                <input name="username" defaultValue={tenant?.username} required className={inputClass} placeholder="username" />
              </div>
              <div>
                <label className={labelClass}>Mật khẩu</label>
                <input name="password" type="password" placeholder={tenant ? "Giữ nguyên nếu trống" : "Nhập mật khẩu"} className={inputClass} />
              </div>
            </div>

            {/* Phân Quyền */}
            <div>
              <label className={labelClass}>Phân quyền</label>
              <div className="relative">
                <select name="role" defaultValue={tenant?.role || 'TENANT'} className={`${inputClass} appearance-none cursor-pointer bg-slate-50`}>
                  <option value="TENANT">Khách thuê (Tenant)</option>
                  <option value="SUPER_ADMIN">Quản trị viên (Super Admin)</option>
                </select>
                <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Cấu hình kỹ thuật Dify</p>

              <div className="space-y-4">
                {/* Dify App ID */}
                <div>
                  <label className={labelClass}>Dify App ID</label>
                  <input name="difyAppId" defaultValue={tenant?.dify_app_id} placeholder="ID ứng dụng từ Dify..." className={`${inputClass} font-mono text-xs`} />
                </div>

                {/* Token Limit */}
                <div>
                  <label className={labelClass}>Hạn mức Token</label>
                  <div className="relative">
                    <input
                      name="tokenLimit"
                      type="number"
                      defaultValue={tenant?.token_limit || 100000}
                      className={`${inputClass} font-mono font-bold text-orange-600 pr-16`}
                      placeholder="100000"
                    />
                    <span className="absolute right-4 top-2.5 text-[10px] font-black text-slate-300 uppercase">Tokens</span>
                  </div>
                </div>

                {/* Checkbox Reset */}
                {tenant && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/30">
                    <div className="flex h-5 items-center">
                      <input
                        id="resetCycle"
                        name="resetCycle"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label htmlFor="resetCycle" className="font-bold text-slate-700 select-none cursor-pointer text-[11px] uppercase tracking-wide">
                        Làm mới chu kỳ tính cước
                      </label>
                      <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">
                        Reset số token đã dùng về 0 và bắt đầu tính lại từ hôm nay.
                      </p>
                    </div>
                  </div>
                )}

                {/* OpenAI/Gemini API KEY */}
                <div>
                  <label className={labelClass}>OpenAI/Gemini API Key (Tùy chọn)</label>
                  <input
                    name="apiKey"
                    type="password"
                    placeholder={tenant ? "******** (Đã bảo mật)" : "Nhập API Key..."}
                    className={`${inputClass} font-mono text-xs`}
                    autoComplete="off"
                  />
                </div>

                {/* Dify API KEY */}
                <div>
                  <label className={labelClass}>Dify API Key</label>
                  <input
                    name="difyApiKey"
                    type="password"
                    placeholder={tenant ? "******** (Đã bảo mật)" : "app-..."}
                    className={`${inputClass} font-mono text-xs`}
                    autoComplete="off"
                  />
                </div>

                {/* DIFY API URL */}
                <div>
                  <label className={labelClass}>Dify URL (Tùy chọn)</label>
                  <input
                    name="difyApiUrl"
                    defaultValue={tenant?.dify_api_url}
                    placeholder="https://api.dify.ai/v1"
                    className={`${inputClass} font-mono text-xs`}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className={labelClass}>Trạng thái tài khoản</label>
              <div className="relative">
                <select name="isActive" defaultValue={tenant ? String(tenant.is_active) : 'true'} className={`${inputClass} appearance-none cursor-pointer font-bold`}>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Tạm khóa</option>
                </select>
                <div className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all order-2 sm:order-1">Hủy bỏ</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300 transition-all order-1 sm:order-2">
              {loading ? 'Đang xử lý...' : 'Lưu dữ liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}