import { Clock, Pencil, Trash2, User } from "lucide-react";
import { TaskItem, priorityMap, formatDate } from "./types";
import { ProgressCell } from "./ProgressCell";

export function KanbanView({ tasks, onEdit, onDelete, onStatusChange, onProgressUpdate, onDetail }: {
  tasks: TaskItem[];
  onEdit: (t: TaskItem) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onProgressUpdate: (id: number, p: number) => void;
  onDetail: (t: TaskItem) => void;
}) {
  const columns = [
    { key: "todo", label: "Cần làm", color: "#6B7280" },
    { key: "in_progress", label: "Đang làm", color: "#3B82F6" },
    { key: "done", label: "Hoàn thành", color: "#00b24e" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map(col => {
        const colTasks = tasks.filter((t: TaskItem) => t.status === col.key);
        return (
          <div key={col.key} className="bg-[#F8FAFC] rounded-[12px] p-4 min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-[14px] font-bold text-[#1E2A3A]">{col.label}</h3>
              <span className="text-[12px] text-[#9CA3AF] bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            <div className="space-y-3">
              {colTasks.map((t: TaskItem) => {
                const p = priorityMap[t.priority] || priorityMap.not_urgent_important;
                const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "done";
                return (
                  <div key={t.id} className={`bg-white border rounded-[10px] p-3.5 hover:shadow-sm transition-all cursor-pointer ${isOverdue ? 'border-[#FEE2E2]' : 'border-[#E2E8F0]'}`} onClick={() => onDetail(t)}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-[14px] font-medium text-[#1E2A3A] leading-snug flex-1">{t.title}</h4>
                      <div className="flex gap-0.5 ml-2 flex-shrink-0">
                        <button onClick={e => { e.stopPropagation(); onEdit(t); }} className="p-1 rounded hover:bg-[#F1F5F9]"><Pencil className="w-3 h-3 text-[#9CA3AF]" /></button>
                        <button onClick={e => { e.stopPropagation(); onDelete(t.id); }} className="p-1 rounded hover:bg-[#FEF2F2]"><Trash2 className="w-3 h-3 text-[#DC2626]" /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: p.color, backgroundColor: p.bg }}>{p.label}</span>
                      {t.assignee_name && <span className="text-[11px] text-[#5A6E85] flex items-center"><User className="w-3 h-3 mr-0.5" />{t.assignee_name}</span>}
                      {t.deadline && <span className={`text-[11px] flex items-center ${isOverdue ? 'text-[#DC2626]' : 'text-[#5A6E85]'}`}><Clock className="w-3 h-3 mr-0.5" />{formatDate(t.deadline)}</span>}
                    </div>
                    {/* Progress bar - clickable */}
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      <ProgressCell taskId={t.id} progress={t.progress} onUpdate={onProgressUpdate} />
                    </div>
                    {/* Status buttons */}
                    <div className="mt-2.5 flex gap-1.5">
                      {columns.filter(c => c.key !== t.status).map(c => (
                        <button key={c.key} onClick={e => { e.stopPropagation(); onStatusChange(t.id, c.key); }} className="text-[10px] font-medium px-2 py-1 rounded-md border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors" style={{ color: c.color }}>
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && <div className="text-[13px] text-[#9CA3AF] italic text-center py-8">Trống</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
