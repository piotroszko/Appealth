import type { Metadata } from "next";

import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import { Footer } from "@/components/landing/footer";
import Header from "@/components/header";
import Providers from "@/components/providers";
import logo from "./logo.svg";
import Head from "next/head";

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
          <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-title" content="Appealth" />
          <link rel="manifest" href="/site.webmanifest" />

          <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
            <Header logo={<Image src={logo} alt="Appealth logo" className="size-6" />} />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
