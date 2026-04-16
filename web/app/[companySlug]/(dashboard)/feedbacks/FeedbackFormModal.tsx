import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, User, X } from "lucide-react";
import { toast } from "sonner";

export function FeedbackFormModal({ staff, objectives, tasks, onSave, onClose }: {
  staff: any[]; objectives: any[]; tasks: any[];
  onSave: (d: any) => void; onClose: () => void;
}) {
  const [receiverId, setReceiverId] = useState<string>("");
  const [content, setContent] = useState("");
  const [advice, setAdvice] = useState("");
  const [linkedObj, setLinkedObj] = useState<string>("");
  const [linkedKR, setLinkedKR] = useState<string>("");
  const [linkedTask, setLinkedTask] = useState<string>("");

  // Assignee search
  const [receiverSearch, setReceiverSearch] = useState("");
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);

  const selectedReceiver = staff.find(s => s.user_id === Number(receiverId));
  const selectedObj = objectives.find(o => o.id === Number(linkedObj));
  const krs = selectedObj?.key_results || [];

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(receiverSearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) { toast.error("Vui lòng chọn người nhận"); return; }
    if (!content.trim()) { toast.error("Vui lòng nhập nội dung phản hồi"); return; }
    
    onSave({
      receiver_id: Number(receiverId),
      content: content.trim(),
      advice: advice.trim() || undefined,
      linked_objective_id: linkedObj ? Number(linkedObj) : undefined,
      linked_kr_id: linkedKR ? Number(linkedKR) : undefined,
      linked_task_id: linkedTask ? Number(linkedTask) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">Gửi phản hồi mới</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F1F5F9] rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Người nhận */}
          <div>
            <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Gửi đến (Người nhận) <span className="text-[#DC2626]">*</span></label>
            {selectedReceiver ? (
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1 text-[13px] bg-[#EFF6FF] text-[#3B82F6] px-3 py-1.5 rounded-full border border-[#DBEAFE] font-medium">
                  <User className="w-3.5 h-3.5" />{selectedReceiver.name}
                  <button type="button" onClick={() => { setReceiverId(""); setReceiverSearch(""); }} className="hover:text-[#DC2626] transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={receiverSearch}
                  onChange={e => { setReceiverSearch(e.target.value); setShowReceiverDropdown(true); }}
                  onFocus={() => setShowReceiverDropdown(true)}
                  placeholder="Tìm người nhận..."
                  className="w-full pl-9 pr-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none"
                />
                {showReceiverDropdown && filteredStaff.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-[160px] overflow-y-auto">
                    {filteredStaff.slice(0, 8).map(s => (
                      <button key={s.user_id} type="button" onClick={() => { setReceiverId(s.user_id.toString()); setReceiverSearch(""); setShowReceiverDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-[13px] text-[#1E2A3A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" /> {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 space-y-4">
             {/* Nội dung phản hồi */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Nội dung phản hồi <span className="text-[#DC2626]">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Mô tả cụ thể vấn đề hoặc điểm tích cực..." className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" />
            </div>

            {/* Lời khuyên */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Lời khuyên / Hướng dẫn <span className="text-[#9CA3AF] font-normal">(Tùy chọn)</span></label>
              <textarea value={advice} onChange={e => setAdvice(e.target.value)} rows={2} placeholder="Bạn có gợi ý giải pháp hay bước hành động gì tiếp theo không?" className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" />
            </div>
          </div>

          <div className="border border-[#E2E8F0] p-4 rounded-[10px]">
             <h4 className="text-[13px] font-semibold text-[#1E2A3A] mb-3">Liên kết (Tùy chọn)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#5A6E85] mb-1">Mục tiêu (Objective)</label>
                <select value={linkedObj} onChange={e => { setLinkedObj(e.target.value); setLinkedKR(""); }} className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px]">
                  <option value="">Không chọn</option>
                  {objectives.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#5A6E85] mb-1">Kết quả chính (KR)</label>
                <select value={linkedKR} onChange={e => setLinkedKR(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px]" disabled={!linkedObj}>
                  <option value="">Không chọn</option>
                  {krs.map((kr: any) => <option key={kr.id} value={kr.id}>{kr.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] font-medium text-[#5A6E85] mb-1">Công việc (Task)</label>
                <select value={linkedTask} onChange={e => setLinkedTask(e.target.value)} className="w-full px-3 py-2 text-[13px] border border-[#E2E8F0] rounded-[8px]">
                  <option value="">Không chọn</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
             <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5A6E85] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F8FAFC]">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-[#00b24e] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#009b43]">Gửi phản hồi</button>
          </div>
        </form>
      </div>
    </div>
  );
}
