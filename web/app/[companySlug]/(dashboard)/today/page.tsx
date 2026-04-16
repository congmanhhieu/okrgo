"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  CheckSquare, Plus, Clock, AlertTriangle, Target, Trash2, Pencil, X, ChevronLeft, ChevronRight, User
} from "lucide-react";

function formatDateVN(dateStr: string) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getTodayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const priorityMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
  important: { label: "Quan trọng", color: "#DC2626", bg: "#FEF2F2", border: "#FEE2E2" },
  less_important: { label: "Ít quan trọng", color: "#F59E0B", bg: "#FFFBEB", border: "#FEF3C7" },
  not_important: { label: "Không quan trọng", color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB" },
};

type TodayItem = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  priority: string;
  is_completed: boolean;
  linked_objective_id: number | null;
  objective_name: string;
  related_user_id: number | null;
  related_user_name: string;
  task_date: string;
};

type ObjOption = { id: number; name: string };
type StaffOption = { user_id: number; name: string };

export default function TodaylistPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [items, setItems] = useState<TodayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOverdue, setShowOverdue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TodayItem | null>(null);

  const [objectives, setObjectives] = useState<ObjOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  const isToday = selectedDate === getTodayStr();

  const fetchItems = async () => {
    try {
      setLoading(true);
      let url = `/workspaces/${companySlug}/todaylist`;
      if (isToday && showOverdue) {
        url += `?overdue=true`;
      } else {
        url += `?date=${selectedDate}`;
      }
      const res = await api.get(url);
      setItems(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [objRes, staffRes] = await Promise.all([
        api.get(`/workspaces/${companySlug}/okrs?limit=100`),
        api.get(`/workspaces/${companySlug}/staff?limit=100`)
      ]);
      setObjectives((objRes.data || []).map((o: any) => ({ id: o.id, name: o.name })));
      setStaffList((staffRes.data || []).map((s: any) => ({ user_id: s.user_id, name: s.name })));
    } catch { }
  };

  useEffect(() => { fetchItems(); }, [companySlug, selectedDate, showOverdue]);
  useEffect(() => { fetchDropdowns(); }, [companySlug]);

  const handleToggle = async (id: number) => {
    try {
      await api.put(`/workspaces/${companySlug}/todaylist/${id}/toggle`);
      fetchItems();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xóa công việc này?")) return;
    try {
      await api.delete(`/workspaces/${companySlug}/todaylist/${id}`);
      toast.success("Đã xóa");
      fetchItems();
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  const handleSave = async (formData: any) => {
    try {
      if (editItem) {
        await api.put(`/workspaces/${companySlug}/todaylist/${editItem.id}`, formData);
        toast.success("Đã cập nhật");
      } else {
        await api.post(`/workspaces/${companySlug}/todaylist`, formData);
        toast.success("Đã thêm");
      }
      setShowForm(false);
      setEditItem(null);
      fetchItems();
    } catch {
      toast.error("Lỗi lưu công việc");
    }
  };

  const overdueItems = items.filter(i => !i.is_completed && new Date(i.task_date).toISOString().slice(0, 10) < getTodayStr());
  const todayItems = items.filter(i => !overdueItems.includes(i));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Todaylist</h1>
          <p className="text-[#5A6E85] mt-1 text-[15px]">Danh sách công việc hàng ngày</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-[#009b43] transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Thêm Todaylist
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] border border-[#E2E8F0]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-[#E2E8F0] rounded-[8px] text-[14px]"
          />
          {!isToday && (
            <button onClick={() => setSelectedDate(getTodayStr())} className="text-[13px] text-[#3B82F6] font-medium hover:underline">Hôm nay</button>
          )}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] border border-[#E2E8F0]">
          <ChevronRight className="w-4 h-4" />
        </button>

        {isToday && (
          <label className="flex items-center gap-2 ml-4 text-[13px] text-[#5A6E85] cursor-pointer select-none">
            <input type="checkbox" checked={showOverdue} onChange={(e) => setShowOverdue(e.target.checked)} className="rounded" />
            Hiện công việc quá hạn
          </label>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-12 text-center">
          <CheckSquare className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-[18px] font-medium text-[#1E2A3A]">Chưa có công việc nào</h3>
          <p className="text-[#5A6E85] mt-2 text-[14px]">Nhấn &quot;Thêm Todaylist&quot; để bắt đầu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Overdue section */}
          {overdueItems.length > 0 && isToday && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                <span className="text-[14px] font-semibold text-[#DC2626]">Quá hạn ({overdueItems.length})</span>
              </div>
              {overdueItems.map(item => (
                <TodoCard key={item.id} item={item} isOverdue onToggle={handleToggle} onDelete={handleDelete} onEdit={(i) => { setEditItem(i); setShowForm(true); }} />
              ))}
            </div>
          )}

          {/* Today / selected date items */}
          {todayItems.map(item => (
            <TodoCard key={item.id} item={item} isOverdue={false} onToggle={handleToggle} onDelete={handleDelete} onEdit={(i) => { setEditItem(i); setShowForm(true); }} />
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <TodoFormModal
          item={editItem}
          objectives={objectives}
          staffList={staffList}
          selectedDate={selectedDate}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}
    </div>
  );
}

// ===================== Card Component =====================
function TodoCard({ item, isOverdue, onToggle, onDelete, onEdit }: {
  item: TodayItem; isOverdue: boolean;
  onToggle: (id: number) => void; onDelete: (id: number) => void; onEdit: (item: TodayItem) => void;
}) {
  const p = priorityMap[item.priority] || priorityMap.less_important;

  return (
    <div className={`bg-white border rounded-[12px] p-4 flex items-start gap-4 transition-all group
      ${isOverdue ? 'border-[#FEE2E2] bg-[#FFFBFB]' : 'border-[#E2E8F0]'}
      ${item.is_completed ? 'opacity-60' : 'hover:shadow-sm'}
    `}>
      {/* Checkbox */}
      <button onClick={() => onToggle(item.id)} className="mt-0.5 flex-shrink-0">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
          ${item.is_completed ? 'bg-[#00b24e] border-[#00b24e]' : 'border-[#CBD5E1] hover:border-[#00b24e]'}
        `}>
          {item.is_completed && <CheckSquare className="w-3 h-3 text-white" />}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className={`text-[15px] font-medium ${item.is_completed ? 'line-through text-[#9CA3AF]' : 'text-[#1E2A3A]'}`}>
            {item.title}
          </h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onEdit(item)} className="p-1 rounded hover:bg-[#F1F5F9]">
              <Pencil className="w-3.5 h-3.5 text-[#5A6E85]" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 rounded hover:bg-[#FEF2F2]">
              <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
            </button>
          </div>
        </div>

        {item.description && (
          <p className="text-[13px] text-[#5A6E85] mt-1 leading-relaxed">{item.description}</p>
        )}

        <div className="flex items-center flex-wrap gap-2 mt-2">
          {/* Priority badge */}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: p.color, backgroundColor: p.bg, border: `1px solid ${p.border}` }}>
            {p.label}
          </span>

          {/* Time */}
          {(item.start_time || item.end_time) && (
            <span className="flex items-center text-[12px] text-[#5A6E85]">
              <Clock className="w-3 h-3 mr-1" />
              {item.start_time || '—'} → {item.end_time || '—'}
            </span>
          )}

          {/* Linked OKR */}
          {item.objective_name && (
            <span className="flex items-center text-[12px] text-[#3B82F6]">
              <Target className="w-3 h-3 mr-1" />
              {item.objective_name}
            </span>
          )}

          {/* Related user */}
          {item.related_user_name && (
            <span className="flex items-center text-[12px] text-[#5A6E85]">
              <User className="w-3 h-3 mr-1" />
              {item.related_user_name}
            </span>
          )}

          {/* Overdue date */}
          {isOverdue && (
            <span className="text-[11px] text-[#DC2626] font-medium">
              (Ngày {formatDateVN(item.task_date)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== Form Modal =====================
function TodoFormModal({ item, objectives, staffList, selectedDate, onSave, onClose }: {
  item: TodayItem | null; objectives: ObjOption[]; staffList: StaffOption[];
  selectedDate: string; onSave: (data: any) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [startTime, setStartTime] = useState(item?.start_time || "");
  const [endTime, setEndTime] = useState(item?.end_time || "");
  const [priority, setPriority] = useState(item?.priority || "less_important");
  const [linkedObj, setLinkedObj] = useState<number | string>(item?.linked_objective_id || "");
  const [relatedUser, setRelatedUser] = useState<number | string>(item?.related_user_id || "");
  const [taskDate, setTaskDate] = useState(item ? item.task_date.slice(0, 10) : selectedDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    onSave({
      title: title.trim(),
      description,
      start_time: startTime,
      end_time: endTime,
      priority,
      linked_objective_id: linkedObj ? Number(linkedObj) : null,
      related_user_id: relatedUser ? Number(relatedUser) : null,
      task_date: taskDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[540px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">{item ? "Chỉnh sửa" : "Thêm công việc"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F1F5F9] rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Tiêu đề *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề công việc" className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" autoFocus />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Mô tả chi tiết (tuỳ chọn)" className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Bắt đầu</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Kết thúc</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Mức độ quan trọng</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="important">Quan trọng</option>
                <option value="less_important">Ít quan trọng</option>
                <option value="not_important">Không quan trọng</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Ngày</label>
              <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Liên kết OKR</label>
              <select value={linkedObj} onChange={e => setLinkedObj(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="">Không liên kết</option>
                {objectives.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Người liên quan</label>
              <select value={relatedUser} onChange={e => setRelatedUser(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="">Không có</option>
                {staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5A6E85] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F8FAFC]">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-[#00b24e] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#009b43] transition-colors">{item ? "Lưu" : "Thêm"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
