import { Eye, Pencil, Trash2 } from "lucide-react";
import { TaskItem, priorityMap, statusMap, formatDate } from "./types";
import { EmptyState } from "./EmptyState";
import { ProgressCell } from "./ProgressCell";

export function TableView({ tasks, onEdit, onDelete, onStatusChange, onProgressUpdate, onDetail }: {
  tasks: TaskItem[];
  onEdit: (t: TaskItem) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onProgressUpdate: (id: number, p: number) => void;
  onDetail: (t: TaskItem) => void;
}) {
  if (tasks.length === 0) return <EmptyState />;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Thực hiện</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Ưu tiên</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Tiến độ</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">Deadline</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider">OKR</th>
              <th className="px-4 py-3 text-[12px] font-semibold text-[#5A6E85] uppercase tracking-wider w-[100px]"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t: TaskItem) => {
              const p = priorityMap[t.priority] || priorityMap.not_urgent_important;
              const s = statusMap[t.status] || statusMap.todo;
              const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "done";
              return (
                <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-[14px] font-medium text-[#1E2A3A]">{t.title}</div>
                    <div className="text-[12px] text-[#9CA3AF]">Tạo bởi: {t.creator_name}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#5A6E85]">{t.assignee_name || "—"}</td>
                  <td className="px-4 py-3">
                    <select value={t.status} onChange={e => onStatusChange(t.id, e.target.value)} className="text-[12px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer" style={{ color: s.color, backgroundColor: s.bg }}>
                      <option value="todo">Cần làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="done">Hoàn thành</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: p.color, backgroundColor: p.bg }}>{p.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ProgressCell taskId={t.id} progress={t.progress} onUpdate={onProgressUpdate} />
                  </td>
                  <td className={`px-4 py-3 text-[13px] ${isOverdue ? 'text-[#DC2626] font-semibold' : 'text-[#5A6E85]'}`}>{formatDate(t.deadline)}</td>
                  <td className="px-4 py-3 text-[12px] text-[#3B82F6]">{t.objective_name || "—"}{t.kr_name ? ` → ${t.kr_name}` : ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onDetail(t)} className="p-1 rounded hover:bg-[#F1F5F9]"><Eye className="w-3.5 h-3.5 text-[#5A6E85]" /></button>
                      <button onClick={() => onEdit(t)} className="p-1 rounded hover:bg-[#F1F5F9]"><Pencil className="w-3.5 h-3.5 text-[#5A6E85]" /></button>
                      <button onClick={() => onDelete(t.id)} className="p-1 rounded hover:bg-[#FEF2F2]"><Trash2 className="w-3.5 h-3.5 text-[#DC2626]" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
