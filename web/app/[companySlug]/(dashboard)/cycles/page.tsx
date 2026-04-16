"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, CalendarRange, Pencil, Trash2, X, ShieldAlert, Calendar, ArrowRight
} from "lucide-react";

type Cycle = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toInputDate(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

function getCycleStatus(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

const STATUS_CONFIG = {
  active: { label: "Đang diễn ra", dotColor: "bg-[#00b24e]", bgColor: "bg-[#E6F7ED]", textColor: "text-[#00b24e]" },
  upcoming: { label: "Sắp tới", dotColor: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" },
  ended: { label: "Đã kết thúc", dotColor: "bg-gray-400", bgColor: "bg-gray-100", textColor: "text-gray-500" },
};

function getDaysInfo(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  return { totalDays, elapsed, remaining: Math.max(0, remaining), progress };
}

export default function CyclesPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentEditId, setCurrentEditId] = useState<number | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCycle, setDeleteCycle] = useState<Cycle | null>(null);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/cycles`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setCycles(data.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setFormName("");
    setFormStartDate("");
    setFormEndDate("");
    setCurrentEditId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cycle: Cycle) => {
    setModalMode("edit");
    setCurrentEditId(cycle.id);
    setFormName(cycle.name);
    setFormStartDate(toInputDate(cycle.start_date));
    setFormEndDate(toInputDate(cycle.end_date));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Tên chu kỳ không được để trống");
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc");
      return;
    }

    try {
      const token = localStorage.getItem("okrgo_token");
      const url =
        modalMode === "create"
          ? `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/cycles`
          : `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/cycles/${currentEditId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formName,
          start_date: formStartDate,
          end_date: formEndDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thao tác thất bại");

      toast.success(modalMode === "create" ? "Tạo chu kỳ thành công" : "Cập nhật thành công");
      setIsModalOpen(false);
      fetchCycles();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCycle) return;
    try {
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${companySlug}/cycles/${deleteCycle.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Đã xóa chu kỳ!");
      setIsDeleteModalOpen(false);
      setDeleteCycle(null);
      fetchCycles();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Quản lý Chu kỳ OKR</h1>
          <p className="text-[14px] text-[#5A6E85] mt-1">
            Tạo và quản lý các chu kỳ mục tiêu theo quý, tháng hoặc năm
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo chu kỳ mới</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e]"></div>
        </div>
      ) : cycles.length === 0 ? (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-12 text-center">
          <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarRange className="w-8 h-8 text-[#9CA3AF]" />
          </div>
          <p className="text-[#1E2A3A] font-medium text-[16px]">Chưa có chu kỳ nào</p>
          <p className="text-[#5A6E85] text-[13px] mt-1 mb-4">
            Hãy tạo chu kỳ đầu tiên để bắt đầu thiết lập mục tiêu OKR.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo chu kỳ đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cycles.map((cycle) => {
            const status = getCycleStatus(cycle.start_date, cycle.end_date);
            const config = STATUS_CONFIG[status];
            const info = getDaysInfo(cycle.start_date, cycle.end_date);

            return (
              <div
                key={cycle.id}
                className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Card Header */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-bold text-[#1E2A3A] truncate">{cycle.name}</h3>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ml-3 flex-shrink-0 ${config.bgColor} ${config.textColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
                      <span>{config.label}</span>
                    </span>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center text-[13px] text-[#5A6E85] mb-4">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#9CA3AF]" />
                    <span>{formatDate(cycle.start_date)}</span>
                    <ArrowRight className="w-3.5 h-3.5 mx-2 text-[#CBD5E1]" />
                    <span>{formatDate(cycle.end_date)}</span>
                  </div>

                  {/* Progress bar (only for active/ended) */}
                  {status !== "upcoming" && (
                    <div className="mb-1">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-[#5A6E85]">
                          {status === "active"
                            ? `Còn ${info.remaining} ngày`
                            : "Đã kết thúc"}
                        </span>
                        <span className="text-[#9CA3AF]">{info.totalDays} ngày</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${status === "active" ? "bg-[#00b24e]" : "bg-gray-400"
                            }`}
                          style={{ width: `${info.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {status === "upcoming" && (
                    <div className="text-[11px] text-[#5A6E85] mb-1">
                      Bắt đầu sau {Math.ceil((new Date(cycle.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ngày • Thời hạn {info.totalDays} ngày
                    </div>
                  )}
                </div>

                {/* Card Footer / Actions */}
                <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F9FBFD] flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEdit(cycle)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12px] font-medium text-[#5A6E85] hover:text-[#00b24e] hover:bg-[#E6F7ED] rounded-[6px] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => {
                      setDeleteCycle(cycle);
                      setIsDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[12px] font-medium text-[#5A6E85] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F9FBFD]">
              <h3 className="text-[16px] font-bold text-[#1E2A3A]">
                {modalMode === "create" ? "Tạo Chu kỳ Mới" : "Cập nhật Chu kỳ"}
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
                  Tên chu kỳ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                  placeholder="VD: Q2-2025, Năm 2025, Sprint 1..."
                  className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    min={formStartDate || undefined}
                    className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
                  />
                </div>
              </div>

              {/* Preview */}
              {formStartDate && formEndDate && new Date(formEndDate) > new Date(formStartDate) && (
                <div className="p-3 bg-[#F9FBFD] border border-[#E2E8F0] rounded-[8px]">
                  <div className="flex items-center space-x-2 text-[12px] text-[#5A6E85]">
                    <CalendarRange className="w-4 h-4 text-[#9CA3AF]" />
                    <span>
                      Thời lượng:{" "}
                      <strong className="text-[#1E2A3A]">
                        {Math.ceil(
                          (new Date(formEndDate).getTime() - new Date(formStartDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                        )}{" "}
                        ngày
                      </strong>
                    </span>
                  </div>
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
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteModalOpen && deleteCycle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-xl zoom-in-95 animate-in">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-2">Xóa chu kỳ</h3>
            <p className="text-[13px] text-[#5A6E85] mb-1">
              Bạn chắc chắn muốn xóa chu kỳ <strong className="text-[#1E2A3A]">{deleteCycle.name}</strong>?
            </p>
            <p className="text-[12px] text-[#9CA3AF] mb-6">
              Tất cả OKR liên kết với chu kỳ này cũng sẽ bị xóa. Hành động không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteCycle(null);
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
