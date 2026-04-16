"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Settings, Save, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get(`/workspaces/${companySlug}/settings`);
        if (res) {
          setDays(res.checkin_overdue_days || 7);
        }
      } catch (e: any) {
        console.error("Failed to fetch settings", e);
      } finally {
        setLoading(false);
      }
    };
    if (companySlug) fetchSettings();
  }, [companySlug]);

  const handleSave = async () => {
    if (days < 1 || days > 30) {
      toast.error("Số ngày phải từ 1 đến 30");
      return;
    }
    try {
      setSaving(true);
      await api.put(`/workspaces/${companySlug}/settings`, { checkin_overdue_days: days });
      toast.success("Đã cập nhật cài đặt công ty");
    } catch (e: any) {
      toast.error("Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#00b24e] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00b24e]/10 flex items-center justify-center text-[#00b24e]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A3A]">Cài đặt tổ chức</h1>
            <p className="text-[#5A6E85] mt-1">Cấu hình các tham số cốt lõi cho ứng dụng</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00b24e] text-white rounded-[10px] font-semibold hover:bg-[#009b43] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>

      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden auto-rows-max">
        {/* Module Settings: OKR */}
        <div className="p-6 border-b border-[#E2E8F0]">
          <h2 className="text-lg font-bold text-[#1E2A3A] mb-4">Mô-đun OKR & Check-in</h2>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <label className="block text-[15px] font-semibold text-[#1E2A3A] mb-1">
                Thời hạn cảnh báo Check-in trễ (Ngày)
              </label>
              <p className="text-[13px] text-[#5A6E85] leading-relaxed mb-3">
                Xác định sau bao nhiêu ngày theo mặc định thì một Kết quả then chốt (KR) không được cập nhật sẽ bị tính là <b>Trễ hạn (Check-in quá hạn)</b> trên hệ thống báo cáo.
              </p>
              
              <div className="flex items-center gap-4 bg-[#F9FBFD] p-3 rounded-xl border border-[#E2E8F0] w-fit">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-20 px-3 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium text-center focus:outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e]"
                />
                <span className="text-[14px] font-medium text-[#1E2A3A]">Ngày</span>
              </div>
            </div>

            <div className="bg-[#FFF4ED] border border-[#FED7AA] p-4 rounded-xl flex-1 md:max-w-xs flex gap-3 text-[#B45309]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[13px] leading-relaxed">
                Biểu đồ tỷ lệ chuyên cần trên Dashboard của công ty sẽ được tính toán ngay lập tức dựa trên thông số này để phân loại Vàng/Đỏ.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
