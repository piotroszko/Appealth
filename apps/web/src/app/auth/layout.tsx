import Image from "next/image";
import Link from "next/link";

import logo from "../logo.svg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full items-center justify-center px-4 py-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Image src={logo} alt="Appealth logo" className="size-8" />
          <span className="text-xl font-bold">Appealth</span>
        </Link>

        {children}
      </div>
    </div>
  );
}
