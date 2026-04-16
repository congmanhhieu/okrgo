"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Target, Users, Gift, CheckSquare } from "lucide-react";

type DashboardData = {
  progress: { red: number; yellow: number; green: number };
  checkin_status: { on_time: number; late: number };
  confidence: { not_confident: number; lacking_confidence: number; confident: number; very_confident: number };
  execution_speed: { very_slow: number; slow: number; fast: number; very_fast: number };
  trends: { label: string; feedbacks: number; kudos: number }[];
  summary: { total_objectives: number; total_staff: number; total_kudos_given: number; total_tasks: number };
};

export default function DashboardPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endpoint = selectedDept 
          ? `/workspaces/${companySlug}/dashboard?department_id=${selectedDept}` 
          : `/workspaces/${companySlug}/dashboard`;
          
        const [res, deptRes] = await Promise.all([
          api.get(endpoint),
          departments.length === 0 ? api.get(`/workspaces/${companySlug}/departments`) : Promise.resolve({ data: departments })
        ]);
        
        setData(res); // api.get returns the JSON directly
        if (departments.length === 0 && deptRes.data) {
          setDepartments(deptRes.data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard metrics", e);
      } finally {
        setLoading(false);
      }
    };
    if (companySlug) fetchData();
  }, [companySlug, selectedDept]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#00b24e] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) return null;

  // Formatting data for Charts
  const progressData = [
    {
      name: "Tỷ lệ hoàn thành Mục tiêu (OKRs)",
      Red: data.progress.red,
      Yellow: data.progress.yellow,
      Green: data.progress.green,
    }
  ];

  const checkinData = [
    { name: "Đúng hạn", value: data.checkin_status.on_time },
    { name: "Sai hạn (Trễ)", value: data.checkin_status.late },
  ];
  const COLORS = ["#10b981", "#ef4444"]; // Green for on_time, Red for late

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E2A3A]">Tổng quan tổ chức</h1>
          <p className="text-[#5A6E85] mt-1">Nắm bắt tiến trình và nhịp đập giao tiếp của hệ thống</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[#5A6E85]">Phòng ban:</span>
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-[14px] font-medium border border-[#E2E8F0] rounded-[8px] bg-white text-[#1E2A3A] min-w-[200px] shadow-sm outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e]"
          >
            <option value="">Tất cả (Công ty)</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#5A6E85]">Mục tiêu đang chạy</p>
            <h3 className="text-2xl font-bold text-[#1E2A3A]">{data.summary.total_objectives}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#5A6E85]">Nhân sự tham gia</p>
            <h3 className="text-2xl font-bold text-[#1E2A3A]">{data.summary.total_staff}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#5A6E85]">Lượt vinh danh (tháng)</p>
            <h3 className="text-2xl font-bold text-[#1E2A3A]">{data.summary.total_kudos_given}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#5A6E85]">Tổng công việc (Tasks)</p>
            <h3 className="text-2xl font-bold text-[#1E2A3A]">{data.summary.total_tasks}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Chart */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-[#1E2A3A] mb-1">Tiến độ hoàn thành mục tiêu</h2>
          <p className="text-[13px] text-[#5A6E85] mb-6">Phân phổ các mục tiêu (OKRs) theo tiến độ hiện tại.</p>
          
          <div className="mt-2">
            {(() => {
              const totalObj = data.progress.red + data.progress.yellow + data.progress.green;
              if (totalObj === 0) return <p className="text-sm text-gray-400">Chưa có dữ liệu OKR</p>;
              
              const segments = [
                { value: data.progress.red, label: "Kém (<40%)", bgClass: "bg-[#ef4444]" },
                { value: data.progress.yellow, label: "Cần cải thiện (40-70%)", bgClass: "bg-[#f59e0b]" },
                { value: data.progress.green, label: "Tốt (>=70%)", bgClass: "bg-[#10b981]" }
              ];

              return (
                <div className="space-y-4">
                  <div className="flex h-3 w-full rounded-[4px] overflow-hidden bg-[#F1F5F9]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${(seg.value / totalObj) * 100}%` }}
                        className={`h-full ${seg.bgClass} transition-all duration-500`}
                        title={`${seg.label}: ${seg.value}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${seg.bgClass}`}></div>
                        <span className="text-[13px] font-medium text-[#1E2A3A]">{seg.label}</span>
                        <span className="text-[13px] text-[#9CA3AF]">
                          {Math.round((seg.value / totalObj) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Checkin Status */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-[#1E2A3A] mb-1">Tình trạng chuyên cần (Check-in)</h2>
          <p className="text-[13px] text-[#5A6E85] mb-6">Tỷ lệ các kết quả then chốt được cập nhật đúng hạn.</p>
          
          <div className="mt-2">
            {(() => {
              const checkinTotal = data.checkin_status.on_time + data.checkin_status.late;
              if (checkinTotal === 0) return <p className="text-sm text-gray-400">Chưa có dữ liệu KR để kiểm tra tiến độ</p>;
              
              const segments = [
                { value: data.checkin_status.on_time, label: "Đúng hạn", bgClass: "bg-[#0ea5e9]" },
                { value: data.checkin_status.late, label: "Sai hạn (Trễ)", bgClass: "bg-[#f43f5e]" }
              ];

              return (
                <div className="space-y-4">
                  <div className="flex h-3 w-full rounded-[4px] overflow-hidden bg-[#F1F5F9]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${(seg.value / checkinTotal) * 100}%` }}
                        className={`h-full ${seg.bgClass} transition-all duration-500`}
                        title={`${seg.label}: ${seg.value}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${seg.bgClass}`}></div>
                        <span className="text-[13px] font-medium text-[#1E2A3A]">{seg.label}</span>
                        <span className="text-[13px] text-[#9CA3AF]">
                          {Math.round((seg.value / checkinTotal) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Confidence Stats */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-[#1E2A3A] mb-1">Mức độ tự tin hoàn thành KR</h2>
          <p className="text-[13px] text-[#5A6E85] mb-6">Đánh giá chung qua các lần Check-in mới nhất.</p>
          
          <div className="mt-2">
            {(() => {
              const confTotal = data.confidence.not_confident + data.confidence.lacking_confidence + data.confidence.confident + data.confidence.very_confident;
              if (confTotal === 0) return <p className="text-sm text-gray-400">Chưa có dữ liệu Check-in</p>;
              
              const segments = [
                { value: data.confidence.not_confident, label: "Không tự tin", bgClass: "bg-[#ef4444]" },
                { value: data.confidence.lacking_confidence, label: "Thiếu tự tin", bgClass: "bg-[#f59e0b]" },
                { value: data.confidence.confident, label: "Tự tin", bgClass: "bg-[#3b82f6]" },
                { value: data.confidence.very_confident, label: "Rất tự tin", bgClass: "bg-[#10b981]" }
              ];

              return (
                <div className="space-y-4">
                  <div className="flex h-3 w-full rounded-[4px] overflow-hidden bg-[#F1F5F9]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${(seg.value / confTotal) * 100}%` }}
                        className={`h-full ${seg.bgClass} transition-all duration-500`}
                        title={`${seg.label}: ${seg.value}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${seg.bgClass}`}></div>
                        <span className="text-[13px] font-medium text-[#1E2A3A]">{seg.label}</span>
                        <span className="text-[13px] text-[#9CA3AF]">
                          {Math.round((seg.value / confTotal) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Execution Speed Stats */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm flex flex-col justify-center">
          <h2 className="text-[16px] font-bold text-[#1E2A3A] mb-1">Tốc độ thực hiện mục tiêu</h2>
          <p className="text-[13px] text-[#5A6E85] mb-6">Tốc độ tiến triển dựa trên lần báo cáo gần nhất.</p>
          
          <div className="mt-2">
            {(() => {
              const speedTotal = data.execution_speed.very_slow + data.execution_speed.slow + data.execution_speed.fast + data.execution_speed.very_fast;
              if (speedTotal === 0) return <p className="text-sm text-gray-400">Chưa có dữ liệu Check-in</p>;
              
              const segments = [
                { value: data.execution_speed.very_slow, label: "Rất chậm", bgClass: "bg-[#ef4444]" },
                { value: data.execution_speed.slow, label: "Chậm", bgClass: "bg-[#f59e0b]" },
                { value: data.execution_speed.fast, label: "Nhanh", bgClass: "bg-[#3b82f6]" },
                { value: data.execution_speed.very_fast, label: "Rất nhanh", bgClass: "bg-[#10b981]" }
              ];

              return (
                <div className="space-y-4">
                  <div className="flex h-3 w-full rounded-[4px] overflow-hidden bg-[#F1F5F9]">
                    {segments.map((seg, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${(seg.value / speedTotal) * 100}%` }}
                        className={`h-full ${seg.bgClass} transition-all duration-500`}
                        title={`${seg.label}: ${seg.value}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {segments.map((seg, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${seg.bgClass}`}></div>
                        <span className="text-[13px] font-medium text-[#1E2A3A]">{seg.label}</span>
                        <span className="text-[13px] text-[#9CA3AF]">
                          {Math.round((seg.value / speedTotal) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Communication Trends */}
        <div className="bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm lg:col-span-2 flex flex-col h-[400px]">
          <h2 className="text-[16px] font-bold text-[#1E2A3A] mb-1">Biểu đồ tương tác và văn hóa (7 ngày qua)</h2>
          <p className="text-[13px] text-[#5A6E85] mb-6">Nhịp độ các cuộc trò chuyện, cập nhật trạng thái làm việc và vinh danh nhau giữa các cá nhân, thành viên công ty.</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trends} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} dy={10} tick={{ fontSize: 12, fill: '#5A6E85' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#5A6E85' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Legend iconType="circle" />
                <Line type="monotone" name="Lượt Phản hồi (Feedback)" dataKey="feedbacks" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Lượt Vinh danh (Kudo)" dataKey="kudos" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
