"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Search, LayoutList, Columns3 } from "lucide-react";
import { TaskItem, StaffOption, ObjOption } from "./types";
import { TaskFormModal } from "./TaskFormModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { TableView } from "./TableView";
import { KanbanView } from "./KanbanView";

export default function TasksPage() {
  const params = useParams();
  const slug = params?.companySlug as string;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [objectives, setObjectives] = useState<ObjOption[]>([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `/workspaces/${slug}/tasks?limit=200`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      const res = await api.get(url);
      setTasks(res.data || []);
    } catch { toast.error("Lỗi tải tasks"); }
    finally { setLoading(false); }
  };

  const fetchDropdowns = async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        api.get(`/workspaces/${slug}/staff?limit=200`),
        api.get(`/workspaces/${slug}/okrs?limit=200`)
      ]);
      setStaff((sRes.data || []).map((s: any) => ({ user_id: s.user_id, name: s.name })));
      setObjectives((oRes.data || []).map((o: any) => ({ id: o.id, name: o.name, key_results: o.key_results || [] })));
    } catch { }
  };

  useEffect(() => { fetchTasks(); }, [slug, statusFilter]);
  useEffect(() => { fetchDropdowns(); }, [slug]);

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa task này?")) return;
    try { await api.delete(`/workspaces/${slug}/tasks/${id}`); toast.success("Đã xóa"); fetchTasks(); }
    catch { toast.error("Lỗi xóa"); }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await api.put(`/workspaces/${slug}/tasks/${id}/status`, { status: newStatus });
      fetchTasks();
    } catch { toast.error("Lỗi cập nhật"); }
  };

  const handleProgressUpdate = async (id: number, progress: number) => {
    try {
      const status = progress >= 100 ? 'done' : progress > 0 ? 'in_progress' : 'todo';
      await api.put(`/workspaces/${slug}/tasks/${id}/status`, { status, progress });
      fetchTasks();
    } catch { toast.error("Lỗi cập nhật tiến độ"); }
  };

  const handleSave = async (data: any) => {
    try {
      if (editTask) {
        await api.put(`/workspaces/${slug}/tasks/${editTask.id}`, data);
        toast.success("Đã cập nhật");
      } else {
        await api.post(`/workspaces/${slug}/tasks`, data);
        toast.success("Đã tạo task");
      }
      setShowForm(false); setEditTask(null); fetchTasks();
    } catch { toast.error("Lỗi lưu task"); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchTasks(); };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Công việc</h1>
          <p className="text-[#5A6E85] mt-1 text-[15px]">Quản lý task, gán nhân sự, liên kết OKR</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-[#F1F5F9] rounded-[8px] p-0.5">
            <button onClick={() => setView("table")} className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-all ${view === "table" ? "bg-white shadow-sm text-[#1E2A3A]" : "text-[#5A6E85]"}`}>
              <LayoutList className="w-4 h-4 inline mr-1" />Bảng
            </button>
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-all ${view === "kanban" ? "bg-white shadow-sm text-[#1E2A3A]" : "text-[#5A6E85]"}`}>
              <Columns3 className="w-4 h-4 inline mr-1" />Kanban
            </button>
          </div>
          <button onClick={() => { setEditTask(null); setShowForm(true); }} className="bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-[#009b43] transition-colors flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Tạo task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm task..." className="w-full pl-10 pr-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" />
        </form>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="todo">Cần làm</option>
          <option value="in_progress">Đang làm</option>
          <option value="done">Hoàn thành</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Đang tải...</div> : (
        view === "table" ? (
          <TableView tasks={tasks} onEdit={(t: TaskItem) => { setEditTask(t); setShowForm(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onProgressUpdate={handleProgressUpdate} onDetail={setDetailTask} />
        ) : (
          <KanbanView tasks={tasks} onEdit={(t: TaskItem) => { setEditTask(t); setShowForm(true); }} onDelete={handleDelete} onStatusChange={handleStatusChange} onProgressUpdate={handleProgressUpdate} onDetail={setDetailTask} />
        )
      )}

      {showForm && <TaskFormModal task={editTask} staff={staff} objectives={objectives} onSave={handleSave} onClose={() => { setShowForm(false); setEditTask(null); }} />}
      {detailTask && <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} onEdit={(t: TaskItem) => { setDetailTask(null); setEditTask(t); setShowForm(true); }} onProgressUpdate={handleProgressUpdate} />}
    </div>
  );
}
