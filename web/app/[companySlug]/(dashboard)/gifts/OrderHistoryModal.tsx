import { useState, useEffect } from "react";
import { X, Package, CheckCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function OrderHistoryModal({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const slug = window.location.pathname.split('/')[1];
        const res = await api.get(`/workspaces/${slug}/gifts/my-orders`);
        setOrders(res.data || []);
      } catch (err) {
        toast.error("Lỗi lấy lịch sử quà tặng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FEF3C7]"><Clock className="w-3.5 h-3.5" /> Chờ xử lý</span>;
      case "approved": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE]"><CheckCircle className="w-3.5 h-3.5" /> Đã duyệt (Đang giao)</span>;
      case "delivered": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]"><Package className="w-3.5 h-3.5" /> Đã nhận quà</span>;
      case "rejected": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]"><X className="w-3.5 h-3.5" /> Bị huỷ</span>;
      default: return <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-full">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-[600px] mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <h2 className="text-[18px] font-bold text-[#1E2A3A] flex items-center"><Package className="w-5 h-5 mr-2 text-[#00b24e]" /> Lịch sử đổi quà</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F1F5F9] rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-[#9CA3AF]">Đang tải lịch sử...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-[#5A6E85]">Bạn chưa đổi món quà nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[#E2E8F0] rounded-[12px] bg-[#F8FAFC]">
                  <div>
                    <div className="font-semibold text-[#1E2A3A] text-[15px]">{order.gift_name}</div>
                    <div className="text-[13px] text-[#5A6E85] mt-1 space-x-3">
                      <span>Số lượng: <strong className="text-[#1E2A3A]">{order.quantity}</strong></span>
                      <span>Mức tiêu phí: <strong className="text-[#F59E0B]">{order.star_cost} Sao</strong></span>
                    </div>
                    <div className="text-[12px] text-[#9CA3AF] mt-1">
                      Ngày đổi: {new Date(order.created_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
