"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTransition } from "react";

const localeLabels: Record<string, string> = {
  pt: "🇧🇷 PT",
  en: "🇺🇸 EN",
  es: "🇪🇸 ES",
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  // usePathname() from next-intl returns the locale-independent pathname
  // TEMPLATE, e.g. "/cursos/[slug]" — not the filled-in value.
  const pathname = usePathname();
  // useParams() from next/navigation gives the actual param values,
  // e.g. { locale: "en", slug: "manometria-phmetria-impedancia" }.
  // We pass them to router.replace so next-intl can fill in the template
  // when generating the localized URL.
  const params = useParams();
  const [, startTransition] = useTransition();

  function handleChange(newLocale: string) {
    startTransition(() => {
      router.replace(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { pathname, params: params as any },
        { locale: newLocale },
      );
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
