"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Gift, Star, ShoppingCart, Search, Plus, Minus, PackageX, Trash2 } from "lucide-react";
import { getImageUrl } from "@/lib/image";
import { OrderHistoryModal } from "./OrderHistoryModal";

type GiftItem = {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  star_price: number;
  category?: string;
};

type CartItem = GiftItem & { quantity: number };

export default function GiftsPage() {
  const params = useParams();
  const slug = params?.companySlug as string;

  const [starsBalance, setStarsBalance] = useState(0);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/workspaces/${slug}/users/me`);
      setStarsBalance(res.data?.stars_balance || 0);
    } catch { }
  };

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workspaces/${slug}/gifts?search=${encodeURIComponent(search)}`);
      setGifts(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách quà tặng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchGifts();
  }, [slug, search]);

  const addToCart = (gift: GiftItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === gift.id);
      if (existing) {
        return prev.map(item => item.id === gift.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...gift, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQ) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalCost = cart.reduce((sum, item) => sum + item.star_price * item.quantity, 0);
  const canCheckout = cart.length > 0 && totalCost <= starsBalance;

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({ gift_id: item.id, quantity: item.quantity }))
      };
      await api.post(`/workspaces/${slug}/gifts/redeem`, payload);
      toast.success("Đổi quà thành công! Bạn có thể xem lại trong luồng Lịch sử.");
      setCart([]);
      fetchProfile();
      fetchGifts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Lỗi khi đổi quà");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8">
      {/* Cột trái: Quà tặng */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-[16px] border border-[#E2E8F0] shadow-sm">
          <div>
            <h1 className="text-[24px] font-bold text-[#1E2A3A] flex items-center">
              <Gift className="w-7 h-7 mr-2 text-[#00b24e]" /> Kho Quà Tặng
            </h1>
            <p className="text-[#5A6E85] mt-1 text-[14px]">Sử dụng số Sao bạn tích luỹ được để quy đổi thành hiện vật</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex items-center gap-2 bg-[#FFFBEB] border border-[#FEF3C7] px-4 py-2.5 rounded-[12px]">
              <span className="text-[14px] text-[#92400E] font-medium">Số dư khả dụng:</span>
              <span className="text-[20px] font-bold text-[#F59E0B] flex items-center">
                {starsBalance} <Star className="w-5 h-5 ml-1 fill-current" />
              </span>
            </div>
            <button onClick={() => setShowHistoryModal(true)} className="text-[13px] text-[#00b24e] font-semibold hover:underline">
              Xem lịch sử quy đổi
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Tìm tên món quà..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E2E8F0] rounded-[10px] text-[14px] focus:outline-none focus:border-[#00b24e] focus:ring-1 focus:ring-[#00b24e]"
            />
          </div>
        </div>

        {/* Grid Quà Tặng */}
        {loading ? (
          <div className="text-center py-16 text-[#9CA3AF]">Đang tải kho quà...</div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-[16px]">
            <PackageX className="w-12 h-12 text-[#CBD5E1] mx-auto mb-4" />
            <h3 className="text-[16px] font-semibold text-[#1E2A3A]">Chưa có món quà nào</h3>
            <p className="text-[#9CA3AF] text-[14px] mt-1">Kho quà hiện đang trống hoặc đang cập nhật.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {gifts.map(item => (
              <div key={item.id} className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group">
                <div className="aspect-[4/3] bg-[#F1F5F9] relative overflow-hidden flex items-center justify-center p-4">
                  {item.image_url ? (
                    <img src={getImageUrl(item.image_url)} alt={item.name} className="object-contain w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform" />
                  ) : (
                    <Gift className="w-16 h-16 text-[#CBD5E1]" />
                  )}
                  {item.category && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded border border-[#E2E8F0] text-[11px] font-semibold text-[#5A6E85] uppercase tracking-wider">
                      {item.category}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-[#1E2A3A] text-[15px] line-clamp-2 min-h-[44px]">{item.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex flex-col">
                      <span className="text-[16px] font-bold text-[#F59E0B] flex items-center">
                        {item.star_price} <Star className="w-4 h-4 ml-1 fill-current" />
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="px-4 py-2 bg-[#00b24e] text-white text-[13px] font-semibold rounded-[8px] hover:bg-[#009b43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Đổi ngay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cột phải: Sidebar Giỏ Quà */}
      <div className="w-full lg:w-[350px] shrink-0">
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm sticky top-8 flex flex-col max-h-[calc(100vh-64px)]">
          <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#1E2A3A]" />
            <h2 className="font-bold text-[16px] text-[#1E2A3A]">Giỏ quà của bạn</h2>
            {cart.length > 0 && (
              <span className="ml-auto bg-[#4F46E5] text-white text-[12px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {cart.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center opacity-50">
                <ShoppingCart className="w-10 h-10 text-[#5A6E85] mb-2" />
                <p className="text-[13px] text-[#5A6E85]">Chưa có món quà nào trong giỏ.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-[#F1F5F9] rounded-[8px] border border-[#E2E8F0] shrink-0 p-1 flex items-center justify-center">
                      {item.image_url ? <img src={getImageUrl(item.image_url)} alt="img" className="max-h-full" /> : <Gift className="w-6 h-6 text-[#9CA3AF]" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-semibold text-[#1E2A3A] text-[13px] leading-tight line-clamp-2">{item.name}</div>
                        <button onClick={() => removeFromCart(item.id)} className="text-[#9CA3AF] hover:text-[#DC2626]"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-[13px] font-bold text-[#F59E0B] flex items-center">
                          {item.star_price} <Star className="w-3 h-3 ml-0.5 fill-current" />
                        </div>
                        <div className="flex items-center border border-[#E2E8F0] rounded-[6px] bg-white">
                          <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-[#F1F5F9] text-[#5A6E85]"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-6 text-center text-[12px] font-medium">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-[#F1F5F9] text-[#5A6E85]"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#5A6E85] text-[14px]">Tổng chi phí:</span>
              <span className={`text-[20px] font-bold flex items-center ${totalCost > starsBalance ? 'text-[#DC2626]' : 'text-[#F59E0B]'}`}>
                {totalCost} <Star className="w-5 h-5 ml-1 fill-current" />
              </span>
            </div>

            {cart.length > 0 && totalCost > starsBalance && (
              <div className="text-[#DC2626] text-[12px] bg-[#FEF2F2] p-2 rounded-[6px] mb-3 border border-[#FEE2E2]">
                Bạn không đủ Sao để đổi giỏ hàng này.
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!canCheckout || submitting}
              className="w-full py-3 bg-[#00b24e] text-white font-bold rounded-[10px] hover:bg-[#009b43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đổi quà"}
            </button>
          </div>
        </div>
      </div>

      {showHistoryModal && <OrderHistoryModal onClose={() => setShowHistoryModal(false)} />}
    </div>
  );
}
