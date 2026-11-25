import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "OffCams · Off-Campus Activity Monitor",
  description: "Log off-campus trips, check in with GPS + photo proof, and let VPSAS staff monitor delegates live.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5b4ee0" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-dvh">
        <StoreProvider>{children}</StoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
