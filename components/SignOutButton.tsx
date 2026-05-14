"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sair
    </button>
  );
}
