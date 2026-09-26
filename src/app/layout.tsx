import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";

import { ConfirmProvider } from "@/components/ui/confirm";

import "./globals.css";

// 한글·영문을 한 글꼴로 맞춘다 (Geist 에는 한글 글리프가 없다)
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent",
  description: "LangGraph 에이전트 콘솔",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex h-full">
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
