"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Search, Users, Trash2, Pencil, X, ShieldAlert,
  Upload, Download, ChevronDown, Shield, UserCog, User as UserIcon
} from "lucide-react";
import { getImageUrl } from "@/lib/image";

type Staff = {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: string | null;
  department_id: number | null;
  department_name: string | null;
  role: string;
  is_active: boolean;
  joined_at: string;
};

type DeptOption = {
  id: number;
  name: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý",
  user: "Nhân viên",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  user: "bg-gray-50 text-gray-600 border-gray-200",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Shield,
  manager: UserCog,
  user: UserIcon,
};

export default function StaffPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [staff, setStaff] = useState<Staff[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Departments for filter / form
  const [departments, setDepartments] = useState<DeptOption[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditStaff, setCurrentEditStaff] = useState<Staff | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formDepartmentId, setFormDepartmentId] = useState<number | null>(null);
  const [formRole, setFormRole] = useState("user");
  const [formIsActive, setFormIsActive] = useState(true);

  // Delete Confirm Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteStaff, setDeleteStaff] = useState<Staff | null>(null);

  // More dropdown
  const [openMoreId, setOpenMoreId] = useState<number | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("okrgo_token");
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/staff`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());
      if (searchQuery) url.searchParams.append("search", searchQuery);
      if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
      if (departmentFilter !== "all") url.searchParams.append("department_id", departmentFilter);
      if (roleFilter !== "all") url.searchParams.append("role", roleFilter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setStaff(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/departments/dropdown`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      }
    } catch { }
  };

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, departmentFilter, roleFilter]);

  // Debounced Search
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchStaff();
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Close more dropdown on click outside
  useEffect(() => {
    const handleClick = () => setOpenMoreId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPosition("");
    setFormDepartmentId(null);
    setFormRole("user");
    setFormIsActive(true);
    setCurrentEditStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: Staff) => {
    setModalMode("edit");
    setCurrentEditStaff(s);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone || "");
    setFormPosition(s.position || "");
    setFormDepartmentId(s.department_id);
    setFormRole(s.role);
    setFormIsActive(s.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === "create") {
      if (!formName.trim() || !formEmail.trim()) {
        toast.error("Họ tên và Email không được để trống");
        return;
      }
    }

    try {
      const token = localStorage.getItem("okrgo_token");

      if (modalMode === "create") {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/staff`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formName,
              email: formEmail,
              phone: formPhone || null,
              position: formPosition || null,
              department_id: formDepartmentId,
              role: formRole,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Thêm nhân sự thất bại");
        toast.success("Thêm nhân sự thành công! Email mời đã được gửi.");
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/staff/${currentEditStaff?.user_id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              position: formPosition || null,
              department_id: formDepartmentId,
              role: formRole,
              is_active: formIsActive,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
        toast.success("Cập nhật nhân sự thành công");
      }

      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteStaff) return;
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/staff/${deleteStaff.user_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Đã xóa nhân sự khỏi công ty!");
      setIsDeleteModalOpen(false);
      setDeleteStaff(null);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportCSV = () => {
    // Build CSV from current data
    const headers = ["Họ tên", "Email", "Số điện thoại", "Vị trí", "Phòng ban", "Quyền", "Trạng thái"];
    const rows = staff.map(s => [
      s.name,
      s.email,
      s.phone || "",
      s.position || "",
      s.department_name || "",
      ROLE_LABELS[s.role] || s.role,
      s.is_active ? "Hoạt động" : "Đã ngừng",
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nhansu_${companySlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải xuống file CSV");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Quản lý Nhân sự</h1>
          <p className="text-[14px] text-[#5A6E85] mt-1">
            Quản lý danh sách nhân viên, phân công phòng ban và quyền hạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 border border-[#E2E8F0] text-[#5A6E85] px-4 py-2.5 rounded-[10px] text-[13px] font-medium hover:bg-[#F5F7FA] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân sự</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F9FBFD] flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <select
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[13px] text-[#1E2A3A] outline-none hover:border-[#CBD5E1] transition-colors cursor-pointer bg-white"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[13px] text-[#1E2A3A] outline-none hover:border-[#CBD5E1] transition-colors cursor-pointer bg-white"
            >
              <option value="all">Tất cả quyền</option>
              <option value="admin">Quản trị viên</option>
              <option value="manager">Quản lý</option>
              <option value="user">Nhân viên</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[13px] text-[#1E2A3A] outline-none hover:border-[#CBD5E1] transition-colors cursor-pointer bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã ngừng</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Nhân sự</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">SĐT</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Quyền</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#5A6E85]">
                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e] mx-auto"></div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-8 h-8 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[#1E2A3A] font-medium">Không tìm thấy nhân sự</p>
                    <p className="text-[#5A6E85] text-[13px] mt-1">Hãy thêm nhân sự đầu tiên cho tổ chức của bạn.</p>
                  </td>
                </tr>
              ) : (
                staff.map((s) => {
                  const RoleIcon = ROLE_ICONS[s.role] || UserIcon;
                  return (
                    <tr key={s.user_id} className="hover:bg-[#F9FBFD] transition-colors group">
                      {/* Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {s.avatar_url ? (
                            <img
                              src={getImageUrl(s.avatar_url)}
                              alt={s.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00b24e] to-[#009440] flex items-center justify-center text-white text-[12px] font-bold">
                              {getInitials(s.name)}
                            </div>
                          )}
                          <span className="font-medium text-[#1E2A3A] text-[14px]">{s.name}</span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#1E2A3A]">
                          {s.position || <span className="text-[#9CA3AF] italic">Chưa gán</span>}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        {s.department_name ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-[#F5F7FA] border border-[#E2E8F0] text-[12px] font-medium text-[#1E2A3A]">
                            {s.department_name}
                          </span>
                        ) : (
                          <span className="text-[13px] text-[#9CA3AF] italic">Chưa phân bổ</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#5A6E85]">{s.email}</span>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#5A6E85]">{s.phone || "—"}</span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${s.is_active
                            ? "bg-[#E6F7ED] text-[#00b24e]"
                            : "bg-red-50 text-red-600"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-[#00b24e]" : "bg-red-500"}`}
                          ></span>
                          <span>{s.is_active ? "Hoạt động" : "Đã ngừng"}</span>
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] border text-[12px] font-medium ${ROLE_COLORS[s.role] || ROLE_COLORS.user}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{ROLE_LABELS[s.role] || s.role}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-[#5A6E85] hover:text-[#00b24e] hover:bg-[#E6F7ED] rounded-[6px] transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteStaff(s);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-[#5A6E85] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-[13px]">
            <span className="text-[#5A6E85]">
              Hiển thị {(page - 1) * limit + 1} đến {Math.min(page * limit, total)} trong số {total} kết quả
            </span>
            <div className="flex space-x-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-[#1E2A3A] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-[#1E2A3A] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] w-full max-w-lg shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F9FBFD]">
              <h3 className="text-[16px] font-bold text-[#1E2A3A]">
                {modalMode === "create" ? "Thêm Nhân sự Mới" : "Cập nhật Nhân sự"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#1E2A3A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {modalMode === "create" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#1E2A3A]">
                        Họ tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        autoFocus
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#1E2A3A]">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="email@congty.vn"
                        className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#1E2A3A]">Số điện thoại</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0901 234 567"
                      className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </>
              )}

              {modalMode === "edit" && (
                <div className="flex items-center space-x-3 p-3 bg-[#F9FBFD] border border-[#E2E8F0] rounded-[8px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00b24e] to-[#009440] flex items-center justify-center text-white text-[13px] font-bold">
                    {getInitials(currentEditStaff?.name || "")}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#1E2A3A]">{currentEditStaff?.name}</p>
                    <p className="text-[12px] text-[#5A6E85]">{currentEditStaff?.email}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">Vị trí / Chức vụ</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="VD: Senior Developer, PM..."
                    className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">Phòng ban</label>
                  <select
                    value={formDepartmentId?.toString() || ""}
                    onChange={(e) => setFormDepartmentId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none hover:border-[#CBD5E1] focus:border-[#00b24e] transition-colors cursor-pointer bg-white"
                  >
                    <option value="">Chưa phân bổ</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Quyền hạn</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["user", "manager", "admin"] as const).map((role) => {
                    const Icon = ROLE_ICONS[role];
                    const isSelected = formRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormRole(role)}
                        className={`flex items-center justify-center space-x-2 py-2.5 rounded-[8px] border text-[13px] font-medium transition-all ${isSelected
                          ? "border-[#00b24e] bg-[#E6F7ED] text-[#00b24e]"
                          : "border-[#E2E8F0] bg-white text-[#5A6E85] hover:border-[#CBD5E1]"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{ROLE_LABELS[role]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {modalMode === "edit" && (
                <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-[8px] bg-[#F9FBFD]">
                  <div>
                    <p className="text-[13px] font-medium text-[#1E2A3A]">Trạng thái kích hoạt</p>
                    <p className="text-[11px] text-[#5A6E85]">Nhân sự bị vô hiệu hóa sẽ không thể truy cập nội dung công ty</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#E2E8F0] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b24e]"></div>
                  </label>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium text-[#5A6E85] hover:bg-[#F5F7FA] transition-colors"
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00b24e] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
                >
                  {modalMode === "create" ? "Thêm & Gửi Email mời" : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && deleteStaff && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-xl zoom-in-95 animate-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-2">Xóa nhân sự</h3>
            <p className="text-[13px] text-[#5A6E85] mb-1">
              Bạn chắc chắn muốn xóa <strong className="text-[#1E2A3A]">{deleteStaff.name}</strong> khỏi tổ chức?
            </p>
            <p className="text-[12px] text-[#9CA3AF] mb-6">
              Nhân sự sẽ mất quyền truy cập tổ chức. Tài khoản người dùng không bị xóa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteStaff(null);
                }}
                className="flex-1 py-2 bg-[#F5F7FA] text-[#5A6E85] font-medium text-[14px] rounded-[8px] hover:bg-[#E2E8F0]"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 text-white font-medium text-[14px] rounded-[8px] hover:bg-red-700 shadow-sm"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
