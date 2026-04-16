import Link from 'next/link';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FFFFFF] font-sans selection:bg-[#00b24e]/20 selection:text-[#00b24e]">
      <header className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-[#F0F2F5] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 text-[24px] font-bold text-[#1E2A3A] tracking-tight">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#00b24e] to-[#22c55e] flex items-center justify-center text-white text-lg shadow-sm">O</div>
          OKRgo
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[15px] font-medium text-[#5A6E85] hover:text-[#1E2A3A] transition-colors">Tính năng</Link>
          <Link href="#pricing" className="text-[15px] font-medium text-[#5A6E85] hover:text-[#1E2A3A] transition-colors">Bảng giá</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[15px] font-medium text-[#1E2A3A] hover:text-[#00b24e] transition-colors hidden sm:block">
            Đăng nhập
          </Link>
          <Link href="/login" className="px-5 py-2.5 bg-[#1E2A3A] hover:bg-[#0f172a] text-white rounded-[10px] text-[15px] font-medium transition-colors shadow-sm">
            Bắt đầu ảo
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full flex">{children}</main>
      <footer className="py-12 px-6 md:px-12 text-center border-t border-[#F0F2F5] bg-[#F5F7FA]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[20px] font-bold text-[#1E2A3A] tracking-tight flex items-center gap-2">
            OKRgo<span className="text-[#00b24e]">.</span>
          </div>
          <div className="flex gap-6 text-[14px] text-[#5A6E85]">
            <a href="#" className="hover:text-[#1E2A3A] transition-colors">Về chúng tôi</a>
            <a href="#" className="hover:text-[#1E2A3A] transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-[#1E2A3A] transition-colors">Điều khoản</a>
          </div>
          <div className="text-[14px] text-[#5A6E85]">
            &copy; 2026 OKRgo. Nâng tầm quản trị.
          </div>
        </div>
      </footer>
    </div>
  );
}
