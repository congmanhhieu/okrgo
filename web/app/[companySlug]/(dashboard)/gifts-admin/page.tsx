"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus, Search, Gift, Pencil, Trash2, X, ShieldAlert,
  Star, Package, Clock, CheckCircle2, XCircle, Truck, Upload
} from "lucide-react";
import { getImageUrl } from "@/lib/image";

// ===== TYPES =====
type GiftItem = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  star_price: number;
  category: string | null;
  is_active: boolean;
  created_at: string;
};

type GiftOrder = {
  id: number;
  user_id: number;
  user_name: string;
  gift_id: number;
  gift_name: string;
  quantity: number;
  star_cost: number;
  status: string;
  created_at: string;
};

const ORDER_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Chờ duyệt", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  rejected: { label: "Từ chối", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
  delivered: { label: "Đã giao", color: "bg-green-50 text-green-700 border-green-200", icon: Truck },
};

export default function GiftsAdminPage() {
  const params = useParams();
  const companySlug = params?.companySlug as string;
  const [activeTab, setActiveTab] = useState<"gifts" | "orders">("orders");

  // ===== GIFTS STATE =====
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftSearch, setGiftSearch] = useState("");

  // Gift Modal
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftModalMode, setGiftModalMode] = useState<"create" | "edit">("create");
  const [editGiftId, setEditGiftId] = useState<number | null>(null);
  
  const [formGiftName, setFormGiftName] = useState("");
  const [formGiftDesc, setFormGiftDesc] = useState("");
  const [formGiftImage, setFormGiftImage] = useState("");
  const [formGiftPrice, setFormGiftPrice] = useState(1);
  const [formGiftCategory, setFormGiftCategory] = useState("");
  const [formGiftIsActive, setFormGiftIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);

  // Gift Delete
  const [isGiftDeleteOpen, setIsGiftDeleteOpen] = useState(false);
  const [deleteGift, setDeleteGift] = useState<GiftItem | null>(null);

  // ===== ORDERS STATE =====
  const [orders, setOrders] = useState<GiftOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const orderLimit = 10;
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // ===== FETCH GIFTS =====
  const fetchGifts = async () => {
    setGiftsLoading(true);
    try {
      let query = "";
      if (giftSearch) {
        query = `?search=${encodeURIComponent(giftSearch)}`;
      }
      const res = await api.get(`/workspaces/${companySlug}/gifts${query}`);
      setGifts(res.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Lỗi tải kho quà");
    } finally {
      setGiftsLoading(false);
    }
  };

  // ===== FETCH ORDERS =====
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/workspaces/${companySlug}/gift-orders`);
      url.searchParams.append("page", orderPage.toString());
      url.searchParams.append("limit", orderLimit.toString());
      if (orderSearch) url.searchParams.append("search", orderSearch);
      if (orderStatusFilter !== "all") url.searchParams.append("status", orderStatusFilter);
      
      const token = localStorage.getItem("okrgo_token");
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders(data.data || []);
      setOrdersTotal(data.total || 0);
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải đơn quà");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "gifts") fetchGifts();
    else fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, orderPage, orderStatusFilter]);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (activeTab === "gifts") fetchGifts();
      else { setOrderPage(1); fetchOrders(); }
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftSearch, orderSearch]);

  // ===== GIFT CRUD =====
  const openCreateGift = () => {
    setGiftModalMode("create");
    setFormGiftName(""); 
    setFormGiftDesc(""); 
    setFormGiftImage("");
    setFormGiftPrice(1);
    setFormGiftCategory("");
    setFormGiftIsActive(true);
    setEditGiftId(null);
    setIsGiftModalOpen(true);
  };

  const openEditGift = (g: GiftItem) => {
    setGiftModalMode("edit");
    setEditGiftId(g.id);
    setFormGiftName(g.name);
    setFormGiftDesc(g.description || "");
    setFormGiftImage(g.image_url || "");
    setFormGiftPrice(g.star_price);
    setFormGiftCategory(g.category || "");
    setFormGiftIsActive(g.is_active);
    setIsGiftModalOpen(true);
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGiftName.trim()) { toast.error("Tên quà không được trống"); return; }
    try {
      const payload = {
        name: formGiftName,
        description: formGiftDesc || null,
        image_url: formGiftImage || null,
        star_price: formGiftPrice,
        category: formGiftCategory || null,
        is_active: formGiftIsActive,
      };

      if (giftModalMode === "create") {
        await api.post(`/workspaces/${companySlug}/gifts`, payload);
        toast.success("Tạo quà thành công");
      } else {
        await api.put(`/workspaces/${companySlug}/gifts/${editGiftId}`, payload);
        toast.success("Cập nhật thành công");
      }
      setIsGiftModalOpen(false);
      fetchGifts();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Lỗi lưu quà tặng"); 
    }
  };

  const confirmDeleteGift = async () => {
    if (!deleteGift) return;
    try {
      await api.delete(`/workspaces/${companySlug}/gifts/${deleteGift.id}`);
      toast.success("Đã xóa quà tặng");
      setIsGiftDeleteOpen(false); 
      setDeleteGift(null); 
      fetchGifts();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Lỗi xóa quà tặng"); 
    }
  };

  // ===== ORDER STATUS UPDATE =====
  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.put(`/workspaces/${companySlug}/gift-orders/${orderId}/status`, { status: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      fetchOrders();
    } catch (err: any) { 
      toast.error(err.response?.data?.error || "Lỗi cập nhật trạng thái"); 
    }
  };

  const orderTotalPages = Math.ceil(ordersTotal / orderLimit) || 1;

  return (
    <div className="p-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#1E2A3A]">Quản lý Kho Quà Tặng</h1>
          <p className="text-[14px] text-[#5A6E85] mt-1">Admin: Vận hành danh sách quà và xử lý đơn đổi quà bằng sao</p>
        </div>
        {activeTab === "gifts" && (
          <button
            onClick={openCreateGift}
            className="flex items-center space-x-2 bg-[#00b24e] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium hover:bg-[#009440] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm quà mới</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-[#F5F7FA] p-1 rounded-[10px] w-fit">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2 rounded-[8px] text-[13px] font-medium transition-all ${activeTab === "orders"
            ? "bg-white text-[#1E2A3A] shadow-sm"
            : "text-[#5A6E85] hover:text-[#1E2A3A]"
            }`}
        >
          <span className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Quản lý Đơn đổi quà ({ordersTotal})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("gifts")}
          className={`px-5 py-2 rounded-[8px] text-[13px] font-medium transition-all ${activeTab === "gifts"
            ? "bg-white text-[#1E2A3A] shadow-sm"
            : "text-[#5A6E85] hover:text-[#1E2A3A]"
            }`}
        >
          <span className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Danh mục Quà tặng</span>
          </span>
        </button>
      </div>

      {/* ==================== TAB: ORDERS ==================== */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-[#E2E8F0] bg-[#F9FBFD] flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Tìm theo tên người đổi, tên quà..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
              />
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => { setOrderStatusFilter(e.target.value); setOrderPage(1); }}
              className="border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[13px] text-[#1E2A3A] outline-none hover:border-[#CBD5E1] transition-colors cursor-pointer bg-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt (Đang giao)</option>
              <option value="delivered">Đã giao thành công</option>
              <option value="rejected">Từ chối (Hủy)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Người đổi quà</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Tên quà</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Số lượng</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Tổng phạt (Sao)</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Cập nhật Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e] mx-auto"></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package className="w-8 h-8 text-[#9CA3AF]" />
                      </div>
                      <p className="text-[#1E2A3A] font-medium">Chưa có lượt đổi quà nào</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
                    const StIcon = st.icon;
                    return (
                      <tr key={o.id} className="hover:bg-[#F9FBFD] transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[14px] font-medium text-[#1E2A3A] hover:underline cursor-pointer">{o.user_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[14px] text-[#1E2A3A] font-semibold">{o.gift_name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[14px] font-semibold text-[#1E2A3A] bg-[#F1F5F9] px-2 py-1 rounded">{o.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[14px] font-bold text-amber-600 flex items-center justify-center">
                             {o.star_cost} <Star className="w-3.5 h-3.5 ml-1 fill-current" />
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] text-[#5A6E85]">
                            {new Date(o.created_at).toLocaleString("vi-VN")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block w-full max-w-[140px]">
                            <select
                              value={o.status}
                              onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                              className={`w-full appearance-none pl-8 pr-6 py-1.5 rounded-full border text-[13px] font-semibold cursor-pointer outline-none transition-colors ${st.color}`}
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="approved">Đã duyệt</option>
                              <option value="delivered">Đã giao</option>
                              <option value="rejected">Từ chối</option>
                            </select>
                            <StIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersTotal > 0 && (
            <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between text-[13px]">
              <span className="text-[#5A6E85]">
                Hiển thị {(orderPage - 1) * orderLimit + 1} đến {Math.min(orderPage * orderLimit, ordersTotal)} trong số {ordersTotal}
              </span>
              <div className="flex space-x-1">
                <button disabled={orderPage === 1} onClick={() => setOrderPage(p => p - 1)} className="px-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-[#1E2A3A] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Trước</button>
                <button disabled={orderPage === orderTotalPages} onClick={() => setOrderPage(p => p + 1)} className="px-3 py-1.5 border border-[#E2E8F0] rounded-[6px] text-[#1E2A3A] hover:bg-[#F5F7FA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Sau</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: GIFTS ==================== */}
      {activeTab === "gifts" && (
        <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-[#E2E8F0] bg-[#F9FBFD] flex justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Tìm món quà trong kho..."
                value={giftSearch}
                onChange={(e) => setGiftSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F1F5F9]">
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider w-16">Ảnh</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Tên quà & Mô tả</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Phân loại</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider">Giá sao</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-[#5A6E85] uppercase tracking-wider text-right">Quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {giftsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#E2E8F0] border-t-[#00b24e] mx-auto"></div>
                    </td>
                  </tr>
                ) : gifts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Gift className="w-8 h-8 text-[#9CA3AF]" />
                      </div>
                      <p className="text-[#1E2A3A] font-medium">Chưa có quà tặng nào trong kho</p>
                    </td>
                  </tr>
                ) : (
                  gifts.map((g) => (
                    <tr key={g.id} className={`hover:bg-[#F9FBFD] transition-colors group ${!g.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        {g.image_url ? (
                          <img src={getImageUrl(g.image_url)} alt={g.name} className="w-12 h-12 rounded-[8px] object-cover border border-[#E2E8F0]" />
                        ) : (
                          <div className="w-12 h-12 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center">
                            <Gift className="w-5 h-5 text-[#9CA3AF]" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[250px]">
                        <span className="text-[14px] font-bold text-[#1E2A3A] line-clamp-1">{g.name}</span>
                        <span className="text-[12px] text-[#5A6E85] line-clamp-2 mt-0.5">
                          {g.description || <span className="italic">Chưa có mô tả</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {g.category ? (
                          <span className="text-[12px] bg-[#E2E8F0] text-[#475569] px-2 py-1 rounded font-medium">{g.category}</span>
                        ) : (
                          <span className="text-[12px] text-[#9CA3AF] italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 border border-amber-200 bg-amber-50 rounded-full px-3 py-1 w-fit">
                          <span className="text-[14px] font-bold text-amber-600">{g.star_price}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {g.is_active ? (
                          <span className="text-[12px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">Đang bán</span>
                        ) : (
                          <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">Đã ẩn</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => openEditGift(g)} className="p-2 text-[#5A6E85] hover:text-[#00b24e] hover:bg-[#E6F7ED] rounded-[8px] transition-colors" title="Sửa kho">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeleteGift(g); setIsGiftDeleteOpen(true); }} className="p-2 text-[#5A6E85] hover:text-red-600 hover:bg-red-50 rounded-[8px] transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== GIFT CREATE/EDIT MODAL ===== */}
      {isGiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[16px] w-full max-w-lg shadow-2xl overflow-hidden zoom-in-95 animate-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F9FBFD] shrink-0">
              <h3 className="text-[18px] font-bold text-[#1E2A3A] flex items-center">
                {giftModalMode === "create" ? "Thêm Quà Tặng Mới" : "Cập nhật Thông tin kho"}
              </h3>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-[#9CA3AF] hover:text-[#1E2A3A] bg-gray-100 p-1.5 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveGift} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Tên hiện vật <span className="text-red-500">*</span></label>
                <input type="text" required value={formGiftName} onChange={(e) => setFormGiftName(e.target.value)} autoFocus
                  placeholder="VD: Cốc sứ in logo công ty..."
                  className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]" />
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">Đơn giá xuất kho (Sao) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" min={1} required value={formGiftPrice} onChange={(e) => setFormGiftPrice(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-[#E2E8F0] pl-10 pr-3 py-2.5 rounded-[8px] text-[14px] font-bold text-amber-600 outline-none focus:border-[#00b24e] transition-colors" />
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-[13px] font-medium text-[#1E2A3A]">Phân loại chủng loại</label>
                  <input type="text" value={formGiftCategory} onChange={(e) => setFormGiftCategory(e.target.value)}
                    placeholder="VD: Quần áo, Gia dụng..."
                    className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF]" />
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-shrink-0 flex items-center justify-between bg-gray-50 border border-gray-200 p-2.5 rounded-[8px] w-36 cursor-pointer" onClick={() => setFormGiftIsActive(!formGiftIsActive)}>
                  <span className="text-[13px] font-semibold text-gray-700">Mở bán:</span>
                  <div className={`w-[40px] h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${formGiftIsActive ? "bg-[#00b24e]" : "bg-gray-300"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${formGiftIsActive ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Mô tả</label>
                <textarea value={formGiftDesc} onChange={(e) => setFormGiftDesc(e.target.value)}
                  placeholder="Mô tả kỹ hơn về công dụng quà tặng..." rows={3}
                  className="w-full border border-[#E2E8F0] px-3 py-2.5 rounded-[8px] text-[14px] outline-none focus:border-[#00b24e] transition-colors placeholder:text-[#9CA3AF] resize-none" />
              </div>

              <div className="space-y-1.5 pb-2">
                <label className="text-[13px] font-medium text-[#1E2A3A]">Ảnh đại diện quà tặng</label>
                <div className="flex flex-col space-y-3">
                  {formGiftImage && (
                    <div className="relative w-32 h-32 rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-sm group">
                      <img src={getImageUrl(formGiftImage)} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setFormGiftImage("")} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  )}
                  
                  {!formGiftImage && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#CBD5E1] rounded-[12px] cursor-pointer hover:border-[#00b24e] hover:bg-[#F0FFF5] transition-colors group">
                      <Upload className="w-6 h-6 text-[#9CA3AF] group-hover:text-[#00b24e] mb-2 transition-colors" />
                      <span className="text-[14px] font-medium text-[#5A6E85] group-hover:text-[#00b24e] transition-colors">Tải ảnh lên (Max 5MB)</span>
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh quá lớn, tối đa 5MB"); return; }
                        setIsUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("image", file);
                          const res = await api.post(`/workspaces/${companySlug}/gifts/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
                          setFormGiftImage(res.data.url);
                          toast.success("Đã tải ảnh lên");
                        } catch (err: any) { toast.error("Tải ảnh thất bại"); }
                        finally { setIsUploading(false); e.target.value = ''; }
                      }}/>
                    </label>
                  )}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-[#E2E8F0] bg-gray-50 flex space-x-3 shrink-0">
              <button type="button" onClick={() => setIsGiftModalOpen(false)}
                className="flex-1 py-3 border border-[#CBD5E1] bg-white rounded-[10px] text-[14px] font-bold text-[#475569] hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm">
                Đóng
              </button>
              <button type="submit" onClick={handleSaveGift}
                className="flex-[2] py-3 bg-[#00b24e] text-white rounded-[10px] text-[14px] font-bold hover:bg-[#009440] transition-all shadow-md">
                Lưu lại Thông Tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== GIFT DELETE MODAL ===== */}
      {isGiftDeleteOpen && deleteGift && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-[16px] w-full max-w-sm p-6 text-center shadow-2xl zoom-in-95 animate-in">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-[20px] font-bold text-[#1E2A3A] mb-2">Thủ tiêu kỷ vật?</h3>
            <p className="text-[14px] text-[#5A6E85] mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-[#1E2A3A] block my-1">"{deleteGift.name}"</strong> khỏi kho hàng?
              Hành động này hoàn toàn không thể phục hồi.
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setIsGiftDeleteOpen(false); setDeleteGift(null); }}
                className="flex-1 py-2.5 bg-gray-100 text-[#475569] font-bold text-[14px] rounded-[10px] border border-gray-200 hover:bg-gray-200 transition-all">Quay đầu là bờ</button>
              <button onClick={confirmDeleteGift}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold text-[14px] rounded-[10px] hover:bg-red-700 shadow-md transition-all">Xóa Ngay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
