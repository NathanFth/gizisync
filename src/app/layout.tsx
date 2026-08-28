import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiziSync — Sistem Informasi Manajemen Gizi Posyandu",
  description:
    "Sistem Informasi Manajemen Gizi, Posyandu, dan Deteksi Dini Stunting Balita — dilengkapi kalkulator Z-Score berstandar WHO, Buku Register Balita digital, dan laporan bulanan otomatis.",
  keywords: [
    "Posyandu",
    "Gizi Balita",
    "Stunting",
    "Z-Score WHO",
    "KMS",
    "Kesehatan Anak",
    "Buku Register Balita",
  ],
  authors: [{ name: "GiziSync Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
