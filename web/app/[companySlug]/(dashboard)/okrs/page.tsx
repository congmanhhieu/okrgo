"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Search, ChevronDown, ChevronRight, Building2, Users, User,
  Target, BarChart3, Edit, Trash2, Crosshair, MapPin, Target as TargetIcon
} from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image";

// ===== TYPES =====
type KeyResult = {
  id: number;
  objective_id: number;
  name: string;
  unit: string;
  start_value: number;
  current_value: number;
  target_value: number;
  owner_id: number | null;
  deadline: string;
  progress: number;
};

type Objective = {
  id: number;
  name: string;
  description: string;
  level: string; // company, department, personal
  owner_id: number;
  owner_name: string;
  owner_avatar: string | null;
  dept_name: string;
  cycle_id: number;
  cycle_name: string;
  progress: number;
  status: string;
  start_date: string;
  end_date: string;
  key_results: KeyResult[];
};

type Cycle = { id: number; name: string };
type Staff = { id: number; name: string };

export default function OKRsPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [okrs, setOkrs] = useState<Objective[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterLevel, setFilterLevel] = useState("");
  const [filterCycle, setFilterCycle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded state
  const [expandedObjs, setExpandedObjs] = useState<number[]>([]);

  // Modals state
  const [showObjModal, setShowObjModal] = useState(false);
  const [editingObj, setEditingObj] = useState<Objective | null>(null);

  const [showKrModal, setShowKrModal] = useState(false);
  const [editingKr, setEditingKr] = useState<KeyResult | null>(null);
  const [parentObjId, setParentObjId] = useState<number | null>(null);

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInKr, setCheckInKr] = useState<KeyResult | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [okrsData, cyclesData, staffData] = await Promise.all([
        api.get(`/workspaces/${companySlug}/okrs?cycle_id=${filterCycle}&level=${filterLevel}`).catch(() => ({ data: [] })),
        api.get(`/workspaces/${companySlug}/cycles`).catch(() => ({ data: [] })),
        api.get(`/workspaces/${companySlug}/staff`).catch(() => ({ data: [] }))
      ]);
      setOkrs(okrsData.data || []);
      setCycles(cyclesData.data || []);
      setStaff(staffData.data || []);
    } catch (err) {
      toast.error("Không thể tải dữ liệu OKR");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (companySlug) {
      loadData();
    }
  }, [companySlug, filterCycle, filterLevel]);

  const toggleExpand = (id: number) => {
    setExpandedObjs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // CheckIn Submit
  const handleCheckInSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!checkInKr) return;
    const formData = new FormData(e.currentTarget);
    const value = parseFloat(formData.get("value") as string);
    const comment = formData.get("comment") as string;
    const progress_percent_str = formData.get("progress_percent") as string;
    const problem = formData.get("problem") as string;
    const cause = formData.get("cause") as string;
    const solution = formData.get("solution") as string;
    const confidence_level = formData.get("confidence_level") as string;
    const execution_speed = formData.get("execution_speed") as string;

    const payload: any = { value, comment, problem, cause, solution, confidence_level, execution_speed };
    if (progress_percent_str) {
      payload.progress_percent = parseFloat(progress_percent_str);
    }

    try {
      await api.post(`/workspaces/${companySlug}/okrs/key-results/${checkInKr.id}/check-in`, payload);
      toast.success("Check-in thành công");
      setShowCheckInModal(false);
      loadData();
    } catch (err) {
      toast.error("Lỗi khi check-in");
    }
  };

  // Obj Delete
  const handleDeleteObj = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa Objective này?")) return;
    try {
      await api.delete(`/workspaces/${companySlug}/okrs/${id}`);
      toast.success("Đã xóa Objective");
      loadData();
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  // KR Delete
  const handleDeleteKr = async (krId: number) => {
    if (!confirm("Bạn có chắc muốn xóa Key Result này?")) return;
    try {
      await api.delete(`/workspaces/${companySlug}/okrs/key-results/${krId}`);
      toast.success("Đã xóa Key Result");
      loadData();
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  const getLevelIcon = (level: string) => {
    if (level === "company") return <Building2 className="w-4 h-4 text-orange-500" />;
    if (level === "department") return <Users className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-green-500" />;
  };

  const getLevelLabel = (level: string) => {
    if (level === "company") return "Công ty";
    if (level === "department") return "Phòng ban";
    return "Cá nhân";
  };

  // Filter local search
  const filteredOkrs = okrs.filter(o =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.key_results?.some(kr => kr.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2A3A] mb-1">Mục tiêu (OKRs)</h1>
          <p className="text-[14px] text-[#5A6E85]">Quản lý và theo dõi OKRs của tổ chức.</p>
        </div>
        <button
          onClick={() => { setEditingObj(null); setShowObjModal(true); }}
          className="bg-[#00b24e] hover:bg-[#00a046] text-white px-4 py-2.5 rounded-[10px] text-[14px] font-semibold transition-colors flex items-center w-fit shadow-sm shadow-[#00b24e]/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo Objective
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Tìm theo tên Objective hoặc Key Result..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-[14px] border border-[#E2E8F0] rounded-[10px] focus:outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e] transition-shadow text-[#1E2A3A]"
          />
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border border-[#E2E8F0] rounded-[10px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#00b24e]"
        >
          <option value="">Tất cả cấp độ</option>
          <option value="company">Công ty</option>
          <option value="department">Phòng ban</option>
          <option value="personal">Cá nhân</option>
        </select>

        <select
          value={filterCycle}
          onChange={(e) => setFilterCycle(e.target.value)}
          className="border border-[#E2E8F0] rounded-[10px] px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#00b24e]"
        >
          <option value="">Tất cả chu kỳ</option>
          {cycles.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* OKR List */}
      {isLoading ? (
        <div className="text-center py-10 text-[#5A6E85]">Đang tải...</div>
      ) : filteredOkrs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
          <Target className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3 opacity-50" />
          <p className="text-[#5A6E85] font-medium">Chưa có Objective nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOkrs.map((obj) => {
            const isExpanded = expandedObjs.includes(obj.id);
            return (
              <div key={obj.id} className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-sm overflow-hidden transition-all">
                {/* Objective Header Area */}
                <div
                  className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'border-b border-[#E2E8F0]' : ''}`}
                  onClick={() => toggleExpand(obj.id)}
                >
                  <button className="mt-1 text-[#9CA3AF] hover:text-[#5A6E85]">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md text-[12px] font-medium text-gray-600">
                        {getLevelIcon(obj.level)} {getLevelLabel(obj.level)}
                      </span>
                      <span className="text-[12px] text-gray-500 font-medium">({obj.cycle_name})</span>
                    </div>
                    <h3 className="text-[16px] font-bold text-[#1E2A3A] leading-snug">{obj.name}</h3>
                    {obj.description && <p className="text-[13px] text-[#5A6E85] mt-1">{obj.description}</p>}
                  </div>

                  {/* Stats and Owner */}
                  <div className="flex flex-col items-end gap-3 w-48">
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[13px] font-medium text-[#1E2A3A]">{obj.owner_name}</div>
                        <div className="text-[11px] text-[#5A6E85]">{obj.dept_name || 'Không có P.Ban'}</div>
                      </div>
                      <img src={getImageUrl(obj.owner_avatar) || `https://ui-avatars.com/api/?name=${obj.owner_name}`} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                    </div>

                    <div className="w-full">
                      <div className="flex justify-between text-[12px] mb-1 font-medium">
                        <span className="text-[#5A6E85]">Tiến độ</span>
                        <span className={obj.progress >= 70 ? 'text-green-600' : obj.progress >= 30 ? 'text-yellow-600' : 'text-red-500'}>{obj.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${obj.progress >= 70 ? 'bg-green-500' : obj.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${obj.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button onClick={(e) => { e.stopPropagation(); setEditingObj(obj); setShowObjModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteObj(obj.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Key Results */}
                {isExpanded && (
                  <div className="bg-[#F8FAFC] p-4 border-l-4 border-[#E2E8F0] space-y-2">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[13px] font-bold text-[#5A6E85] uppercase tracking-wider">Key Results</h4>
                      <button
                        onClick={() => { setEditingKr(null); setParentObjId(obj.id); setShowKrModal(true); }}
                        className="text-[13px] font-medium text-[#00b24e] hover:text-[#00a046] flex items-center bg-white px-2 py-1 rounded border border-[#E2E8F0] hover:border-[#00b24e]"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Thêm KR
                      </button>
                    </div>

                    {(obj.key_results || []).length === 0 ? (
                      <div className="text-[13px] text-gray-400 italic">Chưa có Key Result.</div>
                    ) : (
                      obj.key_results?.map(kr => (
                        <div key={kr.id} className="bg-white p-3 rounded-lg border border-[#E2E8F0] flex items-center gap-4 hover:border-gray-300 transition-colors">
                          <TargetIcon className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <h5 className="text-[14px] font-semibold text-[#1E2A3A]">{kr.name}</h5>
                            <div className="text-[12px] text-[#5A6E85] mt-1 space-x-3 flex items-center">
                              <span>Mục tiêu: <b className="text-gray-700">{kr.target_value} {kr.unit}</b></span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>Hiện tại: <b className="text-gray-700">{kr.current_value} {kr.unit}</b></span>
                            </div>
                          </div>

                          <div className="w-32">
                            <div className="flex justify-end text-[11px] mb-1 font-bold">
                              <span className={kr.progress >= 70 ? 'text-green-600' : kr.progress >= 30 ? 'text-yellow-600' : 'text-red-500'}>{kr.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${kr.progress >= 70 ? 'bg-green-500' : kr.progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${kr.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={() => { setCheckInKr(kr); setShowCheckInModal(true); }}
                              className="px-2 py-1 bg-blue-50 text-blue-600 text-[12px] font-semibold rounded hover:bg-blue-100 transition-colors"
                            >
                              Check-in
                            </button>
                            <button onClick={() => { setEditingKr(kr); setParentObjId(obj.id); setShowKrModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteKr(kr.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Obj Form Modal implementation will follow in next turns if needed, or simplified here */}
      {/* For brevity, let's keep it complete. */}
      {showObjModal && <ObjectiveModal
        obj={editingObj}
        cycles={cycles}
        staff={staff}
        onClose={() => setShowObjModal(false)}
        onSuccess={() => { setShowObjModal(false); loadData(); }}
        companySlug={companySlug}
      />}

      {showKrModal && <KeyResultModal
        kr={editingKr}
        objId={parentObjId!}
        onClose={() => setShowKrModal(false)}
        onSuccess={() => { setShowKrModal(false); loadData(); }}
        companySlug={companySlug}
      />}

      {showCheckInModal && <CheckInModal
        kr={checkInKr!}
        onClose={() => setShowCheckInModal(false)}
        onSubmit={handleCheckInSubmit}
      />}
    </div>
  );
}

// ============== MODAL COMPONENTS ==============

function CheckInModal({ kr, onClose, onSubmit }: { kr: KeyResult, onClose: () => void, onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <h2 className="text-[16px] font-bold text-[#1E2A3A]">Check-in Key Result</h2>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-[13px] text-gray-700">
            <strong>{kr.name}</strong>
            <div className="mt-1 flex justify-between">
              <span>Hiện tại: {kr.current_value} {kr.unit}</span>
              <span>Mục tiêu: {kr.target_value} {kr.unit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Giá trị đạt được *</label>
              <input name="value" type="number" step="any" defaultValue={kr.current_value} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Phần trăm thực hiện công việc (%)</label>
              <input name="progress_percent" type="number" step="any" min="0" max="100" placeholder="0-100" className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Vấn đề (Điều gì đang vướng mắc, chậm lại hoặc thất bại) *</label>
            <textarea name="problem" rows={2} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]"></textarea>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Nguyên nhân (Khách quan và chủ quan) *</label>
            <textarea name="cause" rows={2} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]"></textarea>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Giải pháp/ sáng kiến/ việc cần làm (Tùy chọn)</label>
            <textarea name="solution" rows={2} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Mức độ tự tin hoàn thành KR *</label>
              <div className="flex w-full rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                {[
                  { value: "not_confident", label: "Không tự tin" },
                  { value: "lacking_confidence", label: "Thiếu tự tin" },
                  { value: "confident", label: "Tự tin" },
                  { value: "very_confident", label: "Rất tự tin" },
                ].map((opt) => (
                  <label key={opt.value} className="flex-1 text-center cursor-pointer border-r border-[#E2E8F0] last:border-r-0">
                    <input type="radio" name="confidence_level" value={opt.value} defaultChecked={opt.value === 'confident'} className="peer sr-only" required />
                    <div className="py-2 px-1 text-[13px] font-medium transition-colors bg-white text-[#5A6E85] peer-checked:bg-[#00b24e]/10 peer-checked:text-[#00b24e] hover:bg-gray-50 h-full flex items-center justify-center">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Tốc độ thực hiện mục tiêu *</label>
              <div className="flex w-full rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                {[
                  { value: "very_slow", label: "Rất chậm" },
                  { value: "slow", label: "Chậm" },
                  { value: "fast", label: "Nhanh" },
                  { value: "very_fast", label: "Rất nhanh" },
                ].map((opt) => (
                  <label key={opt.value} className="flex-1 text-center cursor-pointer border-r border-[#E2E8F0] last:border-r-0">
                    <input type="radio" name="execution_speed" value={opt.value} defaultChecked={opt.value === 'fast'} className="peer sr-only" required />
                    <div className="py-2 px-1 text-[13px] font-medium transition-colors bg-white text-[#5A6E85] peer-checked:bg-[#00b24e]/10 peer-checked:text-[#00b24e] hover:bg-gray-50 h-full flex items-center justify-center">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-[14px] font-semibold text-[#5A6E85] bg-white border border-[#E2E8F0] rounded-[8px] hover:bg-gray-50">Hủy</button>
            <button type="submit" className="flex-1 px-4 py-2 text-[14px] font-semibold text-white bg-[#00b24e] rounded-[8px] hover:bg-[#00a046]">Lưu check-in</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ObjectiveModal({ obj, cycles, staff, onClose, onSuccess, companySlug }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      level: formData.get("level"),
      owner_id: parseInt(formData.get("owner_id") as string),
      cycle_id: parseInt(formData.get("cycle_id") as string),
      confidence_level: formData.get("confidence_level"),
    };

    try {
      if (obj) {
        await api.put(`/workspaces/${companySlug}/okrs/${obj.id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await api.post(`/workspaces/${companySlug}/okrs`, payload);
        toast.success("Tạo thành công");
      }
      onSuccess();
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-10">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-full flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">{obj ? "Sửa Objective" : "Tạo Objective mới"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Tên Mục Tiêu (Objective) *</label>
            <input name="name" type="text" defaultValue={obj?.name} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e]" />
          </div>
          <div>
            <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Mô tả</label>
            <textarea name="description" defaultValue={obj?.description} rows={2} className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Cấp độ *</label>
              <select name="level" defaultValue={obj?.level || "personal"} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="company">Công ty</option>
                <option value="department">Phòng ban</option>
                <option value="personal">Cá nhân</option>
              </select>
            </div>
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Chu kỳ *</label>
              <select name="cycle_id" defaultValue={obj?.cycle_id} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="">Chọn chu kỳ</option>
                {cycles.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Chủ sở hữu (Owner) *</label>
              <select name="owner_id" defaultValue={obj?.owner_id} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]">
                <option value="">Chọn nhân sự</option>
                {staff.map((s: any) => <option key={s.user_id} value={s.user_id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block tracking-tight text-[13px] font-medium text-[#1E2A3A] mb-1.5">Mức độ tự tin hoàn thành OKRs này *</label>
              <div className="flex w-full rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                {[
                  { value: "not_confident", label: "Không tự tin" },
                  { value: "lacking_confidence", label: "Thiếu tự tin" },
                  { value: "confident", label: "Tự tin" },
                  { value: "very_confident", label: "Rất tự tin" },
                ].map((opt) => (
                  <label key={opt.value} className="flex-1 text-center cursor-pointer border-r border-[#E2E8F0] last:border-r-0">
                    <input type="radio" name="confidence_level" value={opt.value} defaultChecked={obj ? obj.confidence_level === opt.value : opt.value === 'confident'} className="peer sr-only" required />
                    <div className="py-2 px-1 text-[13px] font-medium transition-colors bg-white text-[#5A6E85] peer-checked:bg-[#00b24e]/10 peer-checked:text-[#00b24e] hover:bg-gray-50 h-full flex items-center justify-center">
                      {opt.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 pb-2 border-t border-gray-100 mt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-[14px] font-semibold text-[#5A6E85] bg-white border border-[#E2E8F0] rounded-[10px] hover:bg-[#F9FBFD] transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-[14px] font-semibold text-white bg-[#00b24e] rounded-[10px] hover:bg-[#00a046] transition-colors disabled:opacity-50">Lưu Objective</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KeyResultModal({ kr, objId, onClose, onSuccess, companySlug }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      unit: formData.get("unit"),
      start_value: parseFloat(formData.get("start_value") as string),
      target_value: parseFloat(formData.get("target_value") as string),
    };

    try {
      if (kr) {
        await api.put(`/workspaces/${companySlug}/okrs/key-results/${kr.id}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await api.post(`/workspaces/${companySlug}/okrs/${objId}/key-results`, payload);
        toast.success("Tạo thành công");
      }
      onSuccess();
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
          <h2 className="text-[18px] font-bold text-[#1E2A3A]">{kr ? "Sửa Key Result" : "Tạo Key Result"}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Tên Kết quả then chốt (KR) *</label>
            <input name="name" type="text" defaultValue={kr?.name} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Đơn vị đo lường *</label>
            <input name="unit" type="text" placeholder="%, ngàn VND, bài viết..." defaultValue={kr?.unit} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Giá trị khởi điểm</label>
              <input name="start_value" type="number" step="any" defaultValue={kr?.start_value || 0} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1E2A3A] mb-1.5">Giá trị mục tiêu *</label>
              <input name="target_value" type="number" step="any" defaultValue={kr?.target_value} required className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px]" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-[14px] font-semibold text-[#5A6E85] bg-white border border-[#E2E8F0] rounded-[10px] hover:bg-[#F9FBFD]">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 text-[14px] font-semibold text-white bg-[#00b24e] rounded-[10px] hover:bg-[#00a046] disabled:opacity-50">Lưu Key Result</button>
          </div>
        </form>
      </div>
    </div>
  );
}
