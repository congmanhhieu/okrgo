import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search, User, X } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TaskItem, StaffOption, ObjOption } from "./types";

export function TaskFormModal({ task, staff, objectives, onSave, onClose }: {
  task: TaskItem | null; staff: StaffOption[]; objectives: ObjOption[];
  onSave: (d: any) => void; onClose: () => void;
}) {
  const params = useParams();
  const slug = params?.companySlug as string;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assigneeId, setAssigneeId] = useState<string>(task?.assignee_id?.toString() || "");
  const [priority, setPriority] = useState(task?.priority || "not_urgent_important");
  const [linkedObj, setLinkedObj] = useState<string>(task?.linked_objective_id?.toString() || "");
  const [linkedKR, setLinkedKR] = useState<string>(task?.linked_kr_id?.toString() || "");
  const [deadline, setDeadline] = useState(task?.deadline ? task.deadline.slice(0, 10) : "");
  const [watcherIds, setWatcherIds] = useState<number[]>(task?.watchers?.map(w => w.user_id) || []);
  const [currentUserName, setCurrentUserName] = useState("");

  // Watcher search
  const [watcherSearch, setWatcherSearch] = useState("");
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);

  // Assignee search
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const selectedObj = objectives.find(o => o.id === Number(linkedObj));
  const krs = selectedObj?.key_results || [];

  // Fetch current user profile to set default assignee
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/workspaces/${slug}/profile`);
        if (res?.user?.id && !task) {
          setAssigneeId(res.user.id.toString());
        }
        if (res?.user?.name) {
          setCurrentUserName(res.user.name);
        }
      } catch { }
    };
    fetchProfile();
  }, [slug, task]);

  const addWatcher = (id: number) => {
    if (!watcherIds.includes(id)) {
      setWatcherIds(prev => [...prev, id]);
    }
    setWatcherSearch("");
    setShowWatcherDropdown(false);
  };

  const removeWatcher = (id: number) => {
    setWatcherIds(prev => prev.filter(x => x !== id));
  };

  const filteredStaffForWatcher = staff.filter(s =>
    !watcherIds.includes(s.user_id) &&
    s.name.toLowerCase().includes(watcherSearch.toLowerCase())
  );

  const filteredStaffForAssignee = staff.filter(s =>
    s.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const selectedAssignee = staff.find(s => s.user_id === Number(assigneeId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Vui lòng nhập tên task"); return; }
    if (!assigneeId) { toast.error("Vui lòng chọn người thực hiện"); return; }
    onSave({
      title: title.trim(), description,
      assignee_id: Number(assigneeId),
      priority,
      linked_objective_id: linkedObj ? Number(linkedObj) : null,
      linked_kr_id: linkedKR ? Number(linkedKR) : null,
      deadline: deadline || "",
      watcher_ids: watcherIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">{task ? "Chỉnh sửa Task" : "Tạo Task mới"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F1F5F9] rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Creator info */}
          {!task && currentUserName && (
            <div className="text-[12px] text-[#9CA3AF] flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Người tạo: <span className="font-semibold text-[#1E2A3A]">{currentUserName}</span>
            </div>
          )}
          {task && (
            <div className="text-[12px] text-[#9CA3AF] flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Người tạo: <span className="font-semibold text-[#1E2A3A]">{task.creator_name}</span>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Tên công việc *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" autoFocus />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Người thực hiện *</label>
              {selectedAssignee ? (
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-1 text-[13px] bg-[#DCFCE7] text-[#15803D] px-3 py-1.5 rounded-full border border-[#BBF7D0] font-medium">
                    <User className="w-3.5 h-3.5" />{selectedAssignee.name}
                    <button type="button" onClick={() => { setAssigneeId(""); setAssigneeSearch(""); }} className="hover:text-[#DC2626] transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={assigneeSearch}
                    onChange={e => { setAssigneeSearch(e.target.value); setShowAssigneeDropdown(true); }}
                    onFocus={() => setShowAssigneeDropdown(true)}
                    placeholder="Tìm người thực hiện..."
                    className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none"
                  />
                  {showAssigneeDropdown && filteredStaffForAssignee.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-[160px] overflow-y-auto">
                      {filteredStaffForAssignee.slice(0, 8).map(s => (
                        <button key={s.user_id} type="button" onClick={() => { setAssigneeId(s.user_id.toString()); setAssigneeSearch(""); setShowAssigneeDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#1E2A3A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#9CA3AF]" /> {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Thời hạn</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Độ ưu tiên</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
              <option value="urgent_important">Gấp & Quan trọng</option>
              <option value="urgent_not_important">Gấp & Không quan trọng</option>
              <option value="not_urgent_important">Không gấp & Quan trọng</option>
              <option value="not_urgent_not_important">Không gấp & Không quan trọng</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Liên kết Objective</label>
              <select value={linkedObj} onChange={e => { setLinkedObj(e.target.value); setLinkedKR(""); }} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="">Không liên kết</option>
                {objectives.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Liên kết Key Result</label>
              <select value={linkedKR} onChange={e => setLinkedKR(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" disabled={!linkedObj}>
                <option value="">Không chọn KR</option>
                {krs.map((kr: any) => <option key={kr.id} value={kr.id}>{kr.name}</option>)}
              </select>
            </div>
          </div>

          {/* Watchers - Search and Select */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Người theo dõi</label>
            {/* Selected watchers chips */}
            {watcherIds.length > 0 && (
               <div className="flex flex-wrap gap-1.5 mb-2">
                {watcherIds.map(wId => {
                  const s = staff.find(x => x.user_id === wId);
                  return (
                    <span key={wId} className="inline-flex items-center gap-1 text-[12px] bg-[#EFF6FF] text-[#3B82F6] px-2.5 py-1 rounded-full border border-[#DBEAFE]">
                      {s?.name || `#${wId}`}
                      <button type="button" onClick={() => removeWatcher(wId)} className="hover:text-[#DC2626] transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
              <input
                type="text"
                value={watcherSearch}
                onChange={e => { setWatcherSearch(e.target.value); setShowWatcherDropdown(true); }}
                onFocus={() => setShowWatcherDropdown(true)}
                placeholder="Tìm và chọn người theo dõi..."
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none"
              />
              {showWatcherDropdown && watcherSearch.length > 0 && filteredStaffForWatcher.length > 0 && (
                 <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-[160px] overflow-y-auto">
                  {filteredStaffForWatcher.slice(0, 8).map(s => (
                    <button key={s.user_id} type="button" onClick={() => addWatcher(s.user_id)}
                      className="w-full text-left px-3 py-2 text-[13px] text-[#1E2A3A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#9CA3AF]" /> {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5A6E85] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F8FAFC]">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-[#00b24e] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#009b43]">{task ? "Lưu" : "Tạo"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
