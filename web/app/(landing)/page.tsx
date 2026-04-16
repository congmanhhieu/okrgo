import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full min-w-0">
      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#E6F7ED]/40 to-transparent -z-10" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[20px] bg-[#E6F7ED] text-[#00b24e] text-[13px] font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-[#00b24e] animate-pulse" />
          Phiên bản OKRgo 2.0 đã ra mắt!
        </div>
        
        <h1 className="text-[44px] md:text-[64px] font-bold tracking-tight text-[#1E2A3A] max-w-5xl leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
          Kết nối mục tiêu. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b24e] to-[#008f3d]">
            Khai mở tiềm năng doanh nghiệp.
          </span>
        </h1>
        
        <p className="text-[18px] md:text-[20px] text-[#5A6E85] max-w-2xl mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          Nền tảng quản trị OKR hiện đại, kết hợp Check-in liên tục và văn hóa ghi nhận. Mang đến sự minh bạch tuyệt đối cho từng cá nhân và đội ngũ.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-7 duration-700 delay-300 w-full justify-center">
          <Link href="/login" className="px-8 py-4 bg-[#00b24e] hover:bg-[#009440] text-white rounded-[10px] text-[16px] font-medium transition-all hover:shadow-[0_8px_20px_rgba(0,178,78,0.25)] hover:-translate-y-0.5 w-full sm:w-auto">
            Bắt đầu miễn phí ngay
          </Link>
          <a href="#features" className="px-8 py-4 bg-white border border-[#E2E8F0] hover:bg-[#F9FBFD] hover:border-[#CBD5E1] text-[#1E2A3A] rounded-[10px] text-[16px] font-medium transition-all hover:-translate-y-0.5 w-full sm:w-auto">
            Khám phá tính năng
          </a>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="mt-20 w-full max-w-[1000px] rounded-[16px] border border-[#E2E8F0]/60 shadow-[0_30px_60px_rgba(0,0,0,0.08)] bg-white p-2 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 overflow-hidden relative mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/40 pointer-events-none" />
          <div className="h-10 w-full rounded-t-[12px] bg-[#F8FAFC] border-b border-[#F0F2F5] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm"></div>
            <div className="ml-4 h-5 w-48 bg-white border border-[#E2E8F0] rounded-[6px]"></div>
          </div>
          <div className="aspect-[16/9] w-full bg-[#FAFAFA] rounded-b-[12px] flex items-center justify-center relative overflow-hidden">
             {/* Abstract Wireframe */}
             <div className="absolute left-0 top-0 w-56 h-full border-r border-[#E2E8F0] bg-white p-6 hidden md:block">
               <div className="w-32 h-6 rounded bg-[#E2E8F0] mb-10" />
               <div className="space-y-5">
                 <div className="w-full h-10 rounded-[8px] bg-[#E6F7ED] border border-[#00b24e]/20" />
                 <div className="w-3/4 h-10 rounded-[8px] bg-[#f8fafc]" />
                 <div className="w-5/6 h-10 rounded-[8px] bg-[#f8fafc]" />
                 <div className="w-4/5 h-10 rounded-[8px] bg-[#f8fafc]" />
               </div>
             </div>
             <div className="w-full h-full md:ml-56 p-6 md:p-10 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-48 h-8 rounded-[6px] bg-[#E2E8F0]" />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00b24e] to-[#10b981] shadow-sm text-white flex items-center justify-center text-xs font-bold">AD</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div className="h-28 rounded-[12px] border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between shadow-sm">
                     <span className="w-24 h-3.5 rounded bg-gray-200" />
                     <div className="flex flex-col gap-2">
                         <span className="w-16 h-8 rounded bg-[#1E2A3A]" />
                         <span className="w-full h-1.5 rounded-full bg-gray-100"><span className="block w-3/4 h-full bg-[#00b24e] rounded-full" /></span>
                     </div>
                  </div>
                  <div className="h-28 rounded-[12px] border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between shadow-sm">
                     <span className="w-28 h-3.5 rounded bg-gray-200" />
                     <div className="flex flex-col gap-2">
                         <span className="w-16 h-8 rounded bg-[#1E2A3A]" />
                         <span className="w-full h-1.5 rounded-full bg-gray-100"><span className="block w-1/2 h-full bg-blue-500 rounded-full" /></span>
                     </div>
                  </div>
                  <div className="h-28 rounded-[12px] border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between shadow-sm hidden md:flex">
                     <span className="w-20 h-3.5 rounded bg-gray-200" />
                     <div className="flex flex-col gap-2">
                         <span className="w-16 h-8 rounded bg-[#1E2A3A]" />
                         <span className="w-full h-1.5 rounded-full bg-gray-100"><span className="block w-1/4 h-full bg-amber-500 rounded-full" /></span>
                     </div>
                  </div>
                </div>
                <div className="flex-1 w-full rounded-[12px] border border-[#E2E8F0] bg-white shadow-sm p-6 flex flex-col gap-4">
                    <div className="w-40 h-5 rounded-[4px] bg-gray-200" />
                    <div className="w-full h-12 rounded-[8px] bg-[#F9FBFD] border border-[#F0F2F5]" />
                    <div className="w-full h-12 rounded-[8px] bg-[#F9FBFD] border border-[#F0F2F5]" />
                    <div className="w-full h-12 rounded-[8px] bg-[#F9FBFD] border border-[#F0F2F5]" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="absolute inset-0 bg-[#F5F7FA]/30 skew-y-1 origin-top-right -z-10" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#1E2A3A] tracking-tight mb-5">
              Mọi công cụ bạn cần ở một nơi
            </h2>
            <p className="text-[16px] md:text-[18px] text-[#5A6E85] max-w-2xl mx-auto font-light">
              Chấm dứt việc sử dụng bảng tính cồng kềnh. OKRgo cung cấp luồng quản trị trực quan, xây dựng cho các team Agile tốc độ cao.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#E2E8F0]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-[#E6F7ED] rounded-[12px] flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#00b24e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-3">Mục tiêu (OKRs)</h3>
              <p className="text-[15px] text-[#5A6E85] leading-relaxed">Thiết lập linh hoạt OKRs ở nhiều cấp độ: Công ty, Phòng ban, Cá nhân. Quan sát luồng liên kết dễ dàng.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#E2E8F0]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50/80 flex items-center justify-center rounded-[12px] mb-6">
                 <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-3">Check-in liên tục</h3>
              <p className="text-[15px] text-[#5A6E85] leading-relaxed">Xóa bỏ rào cản báo cáo. Cập nhật tiến độ hàng tuần siêu nhanh, tập trung tháo gỡ điểm nghẽn.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#E2E8F0]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-amber-50/80 rounded-[12px] flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-3">Kudo Box</h3>
              <p className="text-[15px] text-[#5A6E85] leading-relaxed">Nuôi dưỡng văn hóa cởi mở. Ghi nhận và biểu dương những thành quả xuất sắc của đồng nghiệp.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#FFFFFF] p-8 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[#E2E8F0]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-50/80 rounded-[12px] flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              </div>
              <h3 className="text-[18px] font-bold text-[#1E2A3A] mb-3">Báo cáo trực quan</h3>
              <p className="text-[15px] text-[#5A6E85] leading-relaxed">Hệ thống phân tích chi tiết mức độ hoàn thành và trạng thái sức khỏe của toàn bộ mục tiêu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-24 bg-[#1E2A3A] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b24e] rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-20" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-6 tracking-tight leading-tight">
              Sẵn sàng để bứt phá <br /> năng suất tổ chức?
            </h2>
            <p className="text-[18px] text-[#94A3B8] mb-12 max-w-2xl mx-auto font-light">
              Gia nhập cùng hàng ngàn doanh nghiệp đã chuyển đổi số năng lực quản trị với OKRgo. Hãy là người thiết lập tiêu chuẩn mới.
            </p>
            <Link href="/login" className="px-10 py-4 bg-[#00b24e] hover:bg-[#009440] text-white rounded-[10px] text-[18px] font-semibold transition-all shadow-lg shadow-[#00b24e]/30 hover:shadow-[#00b24e]/50 hover:-translate-y-1 inline-flex">
               Khởi tạo Không gian làm việc
            </Link>
        </div>
      </section>
    </div>
  );
}
