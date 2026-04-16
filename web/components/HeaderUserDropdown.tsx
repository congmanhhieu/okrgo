"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image";
import { LogOut, User as UserIcon } from "lucide-react";

type ProfileData = {
  user: {
    name: string;
    avatar_url?: string;
  };
};

export default function HeaderUserDropdown() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.companySlug as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!companySlug) return;
      try {
        const res = await api.get(`/workspaces/${companySlug}/profile`);
        setProfile(res);
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [companySlug]);

  const handleLogout = () => {
    localStorage.removeItem("okrgo_token");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <div className="text-right ml-2 border-l border-[#E2E8F0] pl-5 flex flex-col justify-center">
        <div className="text-[12px] text-[#9CA3AF] font-medium">Xin chào,</div>
        <div className="text-[14px] font-bold text-[#1E2A3A] truncate max-w-[150px] leading-tight mt-0.5">
          {profile?.user?.name || "Bạn"}
        </div>
      </div>
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="ml-3 h-10 w-10 rounded-full bg-[#E6F7ED] border border-[#00b24e]/20 text-[#00b24e] flex items-center justify-center text-sm font-bold shadow-sm cursor-pointer overflow-hidden transition-transform hover:scale-105 active:scale-95"
      >
        {profile?.user?.avatar_url ? (
          <img src={getImageUrl(profile.user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          getInitials(profile?.user?.name || "")
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-[10px] shadow-lg overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          <button
            onClick={() => {
              setIsOpen(false);
              router.push(`/${companySlug}/profile`);
            }}
            className="w-full flex items-center px-4 py-2.5 text-left text-[14px] text-[#1E2A3A] hover:bg-[#F9FBFD] transition-colors"
          >
            <UserIcon className="w-4 h-4 mr-3 text-[#9CA3AF]" />
            Hồ sơ cá nhân
          </button>
          <div className="border-t border-[#E2E8F0] my-1"></div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-left text-[14px] text-[#ef4444] hover:bg-[#FEF2F2] transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3 text-[#ef4444]" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
