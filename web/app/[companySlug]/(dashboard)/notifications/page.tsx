"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Bell, CheckCircle2 } from "lucide-react";
import { getImageUrl } from "@/lib/image";
import { NotificationResponse, renderNotificationContent } from "@/lib/notifications";
import { toast } from "sonner";

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.companySlug as string;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${companySlug}/notifications`);
      const data = Array.isArray(res) ? res : (res.data || []);
      setNotifications(data);
    } catch (e: any) {
      console.error("Failed to fetch notifications", e);
      toast.error("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [companySlug]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/workspaces/${companySlug}/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/workspaces/${companySlug}/notifications/read-all`, {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (e) {
      toast.error("Lỗi khi đánh dấu tất cả đã đọc");
    }
  };

  const handleNotificationClick = (n: NotificationResponse) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.url) {
      const targetUrl = n.url.startsWith(`/${companySlug}`) ? n.url : `/${companySlug}${n.url.startsWith('/') ? n.url : `/${n.url}`}`;
      router.push(targetUrl);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Lịch sử thông báo</h1>
          <p className="text-[#5A6E85] mt-2">Xem lại những diễn biến mới nhất trên nền tảng</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.is_read) || notifications.length === 0}
            className="flex items-center px-4 py-2 bg-white border border-[#E2E8F0] text-[#1E2A3A] font-semibold text-[14px] rounded-[10px] hover:bg-[#F9FBFD] transition-all focus:ring-2 focus:ring-[#E2E8F0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5 mr-2 text-[#00b24e]" />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#9CA3AF]">
            <div className="animate-spin w-8 h-8 border-2 border-[#E2E8F0] border-t-[#00b24e] rounded-full mx-auto mb-3"></div>
            <span className="text-[14px] text-[#5A6E85]">Đang tải dữ liệu...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
            <div className="text-[16px] text-[#1E2A3A] font-semibold">Hiện tại chưa có thông báo nào</div>
            <div className="text-[14px] text-[#5A6E85] mt-2">Các hoạt động và cập nhật sẽ xuất hiện ở đây khi bạn tương tác.</div>
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E8F0]">
            {notifications.map(n => (
              <li
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-5 flex items-start gap-5 cursor-pointer transition-colors ${
                  !n.is_read ? 'bg-[#F3FDF7] hover:bg-[#E6F7ED]' : 'bg-white hover:bg-[#F9FBFD]'
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden border border-[#E2E8F0] shadow-sm">
                  {n.data?.subjects?.[0]?.avatar ? (
                    <img src={getImageUrl(n.data.subjects[0].avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[16px] font-bold text-[#5A6E85]">
                      {n.data?.subjects?.[0]?.name ? n.data.subjects[0].name.charAt(0).toUpperCase() : "?"}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-[15px] leading-relaxed text-[#1E2A3A] ${!n.is_read ? 'font-semibold' : ''}`}>
                    {renderNotificationContent(n)}
                  </p>
                  <span className={`text-[13px] mt-1.5 block ${!n.is_read ? 'text-[#00b24e] font-medium' : 'text-[#9CA3AF]'}`}>
                    {new Date(n.updated_at).toLocaleString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Unread Status */}
                {!n.is_read && (
                  <div className="w-3 h-3 rounded-full bg-[#00b24e] shrink-0 mt-3 shadow-sm border border-white"></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
