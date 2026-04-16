"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bell, Check, Circle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/image";

import { NotificationResponse, renderNotificationContent } from "@/lib/notifications";

export default function NotificationBell() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.companySlug as string;

  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!companySlug) return;
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${companySlug}/notifications`);
      const data = Array.isArray(res) ? res : (res.data || []);
      setNotifications(data);
      setUnreadCount(data.filter((n: NotificationResponse) => !n.is_read).length);
    } catch (e: any) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling (every 30 seconds)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [companySlug]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/workspaces/${companySlug}/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/workspaces/${companySlug}/notifications/read-all`, {});
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      toast.error("Lỗi khi đánh dấu tất cả đã đọc");
    }
  };

  const handleNotificationClick = (n: NotificationResponse) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsOpen(false);
    if (n.url) {
      // url expects format like /tasks/123 or just full relative path?
      // since companySlug is dynamic, ensure url starts with / or add companySlug
      // if it's already full relative, router.push it
      const targetUrl = n.url.startsWith(`/${companySlug}`) ? n.url : `/${companySlug}${n.url.startsWith('/') ? n.url : `/${n.url}`}`;
      router.push(targetUrl);
    }
  };

  // Types and rendering are imported from @/lib/notifications

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          if (!isOpen) {
            fetchNotifications(); // Luôn lấy mới khi mở bảng thông báo
          }
          setIsOpen(!isOpen);
        }}
        className="relative p-3 mx-1 text-[#5A6E85] hover:bg-[#F5F7FA] rounded-full transition-colors flex items-center justify-center outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[#DC2626] text-white text-[11px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm pointer-events-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] bg-white rounded-[16px] shadow-2xl border border-[#E2E8F0] overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-[16px] text-[#1E2A3A]">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[13px] font-medium text-[#00b24e] hover:text-[#009b43] flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-[#9CA3AF]">
                <div className="animate-spin w-6 h-6 border-2 border-[#E2E8F0] border-t-[#00b24e] rounded-full mx-auto mb-2"></div>
                <span className="text-[13px]">Đang tải...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-[14px] text-[#1E2A3A] font-medium">Bạn chưa có thông báo nào</p>
                <p className="text-[13px] text-[#9CA3AF] mt-1">Khi có cập nhật mới, chúng sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E2E8F0]">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 hover:bg-[#F9FBFD] flex items-start gap-4 cursor-pointer transition-colors ${!n.is_read ? "bg-[#F3FDF7]" : "bg-white"
                      }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
                      {n.data?.subjects?.[0]?.avatar ? (
                        <img src={getImageUrl(n.data.subjects[0].avatar)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[14px] font-bold text-[#5A6E85]">
                          {n.data?.subjects?.[0]?.name ? n.data.subjects[0].name.charAt(0).toUpperCase() : "?"}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <p className={`text-[14px] text-[#1E2A3A] leading-relaxed line-clamp-3 ${!n.is_read ? 'font-medium' : ''}`}>
                        {renderNotificationContent(n)}
                      </p>
                      <span className={`text-[12px] ${!n.is_read ? 'text-[#00b24e] font-medium' : 'text-[#9CA3AF]'}`}>
                        {new Date(n.updated_at).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {/* Unread Dot */}
                    {!n.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00b24e] shrink-0 mt-2"></div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer (Optional) */}
          <div className="border-t border-[#E2E8F0] p-3 text-center bg-[#F9FBFD]">
            <button 
              onClick={() => {
                setIsOpen(false);
                router.push(`/${companySlug}/notifications`);
              }}
              className="text-[13px] text-[#9CA3AF] hover:text-[#1E2A3A] cursor-pointer font-medium transition-colors w-full"
            >
              Lịch sử thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
