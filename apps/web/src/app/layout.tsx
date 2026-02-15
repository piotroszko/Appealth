import type { Metadata } from "next";

import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import logo from "./logo.svg";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Appealth - Your Website's Health Clinic",
  description:
    "Comprehensive website diagnostics — security audits, performance tests, SEO checks, and uptime monitoring. All in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
            <Header logo={<Image src={logo} alt="Appealth logo" className="size-6" />} />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
