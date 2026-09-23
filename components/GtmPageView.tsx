"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { APP_URL } from "@/lib/appUrl";
import { sanitizePathAndSearch, sanitizeAbsoluteUrl } from "@/lib/analyticsSanitize";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Avisa o dataLayer a cada troca de rota, com a URL já sanitizada (sem
 * parâmetros fora da lista de origem, e sem nenhum parâmetro em rotas
 * sensíveis). O evento é sempre disparado, o Consent Mode do GA4/GTM é
 * quem decide, do lado do Google, se o dado de fato é processado ou não,
 * de acordo com o consentimento registrado em lib/consent.ts.
 *
 * O contêiner do GTM precisa de uma tag de configuração do GA4 configurada
 * para escutar o evento "page_view" deste dataLayer (não o pageview
 * automático padrão do GTM, que usaria a URL crua do navegador), lendo
 * page_location, page_referrer e page_path como variáveis de dataLayer.
 * Isso é configuração dentro do próprio painel do Tag Manager, não neste
 * código, ver checklist de passos manuais.
 */
function PageViewPusher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    const sanitizedPath = sanitizePathAndSearch(pathname, searchParams.toString());
    window.dataLayer.push({
      event: "page_view",
      page_location: `${APP_URL}${sanitizedPath}`,
      page_referrer: sanitizeAbsoluteUrl(document.referrer) ?? "",
      page_path: sanitizedPath,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GtmPageView() {
  return (
    <Suspense fallback={null}>
      <PageViewPusher />
    </Suspense>
  );
}
