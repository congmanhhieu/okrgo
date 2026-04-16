"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  // Tabs: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Validate form before submitting
  const validate = () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (!email || !password) {
      toast.error("Vui lòng điền đầy đủ Email và Mật khẩu.");
      return false;
    }
    if (activeTab === "register") {
      if (!name || !phone) {
        toast.error("Vui lòng điền họ tên và số điện thoại.");
        return false;
      }
      if (password !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không trùng khớp.");
        return false;
      }
      if (password.length < 6) {
        toast.error("Mật khẩu phải chứa ít nhất 6 ký tự.");
        return false;
      }
    }
    return true;
  };

  // Handle Action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const endpoint = activeTab === "login" ? "/auth/login" : "/auth/register";
      const payload: any = { email, password };
      if (activeTab === "register") {
        payload.name = name;
        payload.phone = phone;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }

      if (activeTab === "register") {
        toast.success("Đăng ký thành công! Đang đăng nhập...");
      } else {
        toast.success("Đăng nhập thành công!");
      }
      
      localStorage.setItem("okrgo_token", data.token);

      // Check Workspaces logic
      const wsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        headers: { "Authorization": `Bearer ${data.token}` }
      });
      
      if (wsRes.ok) {
        const workspaces = await wsRes.json();
        if (workspaces && workspaces.length > 0) {
          router.push(`/${workspaces[0].slug}/departments`);
        } else {
          router.push("/onboarding");
        }
      } else {
        router.push("/onboarding");
      }
      
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // For Forgot password
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập Email để đặt lại mật khẩu.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gửi yêu cầu thất bại.");
      }

      toast.success(data.message || "Đã gửi link đặt lại mật khẩu vào " + email);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#F5F7FA] p-6">
      <div className="w-full max-w-md bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-[#F0F2F5]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">OKRgo</h1>
          <p className="text-[14px] text-[#5A6E85] mt-2">Bứt phá giới hạn, Chinh phục mục tiêu</p>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex border-b border-[#E2E8F0]">
            <button 
              onClick={() => setActiveTab("login")}
              className={`flex-1 text-center py-3 text-[14px] font-medium transition-colors ${
                activeTab === "login" || activeTab === "forgot"
                  ? "text-[#00b24e] border-b-2 border-[#00b24e]" 
                  : "text-[#5A6E85] hover:text-[#1E2A3A] hover:bg-[#F9FBFD] rounded-t-[10px]"
              }`}
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => setActiveTab("register")}
              className={`flex-1 text-center py-3 text-[14px] font-medium transition-colors ${
                activeTab === "register" 
                  ? "text-[#00b24e] border-b-2 border-[#00b24e]" 
                  : "text-[#5A6E85] hover:text-[#1E2A3A] hover:bg-[#F9FBFD] rounded-t-[10px]"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* LOGIN TAB */}
          {(activeTab === "login") && (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="you@company.com"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center justify-between text-[12px] text-[#5A6E85]">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#00b24e] w-4 h-4 rounded border-[#E2E8F0] cursor-pointer group-hover:ring-2 ring-[#00b24e]/20 transition-all" 
                  />
                  <span className="group-hover:text-[#1E2A3A] transition-colors">Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" onClick={() => setActiveTab("forgot")} className="text-[#00b24e] hover:text-[#009440] font-medium transition-colors">
                  Quên mật khẩu?
                </button>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full text-white mt-2 py-2.5 rounded-[10px] font-medium text-[14px] transition-colors ${isLoading ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#00b24e] hover:bg-[#009440]'}`}
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          )}

          {/* REGISTER TAB */}
          {activeTab === "register" && (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Họ tên</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1 flex flex-col space-y-1.5">
                    <label className="text-[14px] font-medium text-[#1E2A3A]">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                      placeholder="you@email.com"
                    />
                 </div>
                 <div className="flex-1 flex flex-col space-y-1.5">
                    <label className="text-[14px] font-medium text-[#1E2A3A]">Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                      placeholder="0912 345 678"
                    />
                 </div>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="Min. 6 ký tự"
                />
              </div>
               <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>
              <button 
                 type="submit" 
                 disabled={isLoading}
                 className={`w-full text-white mt-4 py-2.5 rounded-[10px] font-medium text-[14px] transition-colors ${isLoading ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#1E2A3A] hover:bg-[#0f172a]'}`}
              >
                {isLoading ? 'Đang khởi tạo...' : 'Đăng ký tài khoản'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD TAB */}
          {activeTab === "forgot" && (
            <form onSubmit={handleForgot} className="flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-[14px] text-[#5A6E85] font-light leading-relaxed">
                Nhập email mà bạn đã đăng ký để chúng tôi gửi đường liên kết đặt lại mật khẩu của bạn.
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Email hệ thống</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
                  placeholder="you@company.com"
                />
              </div>
              <button 
                 type="submit" 
                 disabled={isLoading}
                 className={`w-full text-white mt-2 py-2.5 rounded-[10px] font-medium text-[14px] transition-colors ${isLoading ? 'bg-[#9CA3AF] cursor-not-allowed' : 'bg-[#00b24e] hover:bg-[#009440]'}`}
              >
                {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu Khôi phục'}
              </button>
              
              <button type="button" onClick={() => setActiveTab("login")} className="text-[13px] text-[#5A6E85] hover:text-[#1E2A3A] underline text-center mt-2">
                Quay lại đăng nhập
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
