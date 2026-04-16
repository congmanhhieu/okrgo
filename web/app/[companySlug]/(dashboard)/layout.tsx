import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";
import HeaderUserDropdown from "@/components/HeaderUserDropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex items-center justify-end px-8 bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.02)] z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <HeaderUserDropdown />
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[#F5F7FA]">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
