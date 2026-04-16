"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, MessageCircle, Send, User, ChevronRight, Target, LayoutList, Inbox } from "lucide-react";
import { FeedbackFormModal } from "./FeedbackFormModal";

type FeedbackItem = {
  id: number;
  sender_id: number;
  sender_name: string;
  receiver_id: number;
  receiver_name: string;
  content: string;
  advice?: string;
  linked_objective_id?: number;
  objective_name?: string;
  linked_kr_id?: number;
  kr_name?: string;
  linked_task_id?: number;
  task_title?: string;
  created_at: string;
};

export default function FeedbacksPage() {
  const params = useParams();
  const slug = params?.companySlug as string;

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [showForm, setShowForm] = useState(false);

  // Dropdown data
  const [staff, setStaff] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${slug}/feedbacks?type=${tab}`);
      setFeedbacks(res.data || []);
    } catch { toast.error("Lỗi tải phản hồi"); }
    finally { setLoading(false); }
  };

  const fetchDropdowns = async () => {
    try {
      const [sRes, oRes, tRes] = await Promise.all([
        api.get(`/workspaces/${slug}/staff?limit=200`),
        api.get(`/workspaces/${slug}/okrs?limit=200`),
        api.get(`/workspaces/${slug}/tasks?limit=200`)
      ]);
      setStaff((sRes.data || []).map((s: any) => ({ user_id: s.user_id, name: s.name })));
      setObjectives((oRes.data || []).map((o: any) => ({ id: o.id, name: o.name, key_results: o.key_results || [] })));
      setTasks(tRes.data || []);
    } catch { }
  };

  useEffect(() => { fetchFeedbacks(); }, [slug, tab]);
  useEffect(() => { fetchDropdowns(); }, [slug]);

  const handleSave = async (data: any) => {
    try {
      await api.post(`/workspaces/${slug}/feedbacks`, data);
      toast.success("Đã gửi phản hồi");
      setShowForm(false);
      fetchFeedbacks();
    } catch { toast.error("Lỗi gửi phản hồi"); }
  };

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Phản hồi (Feedback)</h1>
          <p className="text-[#5A6E85] mt-1 text-[15px]">Giao tiếp minh bạch, xây dựng để cùng phát triển</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-[#009b43] transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Gửi phản hồi
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-[10px] mb-6 w-max">
        <button onClick={() => setTab("received")} className={`flex items-center gap-2 px-5 py-2 rounded-[8px] text-[14px] font-medium transition-all ${tab === "received" ? "bg-white text-[#1E2A3A] shadow-sm" : "text-[#5A6E85] hover:text-[#1E2A3A]"}`}>
          <Inbox className="w-4 h-4" /> Nhận được
        </button>
        <button onClick={() => setTab("sent")} className={`flex items-center gap-2 px-5 py-2 rounded-[8px] text-[14px] font-medium transition-all ${tab === "sent" ? "bg-white text-[#1E2A3A] shadow-sm" : "text-[#5A6E85] hover:text-[#1E2A3A]"}`}>
          <Send className="w-4 h-4" /> Đã gửi
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[#9CA3AF]">Đang tải...</div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-sm">
            <MessageCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-[18px] font-medium text-[#1E2A3A]">Chưa có phản hồi nào</h3>
            <p className="text-[#5A6E85] mt-2 text-[14px]">Trống</p>
          </div>
        ) : (
          feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5] font-bold text-[14px]">
                    {(tab === "received" ? fb.sender_name : fb.receiver_name)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1E2A3A]">
                      {tab === "received" ? (
                        <>Tới từ <span className="text-[#00b24e]">{fb.sender_name}</span></>
                      ) : (
                        <>Gửi tới <span className="text-[#3B82F6]">{fb.receiver_name}</span></>
                      )}
                    </div>
                    <div className="text-[12px] text-[#9CA3AF]">{formatDate(fb.created_at)}</div>
                  </div>
                </div>
              </div>

              <div className="text-[14px] text-[#1E2A3A] leading-relaxed whitespace-pre-wrap mb-4">
                {fb.content}
              </div>

              {fb.advice && (
                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[8px] p-3 mb-4">
                  <h4 className="text-[12px] font-bold text-[#D97706] mb-1 flex items-center"><MessageCircle className="w-3.5 h-3.5 mr-1" /> Lời khuyên & Hướng dẫn:</h4>
                  <p className="text-[13px] text-[#B45309] leading-relaxed whitespace-pre-wrap">{fb.advice}</p>
                </div>
              )}

              {(fb.objective_name || fb.task_title) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[12px] font-medium text-[#9CA3AF]">Liên kết:</span>
                  {fb.objective_name && (
                    <span className="inline-flex items-center text-[12px] bg-[#EFF6FF] text-[#3B82F6] px-2 py-1 rounded-md border border-[#DBEAFE]">
                      <Target className="w-3 h-3 mr-1" />
                      {fb.objective_name} {fb.kr_name ? <><ChevronRight className="w-3 h-3 mx-0.5" />{fb.kr_name}</> : ""}
                    </span>
                  )}
                  {fb.task_title && (
                    <span className="inline-flex items-center text-[12px] bg-[#F1F5F9] text-[#5A6E85] px-2 py-1 rounded-md border border-[#E2E8F0]">
                      <LayoutList className="w-3 h-3 mr-1" /> {fb.task_title}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showForm && <FeedbackFormModal staff={staff} objectives={objectives} tasks={tasks} onSave={handleSave} onClose={() => setShowForm(false)} />}
    </div>
  );
}
