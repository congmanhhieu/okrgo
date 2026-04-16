"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Award, Star, Trophy, Users, Heart } from "lucide-react";
import { KudoFormModal } from "./KudoFormModal";
import { getImageUrl } from "@/lib/image";

type KudoItem = {
  id: number;
  sender_name: string;
  receiver_name: string;
  content: string;
  stars_attached: number;
  criteria_name?: string;
  criteria_category?: string;
  reference_text?: string;
  sender_avatar?: string;
  receiver_avatar?: string;
  created_at: string;
};

type LeaderboardItem = {
  user_id: number;
  user_name: string;
  total_kudos: number;
  total_stars: number;
  user_avatar?: string;
};

export default function KudosPage() {
  const params = useParams();
  const slug = params?.companySlug as string;

  const [kudos, setKudos] = useState<KudoItem[]>([]);
  const [board, setBoard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Dropdown data
  const [staff, setStaff] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kRes, bRes] = await Promise.all([
        api.get(`/workspaces/${slug}/kudos`),
        api.get(`/workspaces/${slug}/kudos/leaderboard`)
      ]);
      setKudos(kRes.data || []);
      setBoard(bRes.data || []);
    } catch { toast.error("Lỗi tải bảng vinh danh"); }
    finally { setLoading(false); }
  };

  const fetchDropdowns = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.get(`/workspaces/${slug}/staff?limit=200`),
        api.get(`/workspaces/${slug}/star-criteria`)
      ]);
      setStaff((sRes.data || []).map((s: any) => ({ user_id: s.user_id, name: s.name })));
      setCriteria(cRes.data || []);
    } catch { }
  };

  useEffect(() => { fetchData(); fetchDropdowns(); }, [slug]);

  const handleSave = async (data: any) => {
    try {
      await api.post(`/workspaces/${slug}/kudos`, data);
      toast.success("Đã gửi Kudo vinh danh");
      setShowForm(false);
      fetchData(); // Refresh board and feed
    } catch { toast.error("Lỗi gửi Kudo"); }
  };

  const formatDistanceToNow = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60000) return "Vừa xong";
    if (ms < 3600000) return `${Math.floor(ms / 60000)} phút trước`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)} giờ trước`;
    return `${Math.floor(ms / 86400000)} ngày trước`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#1E2A3A] tracking-tight">Kudo Box: Vinh danh & Ghi nhận</h1>
          <p className="text-[#5A6E85] mt-1 text-[15px]">Cảm ơn và trân trọng những đóng góp của đồng nghiệp</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-[#009b43] transition-colors flex items-center shadow-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Gửi Kudo mới
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Feed Column */}
        <div className="flex-1">
          <h2 className="text-[18px] font-bold text-[#1E2A3A] mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-[#00b24e]" /> Dòng sự kiện</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-[#9CA3AF]">Đang tải...</div>
            ) : kudos.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-sm">
                <Heart className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
                <h3 className="text-[18px] font-medium text-[#1E2A3A]">Chưa có ghi nhận nào</h3>
                <p className="text-[#5A6E85] mt-2 text-[14px]">Hãy là người đầu tiên gửi Kudo thay lời cảm ơn!</p>
              </div>
            ) : (
              kudos.map((k) => (
                <div key={k.id} className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {k.sender_avatar ? (
                      <img src={getImageUrl(k.sender_avatar)} alt={k.sender_name} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00b24e] to-[#34D399] flex items-center justify-center text-white font-bold text-[16px] shadow-inner shrink-0 leading-none">
                        {k.sender_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-[15px]">
                          <span className="font-semibold text-[#1E2A3A]">{k.sender_name}</span>
                          <span className="text-[#5A6E85] mx-1">đã gửi vinh danh tới</span>
                          <span className="font-bold text-[#00b24e]">{k.receiver_name}</span>
                        </div>
                        <div className="text-[12px] text-[#9CA3AF] whitespace-nowrap">{formatDistanceToNow(k.created_at)}</div>
                      </div>

                      {/* Criteria Tag */}
                      {k.criteria_name && (
                        <div className="mt-2 inline-flex items-center bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[6px]">
                          <Award className="w-3.5 h-3.5 text-[#D97706] mr-1.5" />
                          <span className="text-[12px] font-medium text-[#1E2A3A]">{k.criteria_name}</span>
                          {k.reference_text && (
                            <>
                              <span className="mx-1.5 text-[#9CA3AF]">•</span>
                              <span className="text-[12px] text-[#5A6E85] truncate max-w-[200px]">{k.reference_text}</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="mt-3 text-[14.5px] text-[#1E2A3A] leading-relaxed whitespace-pre-wrap">
                        {k.content}
                      </div>

                      {k.stars_attached > 0 && (
                        <div className="mt-3 flex items-center text-[13px] font-bold text-[#F59E0B] bg-[#FFFBEB] w-max px-3 py-1.5 rounded-full">
                          <Star className="w-4 h-4 mr-1 fill-current" /> +{k.stars_attached} Sao
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Leaderboard */}
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden sticky top-8">
            <div className="bg-[#00b24e] p-5 text-white flex items-center relative overflow-hidden">
              <Trophy className="w-6 h-6 mr-2 relative z-10" />
              <h3 className="font-bold text-[16px] relative z-10">Bảng vàng (Tháng này)</h3>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            </div>

            <div className="p-2">
              {board.length === 0 ? (
                <div className="py-8 text-center text-[#9CA3AF] text-[13px] flex flex-col items-center">
                  <span className="text-[24px] mb-2">🏆</span>
                  Chưa có dữ liệu xếp hạng
                </div>
              ) : (
                board.map((u, idx) => (
                  <div key={u.user_id} className="flex items-center gap-3 p-3 hover:bg-[#F8FAFC] rounded-[10px] transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-100 text-gray-500' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-[#9CA3AF]'}`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {u.user_avatar ? (
                        <img src={getImageUrl(u.user_avatar)} alt={u.user_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#5A6E85] font-bold text-[13px] shrink-0 leading-none">
                          {u.user_name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[#1E2A3A] truncate">{u.user_name}</div>
                        <div className="text-[12px] text-[#5A6E85]">{u.total_kudos} lượt ghi nhận</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center text-[13px] font-bold text-[#F59E0B]">
                        {u.total_stars} <Star className="w-3.5 h-3.5 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showForm && <KudoFormModal staff={staff} criteria={criteria} onSave={handleSave} onClose={() => setShowForm(false)} />}
    </div>
  );
}
