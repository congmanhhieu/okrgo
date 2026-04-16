import { ListTodo } from "lucide-react";

export function EmptyState() {
  return (
    <div className="bg-white rounded-[16px] shadow-sm border border-[#E2E8F0] p-12 text-center">
      <ListTodo className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
      <h3 className="text-[18px] font-medium text-[#1E2A3A]">Chưa có task nào</h3>
      <p className="text-[#5A6E85] mt-2 text-[14px]">Nhấn &quot;Tạo task&quot; để bắt đầu.</p>
    </div>
  );
}
