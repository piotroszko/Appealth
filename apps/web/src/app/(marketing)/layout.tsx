import Image from "next/image";

import { Footer } from "@/components/landing/footer";
import Header from "@/components/header";

import logo from "../logo.svg";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
      <Header logo={<Image src={logo} alt="Appealth logo" className="size-6" />} />
      {children}
      <Footer />
    </div>
  );
}
