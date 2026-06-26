"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { changeUserRole } from "./actions";

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const roleColors: Record<Role, string> = {
  STUDENT:    "text-blue-600 bg-blue-500/10 border-blue-500/20",
  INSTRUCTOR: "text-teal-600 bg-teal-500/10 border-teal-500/20",
  ADMIN:      "text-amber-600 bg-amber-500/10 border-amber-500/20",
};

const roleLabels: Record<Role, string> = {
  STUDENT:    "Aluno",
  INSTRUCTOR: "Instrutor",
  ADMIN:      "Admin",
};

export function RoleSelector({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(currentRole);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(newRole: Role) {
    if (newRole === role) { setOpen(false); return; }
    startTransition(async () => {
      await changeUserRole(userId, newRole);
      setRole(newRole);
      setOpen(false);
    });
  }

  if (isSelf) {
    // Can't change own role — show static badge
    return (
      <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleColors[role]}`}>
        {roleLabels[role]}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-opacity ${roleColors[role]} ${isPending ? "opacity-50" : "hover:opacity-80"}`}
      >
        {isPending ? "…" : roleLabels[role]}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-[9999] bg-surface border border-border rounded-xl shadow-lg overflow-hidden min-w-[110px]">
          {(["STUDENT", "INSTRUCTOR", "ADMIN"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => select(r)}
              className={`w-full text-left px-3 py-2 font-sans text-xs transition-colors hover:bg-background ${r === role ? "font-semibold" : "text-muted"}`}
            >
              <span className={`inline-block font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded-full border ${roleColors[r]}`}>
                {roleLabels[r]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
