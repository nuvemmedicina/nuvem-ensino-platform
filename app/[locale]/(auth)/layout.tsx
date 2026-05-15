import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="px-6 py-5">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="NU.V.E.M Ensino"
            width={120}
            height={94}
            className="h-10 w-auto brightness-0 invert opacity-90"
          />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
      <p className="text-center font-sans text-xs text-white/30 pb-8">
        © {new Date().getFullYear()} NU.V.E.M Ensino · CNPJ 42.679.051/0001-31
      </p>
    </div>
  );
}
