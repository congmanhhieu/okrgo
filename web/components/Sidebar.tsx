"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown, Plus, LayoutDashboard, Target, Activity, Users, UserCog, Building2, Settings, LogOut, Gift, MessageSquare, MessageCircle, CheckSquare, CalendarRange, Star, ListTodo } from "lucide-react";
import { toast } from "sonner";

type Workspace = {
  id: number;
  name: string;
  slug: string;
  role: string;
};

export default function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentSlug = params?.companySlug as string;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch workspaces to populate the switcher
    const fetchWorkspaces = async () => {
      const token = localStorage.getItem("okrgo_token");
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data || []);
        } else {
          toast.error("Không thể tải danh sách Công ty.");
        }
      } catch (e) {
        console.error(e);
        toast.error("Mất kết nối máy chủ.");
      }
    };
    fetchWorkspaces();
  }, []);

  // Handle clicking outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeWorkspace = workspaces.find(w => w.slug === currentSlug) || workspaces[0];

  const handleSwitchWorkspace = (slug: string) => {
    setIsDropdownOpen(false);
    if (slug === currentSlug) return;
    router.push(`/${slug}/dashboard`);
  };

  const isAdmin = activeWorkspace?.role === "admin";

  const navItems = [
    { name: "Tổng quan", href: `/${currentSlug}/dashboard`, icon: LayoutDashboard },
    { name: "Mục tiêu (OKRs)", href: `/${currentSlug}/okrs`, icon: Target },
    { name: "Check-in OKR", href: `/${currentSlug}/checkins`, icon: Activity },
    { name: "Todaylist", href: `/${currentSlug}/today`, icon: CheckSquare },
    { name: "Công việc", href: `/${currentSlug}/tasks`, icon: ListTodo },
    { name: "Phản hồi", href: `/${currentSlug}/feedbacks`, icon: MessageCircle },
    { name: "Vinh danh", href: `/${currentSlug}/kudos`, icon: MessageSquare },
    { name: "Đổi quà", href: `/${currentSlug}/gifts`, icon: Gift },
    { name: "Phòng ban", href: `/${currentSlug}/departments`, icon: Building2, adminOnly: true },
    { name: "Nhân sự", href: `/${currentSlug}/staff`, icon: Users, adminOnly: true },
    { name: "Chu kỳ OKR", href: `/${currentSlug}/cycles`, icon: CalendarRange, adminOnly: true },
    { name: "Quản lý sao", href: `/${currentSlug}/star-criteria`, icon: Star, adminOnly: true },
    { name: "Kho quà tặng", href: `/${currentSlug}/gifts-admin`, icon: Gift, adminOnly: true },
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-[#E2E8F0] flex flex-col shadow-sm z-20 flex-shrink-0">
      <div className="p-6">
        <h1 className="text-[24px] font-bold text-[#1E2A3A] mb-8 tracking-tight">OKRgo</h1>

        {/* Workspace Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-[#F9FBFD] border border-[#E2E8F0] px-3 py-2.5 rounded-[10px] hover:border-[#00b24e] hover:bg-[#F0FFF6] focus:ring-2 focus:ring-[#00b24e]/20 transition-all text-left"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-[14px] font-semibold text-[#1E2A3A] truncate">
                {activeWorkspace?.name || "Đang tải..."}
              </span>
              <span className="text-[12px] text-[#5A6E85] font-medium capitalize">
                {activeWorkspace?.role || "Gói miễn phí"} {activeWorkspace?.role === "admin" && "• Quản trị"}
              </span>
            </div>
            <ChevronDown className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-[10px] shadow-lg overflow-hidden py-1 z-50">
              <div className="px-3 py-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                CÔNG TY CỦA BẠN
              </div>
              <div className="max-h-[220px] overflow-y-auto">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.slug)}
                    className={`w-full flex items-center px-3 py-2.5 text-left transition-colors ${ws.slug === currentSlug
                      ? "bg-[#E6F7ED] text-[#00b24e] font-semibold"
                      : "hover:bg-[#F9FBFD] text-[#1E2A3A]"
                      }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] truncate">{ws.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-[#E2E8F0] mt-1 p-1">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="w-full flex items-center px-3 py-2 text-[#5A6E85] hover:text-[#1E2A3A] hover:bg-[#F9FBFD] rounded-[6px] text-left transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2 text-[#9CA3AF]" />
                  <span className="text-[13px] font-medium">Tạo / Gia nhập mới</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2">
        {navItems.filter(item => !item.adminOnly || isAdmin).map(item => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center py-2.5 px-3 rounded-[10px] text-[14px] font-medium transition-colors ${isActive
                ? "text-[#00b24e] bg-[#E6F7ED]"
                : "text-[#5A6E85] hover:bg-[#F1F5F9] hover:text-[#1E2A3A]"
                }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-[#00b24e]" : "text-[#9CA3AF]"}`} />
              {item.name}
            </a>
          );
        })}
      </nav>

      {isAdmin && (
        <div className="p-4 border-t border-[#E2E8F0] mt-auto">
          <a href={`/${currentSlug}/settings`} className="flex items-center py-2.5 px-3 rounded-[10px] text-[14px] font-medium text-[#5A6E85] hover:bg-[#F1F5F9] transition-colors">
            <Settings className="w-5 h-5 mr-3 text-[#9CA3AF]" />
            Cài đặt hệ thống
          </a>
        </div>
      )}
    </aside>
  );
}
