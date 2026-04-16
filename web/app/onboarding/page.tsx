"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function generateSlug(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

type Invitation = {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  role: string;
  status: string;
  created_at: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  useEffect(() => {
    if (name) {
      setSlug(generateSlug(name));
    } else {
      setSlug("");
    }
  }, [name]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem("okrgo_token");
      if (!token) {
        router.push("/login"); // safety net
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/invitations`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setInvitations(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (invitation: Invitation) => {
    setAcceptingId(invitation.id);
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/invitations/${invitation.id}/accept`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Tham gia công ty thành công!");
      router.push(`/${data.slug}/departments`);
    } catch (err: any) {
      toast.error(err.message || "Không thể chấp nhận lời mời.");
      setAcceptingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Vui lòng điền tên Công ty và đường dẫn.");
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, slug })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại.");

      toast.success("Khởi tạo công ty thành công!");
      router.push(`/${data.slug}/departments`);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("okrgo_token");
    toast.success("Đã đăng xuất.");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F5F7FA]">
        <div className="text-[14px] font-medium text-[#5A6E85] animate-pulse">Đang nạp dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F5F7FA] p-6">
      <div className="w-full max-w-lg bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-[#F0F2F5]">
        
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">OKRgo</h1>
          <p className="text-[14px] text-[#ef4444] mt-2 font-medium bg-red-50 py-2 px-4 rounded-[8px] inline-block">
            Bạn phải tham gia công ty/tổ chức để sử dụng các chức năng
          </p>
        </div>

        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Box 1: Lời mời */}
          <div>
            <h2 className="text-[16px] font-semibold text-[#1E2A3A] mb-3">Lời mời tham gia công ty ({invitations.length}):</h2>
            {invitations.length > 0 ? (
              <div className="space-y-3">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between bg-[#F9FBFD] p-4 border border-[#E2E8F0] rounded-[10px]">
                    <div>
                      <h4 className="text-[15px] font-semibold text-[#1E2A3A]">{inv.name}</h4>
                      <p className="text-[13px] text-[#9CA3AF]">Mời bạn với vai trò: <span className="font-medium text-[#1E2A3A]">{inv.role}</span></p>
                    </div>
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      disabled={acceptingId === inv.id}
                      className="px-5 py-2 bg-[#00b24e] hover:bg-[#009b43] text-white text-[13px] font-medium rounded-[8px] transition-colors shadow-sm disabled:bg-[#9CA3AF]"
                    >
                      {acceptingId === inv.id ? 'Đang vào...' : 'Tham gia'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[14px] text-[#5A6E85] bg-[#F9FBFD] p-4 rounded-[10px] text-center border border-[#E2E8F0]">
                Hiện tại không có lời mời tham gia tổ chức nào dành cho Email này.
              </div>
            )}
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink-0 mx-4 text-[#9CA3AF] text-[13px] font-medium">HOẶC LÀ</span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          {/* Box 2: Tạo công ty */}
          <div>
            <h2 className="text-[16px] font-semibold text-[#1E2A3A] mb-3">Khởi tạo một Công ty/Tổ chức mới:</h2>
            <form onSubmit={handleCreate} className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Tên tổ chức (hoặc Đội nhóm)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="Ví dụ: VibeCode Tech"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Đường dẫn (URL)</label>
                <div className="flex items-center border border-[#E2E8F0] rounded-[10px] overflow-hidden focus-within:border-[#00b24e] focus-within:ring-1 focus-within:ring-[#00b24e]/10 transition-colors bg-[#F9FBFD]">
                  <span className="py-2.5 pl-3 pr-1 text-[#5A6E85] text-[14px]">
                    okrgo.com/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="w-full outline-none py-2.5 px-2 text-[14px] font-semibold text-[#00b24e] bg-transparent"
                    placeholder="vibecode-tech"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isCreating || !slug}
                className={`w-full text-white py-3 rounded-[10px] font-semibold text-[14px] transition-colors mt-2 ${isCreating ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#1E2A3A] hover:bg-[#0f172a]'}`}
              >
                {isCreating ? 'Đang tạo...' : 'Tạo Công ty mới'}
              </button>
            </form>
          </div>

        </div>

        {/* Nút đăng xuất */}
        <div className="mt-8 text-center pt-6 border-t border-[#F0F2F5]">
          <button 
            onClick={logout}
            className="text-[13px] text-[#9CA3AF] hover:text-[#ef4444] transition-colors font-medium underline"
          >
            Đăng xuất tài khoản hiện tại
          </button>
        </div>

      </div>
    </div>
  );
}
