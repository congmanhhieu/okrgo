"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Star, Pencil, Trash2, X, ShieldAlert,
  Heart, Target, FolderKanban, ClipboardList
} from "lucide-react";

type Criteria = {
  id: number;
  name: string;
  category: string;
  stars: number;
  created_at: string;
};

const CATEGORY_OPTIONS = [
  { value: "culture", label: "Văn hóa", icon: Heart, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "objective", label: "Mục tiêu", icon: Target, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "project", label: "Dự án", icon: FolderKanban, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "task", label: "Công việc", icon: ClipboardList, color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c]));
const CATEGORY_ORDER: Record<string, number> = { culture: 0, objective: 1, project: 2, task: 3 };

export default function StarCriteriaPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>(["culture"]);
  const [formStars, setFormStars] = useState(1);

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Criteria | null>(null);

  const fetchCriteria = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/star-criteria`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setCriteria(data.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormName("");
    setFormCategories(["culture"]);
    setFormStars(1);
    setCurrentEditId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Criteria) => {
    setModalMode("edit");
    setCurrentEditId(item.id);
    setFormName(item.name);
    setFormCategories(item.category ? item.category.split(",") : []);
    setFormStars(item.stars);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Tên tiêu chí không được để trống");
      return;
    }
    if (formCategories.length === 0) {
      toast.error("Vui lòng chọn ít nhất một loại sử dụng");
      return;
    }

    try {
      const token = localStorage.getItem("okrgo_token");
      const url =
        modalMode === "create"
          ? `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/star-criteria`
          : `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/star-criteria/${currentEditId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          category: formCategories.sort((a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99)).join(","),
          stars: formStars,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thao tác thất bại");

      toast.success(modalMode === "create" ? "Tạo tiêu chí thành công" : "Cập nhật thành công");
      setIsModalOpen(false);
      fetchCriteria();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/star-criteria/${deleteItem.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Đã xóa tiêu chí!");
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
      fetchCriteria();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-[14px] font-semibold text-amber-600">{count}</span>
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
      </div>
    );
  };

  return (
    <div className="p-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Quản lý Sao</h1>
          <p className="text-[14px] text-[#5A6E85] mt-1">
            Danh sách tiêu chí ghi nhận sử dụng trong Kudo Box
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm tiêu chí</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F9FBFD]">
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider w-16">STT</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Tiêu chí</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Sử dụng cho</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Số sao</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#5A6E85]">
                    <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e] mx-auto"></div>
                  </td>
                </tr>
              ) : criteria.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="w-8 h-8 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[#1E2A3A] font-medium">Chưa có tiêu chí nào</p>
                    <p className="text-[#5A6E85] text-[13px] mt-1">
                      Hãy thêm tiêu chí ghi nhận để sử dụng trong Kudo Box.
                    </p>
                  </td>
                </tr>
              ) : (
                criteria.map((item, index) => {
                  const cats = (item.category ? item.category.split(",") : [])
                    .sort((a, b) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99));
                  return (
                    <tr key={item.id} className="hover:bg-[#F9FBFD] transition-colors group">
                      {/* STT */}
                      <td className="px-6 py-4">
                        <span className="text-[13px] text-[#9CA3AF] font-medium">{index + 1}</span>
                      </td>

                      {/* Tiêu chí */}
                      <td className="px-6 py-4">
                        <span className="text-[14px] font-medium text-[#1E2A3A]">{item.name}</span>
                      </td>

                      {/* Sử dụng cho */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {cats.map((catKey) => {
                            const cat = CATEGORY_MAP[catKey];
                            const CatIcon = cat?.icon || Heart;
                            return (
                              <span
                                key={catKey}
                                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] border text-[12px] font-medium ${cat?.color || "bg-gray-50 text-gray-600 border-gray-200"}`}
                              >
                                <CatIcon className="w-3.5 h-3.5" />
                                <span>{cat?.label || catKey}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Số sao */}
                      <td className="px-6 py-4">{renderStars(item.stars)}</td>

                      {/* Hành động */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-[#5A6E85] hover:text-[#00b24e] hover:bg-[#E6F7ED] rounded-[6px] transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteItem(item);
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
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F9FBFD]">
              <h3 className="text-[16px] font-bold text-[#1E2A3A]">
                {modalMode === "create" ? "Thêm Tiêu chí Mới" : "Cập nhật Tiêu chí"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9CA3AF] hover:text-[#1E2A3A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">
                  Tên tiêu chí <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  placeholder="VD: Hoàn thành OKR trước hạn, Sáng tạo đổi mới..."
                  className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">
                  Sử dụng cho <span className="text-[11px] text-[#9CA3AF] font-normal">(chọn nhiều)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formCategories.includes(cat.value);
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          setFormCategories((prev) =>
                            isSelected
                              ? prev.filter((v) => v !== cat.value)
                              : [...prev, cat.value]
                          );
                        }}
                        className={`flex items-center space-x-2 py-2.5 px-3 rounded-[8px] border text-[13px] font-medium transition-all ${isSelected
                          ? "border-[#00b24e] bg-[#E6F7ED] text-[#00b24e]"
                          : "border-[#E2E8F0] bg-white text-[#5A6E85] hover:border-[#CBD5E1]"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">
                  Số sao <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-[#E2E8F0] rounded-[8px] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormStars(Math.max(1, formStars - 1))}
                      className="px-3 py-2.5 text-[#5A6E85] hover:bg-[#F5F7FA] transition-colors border-r border-[#E2E8F0]"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formStars}
                      onChange={(e) => setFormStars(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center py-2.5 text-[14px] font-semibold text-[#1E2A3A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormStars(Math.min(100, formStars + 1))}
                      className="px-3 py-2.5 text-[#5A6E85] hover:bg-[#F5F7FA] transition-colors border-l border-[#E2E8F0]"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[15px] font-semibold text-amber-600">{formStars}</span>
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  </div>
                </div>
              </div>



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
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-xl zoom-in-95 animate-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-2">Xóa tiêu chí</h3>
            <p className="text-[13px] text-[#5A6E85] mb-6">
              Bạn chắc chắn muốn xóa tiêu chí <strong className="text-[#1E2A3A]">{deleteItem.name}</strong>?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteItem(null);
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
