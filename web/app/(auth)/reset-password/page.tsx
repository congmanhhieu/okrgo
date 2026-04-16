"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Đường dẫn cài lại mật khẩu không hợp lệ (Thiếu Token).");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ mật khẩu mới.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra, token có thể đã quá hạn.");
      }

      toast.success("Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập lại.");
      router.push("/login");

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col space-y-4 text-center">
        <div className="text-[14px] text-red-500 font-medium bg-red-50 py-3 rounded-[8px]">
          Không tìm thấy Token. Đường dẫn không hợp lệ!
        </div>
        <Link href="/login" className="text-[14px] text-[#00b24e] font-medium hover:underline">
          Quay lại màn Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-2">
        <p className="text-[14px] text-[#5A6E85] leading-relaxed">
          Vui lòng nhập mật khẩu mới của bạn bên dưới.
        </p>
      </div>

      <div className="flex flex-col space-y-1.5">
        <label className="text-[14px] font-medium text-[#1E2A3A]">Mật khẩu mới</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] transition-colors py-2.5 px-3 text-[#1E2A3A] text-[14px] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#00b24e]/10"
          placeholder="Tối thiểu 6 ký tự"
        />
      </div>

      <div className="flex flex-col space-y-1.5">
        <label className="text-[14px] font-medium text-[#1E2A3A]">Xác nhận Mật khẩu mới</label>
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
        className={`w-full text-white mt-4 py-2.5 rounded-[10px] font-medium text-[14px] transition-colors ${
          isLoading ? "bg-[#9CA3AF] cursor-not-allowed" : "bg-[#00b24e] hover:bg-[#009440]"
        }`}
      >
        {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </button>

      <div className="text-center">
        <Link href="/login" className="text-[13px] text-[#5A6E85] hover:text-[#1E2A3A] underline transition-colors">
          Quay lại màn Đăng nhập
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[100dvh] bg-[#F5F7FA]">
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-bold text-[#1E2A3A] tracking-tight">OKRgo</h1>
            <p className="text-[#5A6E85] mt-2 text-[15px]">Tạo mật khẩu mới</p>
          </div>

          {/* Form Card */}
          <div className="bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] border border-[#F0F2F5]">
            <Suspense fallback={<div className="text-[14px] text-center text-[#5A6E85]">Đang tải...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
