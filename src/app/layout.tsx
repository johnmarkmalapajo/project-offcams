import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "OffCams · Off-Campus Activity Monitor",
  description: "Log off-campus trips, check in with GPS + photo proof, and let VPSAS staff monitor delegates live.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#171717" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased min-h-dvh">
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
