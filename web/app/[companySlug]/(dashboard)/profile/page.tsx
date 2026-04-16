"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, Calendar, Building, Briefcase, UserCheck, Star, Award, Camera, Key } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image";

export default function ProfilePage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form states mapping global and company context
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/workspaces/${companySlug}/profile`);
      if (data) {
        setProfile(data);
        setName(data.user?.name || "");
        setPhone(data.user?.phone || "");
        setAddress(data.user?.address || "");

        let bd = data.user?.birth_date || "";
        if (bd) bd = bd.split("T")[0]; // parse date only
        setBirthDate(bd);
      }
    } catch (e) {
      toast.error("Lỗi khi tải thông tin cá nhân");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [companySlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/workspaces/${companySlug}/profile`, {
        name: name,
        phone: phone || null,
        address: address || null,
        birth_date: birthDate || null,
        // Department and Position configs should be updated via Admin Panel. 
        // We don't allow users to change their own role/department freely here.
        department_id: profile?.department_id,
        position: profile?.position,
        manager_id: profile?.manager_id
      });

      toast.success("Đã cập nhật thông tin cá nhân!");
      loadProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    const toastId = toast.loading("Đang tải ảnh lên...");
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("avatar", file);

      const uploadData = await api.postForm(`/upload/avatar`, formData);
      if (!uploadData?.url) throw new Error("Tải ảnh thất bại");

      const avatarUrl = uploadData.url;

      // 2. Map avatar to user
      await api.put(`/workspaces/${companySlug}/avatar`, { avatar_url: avatarUrl });

      toast.success("Thay đổi ảnh đại diện thành công!", { id: toastId });
      loadProfile();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Vui lòng nhập đủ trường");
      return;
    }

    try {
      await api.post(`/users/change-password`, {
        old_password: oldPassword,
        new_password: newPassword
      });

      toast.success("Đổi mật khẩu thành công!");
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Thông tin cá nhân</h1>
          <p className="text-[#5A6E85] mt-1 text-[14px]">Quản lý thông tin định danh và hồ sơ Công việc</p>
        </div>
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium text-[#1E2A3A] hover:bg-[#F9FBFD] transition-colors"
        >
          <Key className="w-4 h-4 text-[#5A6E85]" />
          <span>Đổi mật khẩu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cột 1: Thông tin Global */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card Avatar */}
          <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-6 text-center">
            <div className="relative inline-block group">
              <div className="w-24 h-24 rounded-full mx-auto border-4 border-[#F5F7FA] overflow-hidden bg-[#F0F2F5]">
                {profile?.user.avatar_url ? (
                  <img src={getImageUrl(profile.user.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#9CA3AF] mx-auto mt-5" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-[#00b24e] text-white rounded-full hover:bg-[#009440] transition-colors shadow-md"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <h2 className="mt-4 text-[18px] font-bold text-[#1E2A3A]">{profile?.user.name}</h2>
            <p className="text-[14px] text-[#5A6E85]">{profile?.user.email}</p>
            <div className="mt-2 text-[12px] font-medium px-2.5 py-1 bg-[#E6F7ED] text-[#00b24e] rounded-full inline-block">
              {profile?.company_role === 'admin' ? 'Quản trị viên' : (profile?.company_role === 'manager' ? 'Quản lý' : 'Nhân viên')}
            </div>
          </div>

          {/* Card Company Context */}
          <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-[14px] font-bold text-[#1E2A3A] mb-4 uppercase tracking-wider">Hồ sơ Cán bộ ({companySlug})</h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="w-5 h-5 text-[#5A6E85] mt-0.5" />
                <div>
                  <p className="text-[13px] text-[#9CA3AF] font-medium">Phòng ban</p>
                  <p className="text-[14px] text-[#1E2A3A] font-medium">{profile?.department_name || "Chưa phân bổ"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="w-5 h-5 text-[#5A6E85] mt-0.5" />
                <div>
                  <p className="text-[13px] text-[#9CA3AF] font-medium">Vị trí chức danh</p>
                  <p className="text-[14px] text-[#1E2A3A] font-medium">{profile?.position || "Chưa cấu hình"}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <UserCheck className="w-5 h-5 text-[#5A6E85] mt-0.5" />
                <div>
                  <p className="text-[13px] text-[#9CA3AF] font-medium">Quản lý trực tiếp</p>
                  <p className="text-[14px] text-[#1E2A3A] font-medium">{profile?.manager_name || "Trực thuộc Giám đốc"}</p>
                </div>
              </div>
            </div>

            {/* Thẻ Kudo & Sao */}
            <div className="mt-6 pt-6 border-t border-[#E2E8F0] grid grid-cols-2 gap-4">
              <div className="bg-[#FFF8E7] rounded-[10px] p-3 text-center border border-[#FFF0CB]">
                <Star className="w-5 h-5 text-[#F59E0B] mx-auto mb-1" />
                <p className="text-[12px] font-medium text-[#B45309]">Ví sao</p>
                <p className="text-[18px] font-bold text-[#D97706]">{profile?.stars_balance || 0}</p>
              </div>
              <div className="bg-[#F0FDF4] rounded-[10px] p-3 text-center border border-[#DCFCE7]">
                <Award className="w-5 h-5 text-[#10B981] mx-auto mb-1" />
                <p className="text-[12px] font-medium text-[#047857]">Kudos Nhận</p>
                <p className="text-[18px] font-bold text-[#059669]">{profile?.total_kudo_receive || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột 2: Form nhập liệu Global */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-6">
            <h3 className="text-[16px] font-bold text-[#1E2A3A] mb-6">Chi tiết định danh</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] py-2.5 px-3 text-[14px] text-[#1E2A3A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Email hệ thống (Chỉ đọc)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="email"
                    value={profile?.user.email}
                    disabled
                    className="w-full pl-10 border border-[#E2E8F0] bg-[#F5F7FA] rounded-[10px] py-2.5 px-3 text-[14px] text-[#5A6E85] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] py-2.5 px-3 text-[14px] text-[#1E2A3A]"
                    placeholder="VD: 0912 345 678"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Ngày sinh</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] py-2.5 px-3 text-[14px] text-[#1E2A3A]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[14px] font-medium text-[#1E2A3A]">Khu vực / Tỉnh thành phố</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 border border-[#E2E8F0] rounded-[10px] outline-none focus:border-[#00b24e] py-2.5 px-3 text-[14px] text-[#1E2A3A]"
                    placeholder="Quận/Huyện, Tỉnh/TP"
                  />
                </div>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 text-white bg-[#00b24e] hover:bg-[#009440] rounded-[8px] text-[14px] font-bold transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* MODAL ĐỔI MK */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] w-full max-w-sm shadow-xl p-6 zoom-in-95 animate-in duration-200">
            <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-4">Đổi Mật Khẩu</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Mật khẩu cũ</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[14px] outline-none focus:ring-1 focus:ring-[#00b24e]/50"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[14px] outline-none focus:ring-1 focus:ring-[#00b24e]/50"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 bg-[#F5F7FA] text-[#5A6E85] text-[14px] font-medium rounded-[8px] hover:bg-[#E2E8F0] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1E2A3A] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#0f172a] transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
