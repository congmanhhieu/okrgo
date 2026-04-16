import { useState } from "react";
import { Search, User, X, Star } from "lucide-react";
import { toast } from "sonner";

export function KudoFormModal({ staff, criteria, onSave, onClose }: {
  staff: any[]; criteria: any[];
  onSave: (d: any) => void; onClose: () => void;
}) {
  const [receiverId, setReceiverId] = useState<string>("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>("");
  const [referenceText, setReferenceText] = useState("");

  const [receiverSearch, setReceiverSearch] = useState("");
  const [showReceiverDropdown, setShowReceiverDropdown] = useState(false);

  const selectedReceiver = staff.find(s => s.user_id === Number(receiverId));

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(receiverSearch.toLowerCase())
  );

  const categories = Array.from(
    new Set(criteria.flatMap(c => (c.category || "").split(",").map((s: string) => s.trim()).filter(Boolean)))
  );
  const filteredCriteria = criteria.filter(c => 
    (c.category || "").split(",").map((s: string) => s.trim()).includes(selectedCategory)
  );
  
  const selectedCriteria = criteria.find(c => c.id === Number(selectedCriteriaId));

  const categoryLabels: Record<string, string> = {
    "culture": "Văn hóa cốt lõi",
    "objective": "Mục tiêu (Objective)",
    "project": "Dự án",
    "task": "Công việc (Task)"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) { toast.error("Vui lòng chọn người nhận"); return; }
    if (!selectedCriteriaId) { toast.error("Vui lòng chọn một tiêu chí ghi nhận"); return; }
    if (!content.trim()) { toast.error("Vui lòng nhập lời chúc/khen ngợi"); return; }
    
    onSave({
      receiver_id: Number(receiverId),
      content: content.trim(),
      criteria_id: Number(selectedCriteriaId),
      reference_text: referenceText.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">Tạo Vinh danh (Kudo)</h2>
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
                  className="w-full pl-9 pr-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none"
                />
                {showReceiverDropdown && filteredStaff.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-[160px] overflow-y-auto">
                    {filteredStaff.slice(0, 8).map(s => (
                      <button key={s.user_id} type="button" onClick={() => { setReceiverId(s.user_id.toString()); setReceiverSearch(""); setShowReceiverDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-[14px] text-[#1E2A3A] hover:bg-[#F1F5F9] transition-colors flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#9CA3AF]" /> {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Bạn muốn ghi nhận về */}
             <div>
                <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Ghi nhận về mảng <span className="text-[#DC2626]">*</span></label>
                <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedCriteriaId(""); }} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] outline-none focus:border-[#00b24e]">
                  <option value="">Chọn lĩnh vực...</option>
                  {categories.map((c: any) => <option key={c} value={c}>{categoryLabels[c] || c}</option>)}
                </select>
             </div>
             
             {/* Tiêu chí */}
             <div>
                <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Tiêu chí ghi nhận <span className="text-[#DC2626]">*</span></label>
                <select disabled={!selectedCategory} value={selectedCriteriaId} onChange={e => setSelectedCriteriaId(e.target.value)} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] outline-none focus:border-[#00b24e]">
                  <option value="">Chọn tiêu chí...</option>
                  {filteredCriteria.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>
          </div>

          {selectedCriteria && (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] px-3 py-2 rounded-[8px] flex items-center text-[13px] text-[#D97706]">
              <Star className="w-4 h-4 mr-1.5 fill-current" /> Người nhận sẽ được thưởng <strong className="mx-1">{selectedCriteria.stars} Sao</strong> từ hệ thống.
            </div>
          )}

          {selectedCategory && selectedCategory !== "culture" && (
            <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Đóng góp cụ thể <span className="text-[#9CA3AF] font-normal">(Tên {categoryLabels[selectedCategory] || "dự án"}...)</span></label>
              <input type="text" value={referenceText} onChange={e => setReferenceText(e.target.value)} placeholder={`VD: ${categoryLabels[selectedCategory] || "Dự án"} xuất sắc nhất kỳ...`} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] outline-none focus:border-[#00b24e]" />
            </div>
          )}

          <div>
              <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-1">Lời cảm ơn / Khen ngợi <span className="text-[#DC2626]">*</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Gửi những lời tốt đẹp đến đồng nghiệp của bạn..." className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[14px] font-medium text-[#5A6E85] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F8FAFC]">Hủy</button>
            <button type="submit" className="px-5 py-2 bg-[#00b24e] text-white text-[14px] font-semibold rounded-[8px] hover:bg-[#009b43]">Gửi Vinh danh</button>
          </div>
        </form>
      </div>
    </div>
  );
}
