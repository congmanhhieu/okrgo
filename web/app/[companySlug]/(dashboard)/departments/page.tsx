"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Building2, MoreHorizontal, Pencil, Trash2, ShieldAlert, Users, X, Check, Search as SearchIcon } from "lucide-react";

type Department = {
  id: number;
  name: string;
  is_active: boolean;
  manager_id: number | null;
  manager_name: string | null;
  employee_count: number;
  created_at: string;
};

type UserOption = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export default function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.companySlug as string;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formManagerId, setFormManagerId] = useState<number | null>(null);

  // Type-ahead dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  // Delete Confirm Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("okrgo_token");
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/departments`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());
      if (searchQuery) url.searchParams.append("search", searchQuery);
      if (statusFilter !== "all") url.searchParams.append("status", statusFilter);

      const res = await fetch(url.toString(), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");

      setDepartments(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // Debounced Search for departments
  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      fetchDepartments();
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      if (!userDropdownOpen) return;
      try {
        const token = localStorage.getItem("okrgo_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/users/search?q=${encodeURIComponent(userSearchQuery)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserOptions(data || []);
        }
      } catch (err) { }
    };

    const delay = setTimeout(fetchUsers, 400);
    return () => clearTimeout(delay);
  }, [userSearchQuery, userDropdownOpen, companySlug]);

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormName("");
    setFormIsActive(true);
    setFormManagerId(null);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dep: Department) => {
    setModalMode("edit");
    setCurrentEditId(dep.id);
    setFormName(dep.name);
    setFormIsActive(dep.is_active);
    setFormManagerId(dep.manager_id);
    if (dep.manager_id) {
      setSelectedUser({ id: dep.manager_id, name: dep.manager_name || "", email: "", phone: null });
    } else {
      setSelectedUser(null);
    }
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Tên phòng ban không được để trống");
      return;
    }

    try {
      const token = localStorage.getItem("okrgo_token");
      const url = modalMode === "create"
        ? `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/departments`
        : `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/departments/${currentEditId}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formName,
          is_active: formIsActive,
          manager_id: formManagerId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xảy ra lỗi");

      toast.success(modalMode === "create" ? "Tạo phòng ban thành công" : "Cập nhật thành công");
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/departments/${deleteId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Đã xóa phòng ban!");
      setIsDeleteModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Quản lý Phòng ban</h1>
          <p className="text-[14px] text-[#5A6E85] mt-1">Cấu trúc bộ máy nhân sự định hình sự phát triển</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phòng ban mới</span>
        </button>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F9FBFD] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-[8px] px-4 py-2 text-[14px] text-[#1E2A3A] outline-none hover:border-[#CBD5E1] transition-colors cursor-pointer bg-white"
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
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Trưởng phòng</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Tình trạng</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-right">Tùy chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[#5A6E85]">
                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e] mx-auto"></div>
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-8 h-8 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[#1E2A3A] font-medium">Không tìm thấy dữ liệu</p>
                    <p className="text-[#5A6E85] text-[13px] mt-1">Phòng ban bạn tìm kiếm không có trong hệ thống.</p>
                  </td>
                </tr>
              ) : (
                departments.map(dep => (
                  <tr key={dep.id} className="hover:bg-[#F9FBFD] transition-colors group">
                    <td className="px-6 py-4">
                      <div
                        className="font-medium text-[#1E2A3A] hover:text-[#00b24e] cursor-pointer transition-colors flex items-center space-x-2"
                        onClick={() => router.push(`/${companySlug}/users?department_id=${dep.id}`)}
                      >
                        <span>{dep.name}</span>
                      </div>
                      <div className="text-[12px] text-[#5A6E85] mt-1 flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{dep.employee_count} nhân sự</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {dep.manager_id ? (
                        <div className="inline-flex items-center space-x-2 bg-[#F5F7FA] border border-[#E2E8F0] px-3 py-1.5 rounded-[6px]">
                          <div className="w-5 h-5 bg-[#1E2A3A] rounded-full text-white flex items-center justify-center text-[10px] font-bold">
                            {dep.manager_name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium text-[#1E2A3A]">{dep.manager_name}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#9CA3AF] italic">Chưa bổ nhiệm</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${dep.is_active ? 'bg-[#E6F7ED] text-[#00b24e]' : 'bg-red-50 text-red-600'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dep.is_active ? 'bg-[#00b24e]' : 'bg-red-500'}`}></span>
                        <span>{dep.is_active ? 'Hoạt động' : 'Đã ngừng'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(dep)}
                          className="p-1.5 text-[#5A6E85] hover:text-[#00b24e] hover:bg-[#E6F7ED] rounded-[6px] transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeleteId(dep.id); setIsDeleteModalOpen(true); }}
                          className="p-1.5 text-[#5A6E85] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Setup */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-[13px]">
            <span className="text-[#5A6E85]">Hiển thị {(page - 1) * limit + 1} đến {Math.min(page * limit, total)} trong số {total} kết quả</span>
            <div className="flex space-x-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-[#1E2A3A] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
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
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200">

            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F9FBFD]">
              <h3 className="text-[16px] font-bold text-[#1E2A3A]">
                {modalMode === "create" ? "Thêm Phòng Ban Mới" : "Cập nhật Phòng Ban"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#9CA3AF] hover:text-[#1E2A3A] transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Tên phòng ban <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  autoFocus
                  placeholder="Nhập tên phòng ban (VD: Marketing, IT...)"
                  className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* TYPE AHEAD SELECT MANAGER */}
              <div className="space-y-1.5 relative">
                <label className="text-[13px] font-medium text-[#1E2A3A] flex items-center justify-between">
                  <span>Trưởng phòng / Quản lý</span>
                  {selectedUser && (
                    <button type="button" onClick={() => { setSelectedUser(null); setFormManagerId(null); }} className="text-[11px] text-red-500 hover:text-red-700">Gỡ bỏ</button>
                  )}
                </label>

                {selectedUser ? (
                  <div className="flex items-center space-x-3 w-full border border-[#00b24e] bg-[#E6F7ED]/50 px-3 py-2 rounded-[8px] cursor-default">
                    <div className="w-7 h-7 bg-[#00b24e] rounded-full flex justify-center items-center text-white font-bold text-[12px]">{selectedUser.name.charAt(0)}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[13px] font-semibold text-[#1E2A3A] truncate">{selectedUser.name}</p>
                      {selectedUser.email && <p className="text-[11px] text-[#5A6E85] truncate">{selectedUser.email}</p>}
                    </div>
                    <Check className="w-4 h-4 text-[#00b24e]" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-[10px] w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên, Email, SĐT nhân sự..."
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        onFocus={() => setUserDropdownOpen(true)}
                        className="w-full border border-[#E2E8F0] pl-9 pr-3 py-2.5 rounded-[8px] text-[13px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    {userDropdownOpen && (
                      <div className="absolute top-16 left-0 right-0 z-10 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-48 overflow-y-auto w-full">
                        {userOptions.length === 0 ? (
                          <div className="p-3 text-center text-[12px] text-[#9CA3AF]">Không tìm thấy nhân sự phù hợp</div>
                        ) : (
                          userOptions.map(u => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedUser(u);
                                setFormManagerId(u.id);
                                setUserDropdownOpen(false);
                                setUserSearchQuery("");
                              }}
                              className="px-4 py-2.5 hover:bg-[#F9FBFD] cursor-pointer flex items-center space-x-3 border-b border-[#E2E8F0] last:border-0 transition-colors"
                            >
                              <div className="w-6 h-6 bg-[#E2E8F0] rounded-full flex justify-center items-center text-[#5A6E85] font-bold text-[10px]">{u.name.charAt(0).toUpperCase()}</div>
                              <div className="overflow-hidden flex-1">
                                <p className="text-[13px] font-medium text-[#1E2A3A] truncate">{u.name}</p>
                                <p className="text-[11px] text-[#5A6E85] truncate">{u.email}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-[8px] bg-[#F9FBFD]">
                <div>
                  <p className="text-[13px] font-medium text-[#1E2A3A]">Trạng thái kích hoạt</p>
                  <p className="text-[11px] text-[#5A6E85]">Phòng ban bị vô hiệu hóa sẽ ẩn khỏi list lọc</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-[#E2E8F0] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b24e]"></div>
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium text-[#5A6E85] hover:bg-[#F5F7FA] transition-colors">Hủy thao tác</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#00b24e] text-white rounded-[8px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm">Xác nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-xl zoom-in-95 animate-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-2">Cảnh báo Xóa</h3>
            <p className="text-[13px] text-[#5A6E85] mb-6">
              Bạn có chắc chắn muốn xóa phòng ban này? Tất cả nhân sự bên trong sẽ bị gỡ liên kết phòng ban, nhưng dữ liệu người dùng không bị mất. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 bg-[#F5F7FA] text-[#5A6E85] font-medium text-[14px] rounded-[8px] hover:bg-[#E2E8F0]">Hủy</button>
              <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white font-medium text-[14px] rounded-[8px] hover:bg-red-700 shadow-sm">Xóa Vĩnh Viễn</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
