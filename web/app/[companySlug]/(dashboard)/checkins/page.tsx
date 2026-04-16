"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Target, Activity, Clock, Plus, CheckCircle2, AlertTriangle, MessageSquare, Save
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

type CheckInHistoryItem = {
  id: number;
  value: number;
  progress_percent?: number;
  comment: string;
  problem: string;
  cause: string;
  solution: string;
  confidence_level: string;
  execution_speed: string;
  created_at: string;
};

type PendingCheckIn = {
  key_result_id: number;
  objective_name: string;
  key_result_name: string;
  start_value: number;
  current_value: number;
  target_value: number;
  unit: string;
  progress: number;
  last_check_in_at: string | null;
  days_since_last_check_in: number;
  history: CheckInHistoryItem[];
};

export default function CheckinsPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;

  const [checkins, setCheckins] = useState<PendingCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state to track user inputs before saving
  const [inputs, setInputs] = useState<{ [krId: number]: { value: string; progress_percent: string; comment: string; problem: string; cause: string; solution: string; confidence_level: string; execution_speed: string } }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savingKrId, setSavingKrId] = useState<number | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${companySlug}/okrs/my-check-ins`);
      setCheckins(res.data || []);

      // Initialize inputs state
      const initialInputs: any = {};
      (res.data || []).forEach((c: PendingCheckIn) => {
        initialInputs[c.key_result_id] = {
          value: c.current_value.toString(),
          progress_percent: "",
          comment: "",
          problem: "",
          cause: "",
          solution: "",
          confidence_level: "confident",
          execution_speed: "fast"
        };
      });
      setInputs(initialInputs);

    } catch (err) {
      toast.error("Không thể tải danh sách Check-in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [companySlug]);

  const handleInputChange = (krId: number, field: string, val: string) => {
    setInputs(prev => ({
      ...prev,
      [krId]: {
        ...prev[krId],
        [field]: val
      }
    }));
  };

  const handleSaveSingle = async (krId: number) => {
    const data = inputs[krId];
    if (!data || data.value === "") {
      toast.error("Vui lòng nhập giá trị check-in");
      return;
    }

    try {
      setSavingKrId(krId);
      
      const payload: any = {
        value: Number(data.value),
        comment: data.comment,
        problem: data.problem,
        cause: data.cause,
        solution: data.solution,
        confidence_level: data.confidence_level,
        execution_speed: data.execution_speed
      };
      if (data.progress_percent) {
        payload.progress_percent = Number(data.progress_percent);
      }

      await api.post(`/workspaces/${companySlug}/okrs/key-results/${krId}/check-in`, payload);
      toast.success("Check-in thành công!");
      fetchCheckins();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSavingKrId(null);
    }
  };

  const handleSaveAll = async () => {
    const krIdsToSave = checkins.map(c => c.key_result_id).filter(krId => {
      // Basic check: if value actually changed or comment added
      const kr = checkins.find(x => x.key_result_id === krId);
      const data = inputs[krId];
      if (!kr || !data) return false;
      return (Number(data.value) !== kr.current_value) || (data.comment.trim() !== "");
    });

    if (krIdsToSave.length === 0) {
      toast.info("Không có thay đổi nào để lưu.");
      return;
    }

    try {
      setIsSaving(true);
      const promises = krIdsToSave.map(krId => {
        const payload: any = {
          value: Number(inputs[krId].value),
          comment: inputs[krId].comment,
          problem: inputs[krId].problem,
          cause: inputs[krId].cause,
          solution: inputs[krId].solution,
          confidence_level: inputs[krId].confidence_level,
          execution_speed: inputs[krId].execution_speed
        };
        if (inputs[krId].progress_percent) {
          payload.progress_percent = Number(inputs[krId].progress_percent);
        }
        return api.post(`/workspaces/${companySlug}/okrs/key-results/${krId}/check-in`, payload);
      });
      await Promise.all(promises);
      toast.success(`Đã check-in thành công ${krIdsToSave.length} Key Results!`);
      fetchCheckins();
    } catch (err) {
      toast.error("Quá trình lưu tất cả gặp lỗi. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Check-in Định Kỳ</h1>
          <p className="text-[#5A6E85] mt-1 text-[15px]">Theo dõi và cập nhật tiến độ các mục tiêu KRs của bạn</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-[#009b43] transition-colors flex items-center shadow-sm disabled:opacity-50"
        >
          {isSaving ? "Đang lưu..." : "Lưu tất cả thay đổi"}
        </button>
      </div>

      {checkins.length === 0 ? (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-12 text-center">
          <Activity className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-[18px] font-medium text-[#1E2A3A]">Chưa có Key Result nào</h3>
          <p className="text-[#5A6E85] mt-2 text-[14px]">Bạn chưa được giao bất kỳ Key Result nào, hoặc bạn chưa tham gia chu kỳ nào.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {checkins.map((kr) => {
            const inputData = inputs[kr.key_result_id] || { value: 0, comment: "" };

            return (
              <div key={kr.key_result_id} className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm overflow-hidden flex flex-col xl:flex-row">

                {/* Check-in Main Form */}
                <div className="flex-1 p-6 border-b xl:border-b-0 xl:border-r border-[#E2E8F0]">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center text-[#5A6E85] text-[13px] font-medium mb-1.5">
                        <Target className="w-4 h-4 mr-1.5 text-[#3B82F6]" />
                        {kr.objective_name}
                      </div>
                      <h3 className="text-[18px] font-semibold text-[#1E2A3A] tracking-tight">{kr.key_result_name}</h3>
                    </div>
                    {kr.days_since_last_check_in >= 7 && (
                      <div className="flex items-center bg-[#FEF2F2] text-[#DC2626] px-3 py-1.5 rounded-full text-[12px] font-medium border border-[#FEE2E2]">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Đã {kr.days_since_last_check_in} ngày chưa check-in
                      </div>
                    )}
                  </div>

                  {/* Progress Bar Display */}
                  <div className="mb-6 bg-[#F8FAFC] p-4 rounded-[12px] border border-[#F1F5F9]">
                    <div className="flex justify-between text-[13px] mb-2 font-medium">
                      <span className="text-[#5A6E85]">Tiến độ hiện tại: <span className="text-[#1E2A3A]">{kr.progress}%</span></span>
                      <span className="text-[#5A6E85]">{kr.current_value} / {kr.target_value} {kr.unit}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${kr.progress >= 100 ? 'bg-[#00b24e]' : 'bg-[#3B82F6]'}`}
                        style={{ width: `${Math.min(kr.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Detailed Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Giá trị mới ({kr.unit}) *</label>
                      <input
                        type="number"
                        value={inputData.value}
                        onChange={(e) => handleInputChange(kr.key_result_id, "value", e.target.value)}
                        className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Phần trăm thực hiện (%)</label>
                      <input
                        type="number"
                        min="0" max="100"
                        value={inputData.progress_percent}
                        onChange={(e) => handleInputChange(kr.key_result_id, "progress_percent", e.target.value)}
                        placeholder="0-100"
                        className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Vấn đề (Điều gì đang vướng mắc, chậm lại hoặc thất bại) *</label>
                    <textarea
                      rows={2}
                      value={inputData.problem}
                      onChange={(e) => handleInputChange(kr.key_result_id, "problem", e.target.value)}
                      className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none transition-all"
                    ></textarea>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Nguyên nhân (Khách quan và chủ quan) *</label>
                    <textarea
                      rows={2}
                      value={inputData.cause}
                      onChange={(e) => handleInputChange(kr.key_result_id, "cause", e.target.value)}
                      className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none transition-all"
                    ></textarea>
                  </div>

                  <div className="mb-5">
                    <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Giải pháp/ sáng kiến/ việc cần làm (Tùy chọn)</label>
                    <textarea
                      rows={2}
                      value={inputData.solution}
                      onChange={(e) => handleInputChange(kr.key_result_id, "solution", e.target.value)}
                      className="w-full px-3 py-2 text-[14px] border border-[#E2E8F0] rounded-[8px] focus:ring-2 focus:ring-[#00b24e]/20 focus:border-[#00b24e] outline-none transition-all"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Mức độ tự tin hoàn thành KR *</label>
                      <div className="flex w-full rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                        {[
                          { value: "not_confident", label: "Không tự tin" },
                          { value: "lacking_confidence", label: "Thiếu tự tin" },
                          { value: "confident", label: "Tự tin" },
                          { value: "very_confident", label: "Rất tự tin" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleInputChange(kr.key_result_id, "confidence_level", opt.value)}
                            className={`flex-1 py-2 px-1 text-[13px] font-medium transition-colors border-r border-[#E2E8F0] last:border-r-0 ${
                              inputData.confidence_level === opt.value
                                ? "bg-[#00b24e]/10 text-[#00b24e] font-semibold"
                                : "bg-white text-[#5A6E85] hover:bg-gray-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1E2A3A] mb-2">Tốc độ thực hiện mục tiêu *</label>
                      <div className="flex w-full rounded-[8px] overflow-hidden border border-[#E2E8F0] shadow-sm">
                        {[
                          { value: "very_slow", label: "Rất chậm" },
                          { value: "slow", label: "Chậm" },
                          { value: "fast", label: "Nhanh" },
                          { value: "very_fast", label: "Rất nhanh" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleInputChange(kr.key_result_id, "execution_speed", opt.value)}
                            className={`flex-1 py-2 px-1 text-[13px] font-medium transition-colors border-r border-[#E2E8F0] last:border-r-0 ${
                              inputData.execution_speed === opt.value
                                ? "bg-[#00b24e]/10 text-[#00b24e] font-semibold"
                                : "bg-white text-[#5A6E85] hover:bg-gray-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveSingle(kr.key_result_id)}
                      disabled={savingKrId === kr.key_result_id}
                      className="px-4 py-2 bg-[#F1F5F9] text-[#1E2A3A] text-[13px] font-semibold rounded-[8px] hover:bg-[#E2E8F0] transition-colors flex items-center disabled:opacity-50"
                    >
                      {savingKrId === kr.key_result_id ? "Đang lưu..." : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Lưu KR này
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Timeline Sidebar per KR */}
                <div className="w-full xl:w-[320px] bg-[#F8FAFC] p-6 flex flex-col">
                  <h4 className="text-[14px] font-bold text-[#1E2A3A] mb-4 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-[#9CA3AF]" />
                    Lịch sử check-in
                  </h4>

                  <div className="flex-1 overflow-y-auto">
                    {kr.history && kr.history.length > 0 ? (
                      <div className="relative border-l border-[#E2E8F0] ml-2 space-y-5 pb-2">
                        {kr.history.map((h, idx) => (
                          <div key={h.id} className="relative pl-5">
                            <div className="absolute w-2.5 h-2.5 bg-[#00b24e] rounded-full left-[-5px] top-1.5 border-2 border-white ring-2 ring-[#E6F7ED]" />
                            <div className="mb-0.5 text-[12px] text-[#5A6E85] font-medium">
                              {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                            </div>
                            <div className="text-[14px] font-semibold text-[#1E2A3A] mb-1">
                              Đạt mức: <span className="text-[#00b24e]">{h.value}</span> {kr.unit}
                              {h.progress_percent != null && <span className="text-[12px] text-gray-500 font-normal ml-2">({h.progress_percent}%)</span>}
                            </div>
                            
                            {(h.problem || h.cause || h.solution || h.comment) && (
                              <div className="text-[13px] text-[#5A6E85] bg-white p-2.5 rounded-[6px] border border-[#E2E8F0] space-y-1.5 mt-1.5 shadow-sm">
                                {h.problem && <div><span className="font-semibold text-gray-700">Vấn đề:</span> {h.problem}</div>}
                                {h.cause && <div><span className="font-semibold text-gray-700">Nguyên nhân:</span> {h.cause}</div>}
                                {h.solution && <div><span className="font-semibold text-gray-700">Giải pháp:</span> {h.solution}</div>}
                                {h.comment && <div><span className="font-semibold text-gray-700">Lời bình:</span> {h.comment}</div>}
                              </div>
                            )}
                            
                            <div className="flex gap-2 mt-2">
                                {h.confidence_level && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                    {h.confidence_level === 'not_confident' ? 'Không tự tin' : 
                                     h.confidence_level === 'lacking_confidence' ? 'Thiếu tự tin' : 
                                     h.confidence_level === 'very_confident' ? 'Rất tự tin' : 'Tự tin'}
                                  </span>
                                )}
                                {h.execution_speed && (
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                    {h.execution_speed === 'very_slow' ? 'Rất chậm' : 
                                     h.execution_speed === 'slow' ? 'Chậm' : 
                                     h.execution_speed === 'very_fast' ? 'Rất nhanh' : 'Nhanh'}
                                  </span>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#9CA3AF] italic text-center mt-6">
                        Chưa có lịch sử check-in nào.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
