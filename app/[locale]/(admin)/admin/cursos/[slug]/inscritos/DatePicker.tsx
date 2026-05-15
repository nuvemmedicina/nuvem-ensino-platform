"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function DatePicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("data", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <input
      type="date"
      name="data"
      defaultValue={value}
      onChange={handleChange}
      className="font-sans text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary/50"
    />
  );
}
