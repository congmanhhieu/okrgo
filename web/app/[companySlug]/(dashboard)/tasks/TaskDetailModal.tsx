import { useState } from "react";
import { Target, X } from "lucide-react";
import { TaskItem, priorityMap, statusMap, formatDate } from "./types";

export function TaskDetailModal({ task, onClose, onEdit, onProgressUpdate }: { task: TaskItem; onClose: () => void; onEdit: (t: TaskItem) => void; onProgressUpdate: (id: number, p: number) => void }) {
  const p = priorityMap[task.priority] || priorityMap.not_urgent_important;
  const s = statusMap[task.status] || statusMap.todo;
  const [editingProgress, setEditingProgress] = useState(false);
  const [progressVal, setProgressVal] = useState(task.progress);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[560px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">Chi tiết Task</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(task)} className="text-[13px] text-[#3B82F6] font-medium hover:underline">Sửa</button>
            <button onClick={onClose} className="p-1 hover:bg-[#F1F5F9] rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <h3 className="text-[20px] font-bold text-[#1E2A3A]">{task.title}</h3>
          {task.description && <p className="text-[14px] text-[#5A6E85] leading-relaxed">{task.description}</p>}
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div><span className="text-[#9CA3AF]">Trạng thái:</span> <span className="font-semibold ml-1 px-2 py-0.5 rounded-full text-[12px]" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span></div>
            <div><span className="text-[#9CA3AF]">Ưu tiên:</span> <span className="font-semibold ml-1 px-2 py-0.5 rounded-full text-[11px]" style={{ color: p.color, backgroundColor: p.bg }}>{p.label}</span></div>
            <div className="col-span-2">
              <span className="text-[#9CA3AF]">Tiến độ:</span>
              {editingProgress ? (
                <span className="inline-flex items-center gap-2 ml-2">
                  <input type="range" min={0} max={100} step={5} value={progressVal} onChange={e => setProgressVal(Number(e.target.value))} className="w-32 h-1.5 accent-[#00b24e]" />
                  <input type="number" min={0} max={100} value={progressVal} onChange={e => setProgressVal(Number(e.target.value))} className="w-12 text-[12px] text-center border border-[#E2E8F0] rounded px-1 py-0.5" />
                  <span className="text-[11px]">%</span>
                  <button onClick={() => { onProgressUpdate(task.id, Math.max(0, Math.min(100, progressVal))); setEditingProgress(false); }} className="text-[11px] text-[#00b24e] font-semibold hover:underline">Lưu</button>
                  <button onClick={() => { setProgressVal(task.progress); setEditingProgress(false); }} className="text-[11px] text-[#9CA3AF] hover:underline">Hủy</button>
                </span>
              ) : (
                <span className="font-semibold text-[#1E2A3A] ml-1 cursor-pointer hover:text-[#00b24e]" onClick={() => setEditingProgress(true)} title="Click để cập nhật">
                  {task.progress}% ✏️
                </span>
              )}
            </div>
            <div><span className="text-[#9CA3AF]">Deadline:</span> <span className="font-semibold text-[#1E2A3A] ml-1">{formatDate(task.deadline)}</span></div>
            <div><span className="text-[#9CA3AF]">Thực hiện:</span> <span className="font-medium text-[#1E2A3A] ml-1">{task.assignee_name || "—"}</span></div>
            <div><span className="text-[#9CA3AF]">Tạo bởi:</span> <span className="font-medium text-[#1E2A3A] ml-1">{task.creator_name}</span></div>
          </div>
          {(task.objective_name || task.kr_name) && (
            <div className="bg-[#EFF6FF] border border-[#DBEAFE] p-3 rounded-[8px] flex items-center gap-2 text-[13px]">
               <Target className="w-4 h-4 text-[#3B82F6]" />
              <span className="text-[#3B82F6] font-medium">{task.objective_name}{task.kr_name ? ` → ${task.kr_name}` : ""}</span>
            </div>
          )}
          {task.watchers && task.watchers.length > 0 && (
            <div>
              <span className="text-[12px] text-[#9CA3AF] font-semibold">Người theo dõi:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {task.watchers.map(w => (
                  <span key={w.user_id} className="text-[12px] bg-[#F1F5F9] text-[#5A6E85] px-2 py-0.5 rounded-full">{w.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
