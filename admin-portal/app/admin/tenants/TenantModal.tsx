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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-[480px] shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden flex flex-col">

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <input type="hidden" name="id" value={tenant?.id || ''} />

          <div className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {tenant ? 'Cập nhật thông tin' : 'Thêm khách hàng mới'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Quản lý quyền truy cập và giới hạn.</p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-8 space-y-5 bg-white max-h-[75vh] overflow-y-auto">

            {/* Tên Công Ty */}
            <div>
              <label className={labelClass}>Tên công ty / Tenant</label>
              <input name="company_name" defaultValue={tenant?.company_name} required className={inputClass} placeholder="VD: Công ty Bất Động Sản A" />
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email (Dùng để nhận thông báo Lead)</label>
              <input name="email" type="email" defaultValue={tenant?.email} className={inputClass} placeholder="partner@gmail.com" />
            </div>

            {/* Tài Khoản & Mật Khẩu */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Tài khoản</label>
                <input name="username" defaultValue={tenant?.username} required className={inputClass} placeholder="user_demo" />
              </div>
              <div>
                <label className={labelClass}>Mật khẩu</label>
                <input name="password" type="password" placeholder={tenant ? "Giữ nguyên nếu trống" : "Nhập mật khẩu"} className={inputClass} />
              </div>
            </div>

            {/* Phân Quyền */}
            <div>
              <label className={labelClass}>Phân quyền tài khoản</label>
              <div className="relative">
                <select name="role" defaultValue={tenant?.role || 'TENANT'} className={`${inputClass} appearance-none cursor-pointer bg-slate-50 font-medium`}>
                  <option value="TENANT">Khách thuê (Tenant)</option>
                  <option value="SUPER_ADMIN">Quản trị viên (Super Admin)</option>
                </select>
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-3">Cấu hình AI & Giới hạn</p>

              <div className="space-y-4">
                {/* Dify App ID */}
                <div>
                  <label className={labelClass}>Dify App ID</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-2.5 text-slate-400 group-hover:text-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    </div>
                    <input name="difyAppId" defaultValue={tenant?.dify_app_id} placeholder="Nhập App ID..." className={`${inputClass} pl-9 font-mono text-xs text-blue-700 bg-blue-50/30 border-blue-100 focus:border-blue-400 focus:ring-blue-500/20`} />
                  </div>
                </div>

                {/* Token Limit */}
                <div>
                  <label className={labelClass}>Giới hạn Token (Limit)</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-2.5 text-slate-400 group-hover:text-orange-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                    </div>
                    <input
                      name="tokenLimit"
                      type="number"
                      defaultValue={tenant?.token_limit || 100000}
                      className={`${inputClass} pl-9 font-mono text-sm font-bold text-orange-600 bg-orange-50/30 border-orange-100 focus:border-orange-400 focus:ring-orange-500/20`}
                      placeholder="VD: 50000"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">tokens</span>
                  </div>
                </div>

                {/* Checkbox Reset Chu Kỳ (Chỉ hiện khi Edit) */}
                {tenant && (
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                    <div className="flex h-5 items-center">
                      <input
                        id="resetCycle"
                        name="resetCycle"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="text-sm">
                      <label htmlFor="resetCycle" className="font-bold text-slate-700 select-none cursor-pointer text-xs uppercase tracking-wide">
                        Làm mới ngày tính hạn mức
                      </label>
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                        Tích vào đây để reset token đã dùng về 0 và bắt đầu chu kỳ tính cước mới từ <b>Hôm nay</b>.
                      </p>
                    </div>
                  </div>
                )}

                {/* API KEY - ĐÃ BẢO MẬT */}
                <div>
                  <label className={labelClass}>OpenAI Key (Optional)</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-2.5 text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                    </div>

                    {/* KHÔNG DÙNG defaultValue, DÙNG PLACEHOLDER ĐỂ BẢO MẬT */}
                    <input
                      name="apiKey"
                      placeholder={tenant ? "Đã được bảo mật (Nhập mới để thay đổi)" : "sk-..."}
                      className={`${inputClass} pl-9 font-mono text-xs`}
                      autoComplete="off"
                    />
                  </div>
                  {/* Dòng chú thích nhỏ */}
                  {tenant && (
                    <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">
                      * Key cũ đang được ẩn vì lý do bảo mật.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50">
              <label className={labelClass}>Trạng thái hệ thống</label>
              <div className="relative">
                <select name="isActive" defaultValue={tenant ? String(tenant.is_active) : 'true'} className={`${inputClass} appearance-none cursor-pointer font-medium`}>
                  <option value="true">Đang hoạt động (Active)</option>
                  <option value="false">Tạm khóa (Locked)</option>
                </select>
                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-all">Hủy bỏ</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg disabled:bg-slate-300 disabled:shadow-none transition-all">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}