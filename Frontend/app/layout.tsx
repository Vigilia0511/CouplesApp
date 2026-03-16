// app/layout.tsx
// Root layout

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CouplesApp - Video Calls",
  description: "Connect with your partner through secure video calls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
