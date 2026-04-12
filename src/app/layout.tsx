import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import ChatAssistant from "@/components/ChatAssistant";

export const metadata: Metadata = {
  title: "AnvayaAI | Supply Chain AI",
  description: "Advanced AI-driven supply chain optimization platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex overflow-hidden bg-[#f9f9fc]">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <ChatAssistant />
      </body>
    </html>
  );
}
