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

  const inputClass = "w-full px-4 py-2.5 border border-slate-200 rounded-sm outline-none focus:border-slate-400 text-slate-800 text-xs font-bold bg-slate-50 transition-all";
  const labelClass = "block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-sm w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <input type="hidden" name="id" value={tenant?.id || ''} />

          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                {tenant ? 'Cấu hình Đối tác' : 'Tạo mới Đối tác'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto scrollbar-hide">
            {/* Identity */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block border-b border-slate-100 pb-2">Thông tin định danh</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Tên công ty / Tenant</label>
                  <input name="company_name" defaultValue={tenant?.company_name} required className={inputClass} placeholder="VD: BlueData AI Corp" />
                </div>
                <div>
                  <label className={labelClass}>Email (Nhận thông báo)</label>
                  <input name="email" type="email" defaultValue={tenant?.email} className={inputClass} placeholder="admin@tenant.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Tài khoản đăng nhập</label>
                  <input name="username" defaultValue={tenant?.username} required className={inputClass} placeholder="username" />
                </div>
                <div>
                  <label className={labelClass}>Mật khẩu</label>
                  <input name="password" type="password" placeholder={tenant ? "Để trống nếu giữ nguyên" : "Nhập mật khẩu"} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Phân quyền hệ thống</label>
                <select name="role" defaultValue={tenant?.role || 'TENANT'} className={inputClass}>
                  <option value="TENANT">Khách thuê (Tenant)</option>
                  <option value="SUPER_ADMIN">Quản trị viên (Super Admin)</option>
                </select>
              </div>
            </div>

            {/* Technical Config */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block border-b border-slate-100 pb-2">Cấu hình kỹ thuật (Dify & LLMs)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Hạn mức Token</label>
                  <input name="tokenLimit" type="number" defaultValue={tenant?.token_limit || 100000} className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <label className={labelClass}>Dify API Key</label>
                  <input name="difyApiKey" type="password" placeholder={tenant ? "********" : "app-..."} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Dify API URL</label>
                <input name="difyApiUrl" defaultValue={tenant?.dify_api_url} placeholder="https://api.dify.ai/v1" className={inputClass} />
              </div>
            </div>

            <input type="hidden" name="isActive" value={tenant ? String(tenant.is_active) : 'true'} />
          </div>

          <div className="px-8 py-5 bg-slate-100 flex justify-end gap-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Hủy bỏ</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-[#007BFF] text-white font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-[#0066CC] disabled:opacity-50 shadow-lg shadow-slate-200">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}