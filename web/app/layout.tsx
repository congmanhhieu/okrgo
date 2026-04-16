import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OKRgo - Bứt phá giới hạn, Chinh phục mục tiêu",
  description: "Nền tảng quản trị mục tiêu và vinh danh nhân sự thế hệ mới",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-[100dvh] flex flex-col font-sans bg-[#F5F7FA]">
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
