"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

const localeLabels: Record<string, string> = {
  pt: "🇧🇷 PT",
  en: "🇺🇸 EN",
  es: "🇪🇸 ES",
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function handleChange(newLocale: string) {
    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(pathname as any, { locale: newLocale });
    });
  }

  return (
    <div className="relative flex items-center gap-1">
      {Object.entries(localeLabels).map(([loc, label]) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          aria-label={`Switch to ${label}`}
          className={`font-sans text-xs px-2 py-1 rounded transition-colors ${
            locale === loc
              ? "text-primary font-semibold"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
