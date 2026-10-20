import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ConstructAI — Change orders, made clear",
  description:
    "Turn construction notes into clear, reviewable change orders. A local-first demonstration workspace.",
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
