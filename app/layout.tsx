import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "nest. | Your rental, simplified", description: "A move-in setup preview for San Luis Obispo renters." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
