import type { Metadata } from "next";
import "./globals.css";
import { headers } from 'next/headers';

import Sidebar from "@/components/Sidebar";
import ChatAssistant from "@/components/ChatAssistant";

export const metadata: Metadata = {
  title: "AnvayaAI | Supply Chain AI",
  description: "Advanced AI-driven supply chain optimization platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get('x-middleware-request-next-url') ?? '';
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`h-full overflow-hidden bg-[#f9f9fc] ${isAuthPage ? '' : 'flex'}`}>
        {!isAuthPage && <Sidebar />}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        {!isAuthPage && <ChatAssistant />}
      </body>
    </html>
  );
}
