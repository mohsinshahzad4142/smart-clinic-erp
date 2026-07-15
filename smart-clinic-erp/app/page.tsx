import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono-custom",
  subsets: ["latin"],
});

// یہ میٹا ڈیٹا یہاں رہے گا تاکہ کروم نئے مینی فیسٹ کو فوراً لوڈ کرے
export const metadata: Metadata = {
  title: "Smart Clinic & Diagnostics",
  description: "Your Health, Our Top Priority",
  manifest: "/manifest.json?v=2", // v=2 لگانے سے پرانا کیش بائی پاس ہو جائے گا
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}