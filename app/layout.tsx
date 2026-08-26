import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mini Atoms — AI App Builder",
  description:
    "Turn natural-language ideas into interactive web apps, refine them through chat, and persist every version.",
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
