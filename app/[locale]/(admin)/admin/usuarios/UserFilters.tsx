"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function UserFilters() {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const roles = [
    { value: "ALL",        label: t("filterAll") },
    { value: "STUDENT",    label: t("roleStudent") },
    { value: "INSTRUCTOR", label: t("roleInstructor") },
    { value: "ADMIN",      label: t("roleAdmin") },
  ];

  const q    = searchParams.get("q")    ?? "";
  const role = searchParams.get("role") ?? "ALL";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Busca por nome/email */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted animate-spin" />
        )}
        <input
          type="search"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          onChange={(e) => update("q", e.target.value)}
          className="pl-9 pr-4 py-2 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 w-64 transition-colors"
        />
      </div>

      {/* Filtro por tipo */}
      <select
        defaultValue={role}
        onChange={(e) => update("role", e.target.value)}
        className="px-3 py-2 rounded-xl bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
      >
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
