"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/utmCapture";

function AttributionCapturer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureAttribution(searchParams);
  }, [searchParams]);

  return null;
}

/** Independente do GTM estar configurado ou não: é atribuição para o nosso
 * próprio banco de dados, não uma tag de medição de terceiro. */
export default function AttributionCapture() {
  return (
    <Suspense fallback={null}>
      <AttributionCapturer />
    </Suspense>
  );
}
