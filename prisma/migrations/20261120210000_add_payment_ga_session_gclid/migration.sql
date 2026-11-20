-- session_id do GA4 e clique do Google Ads (gclid), para a compra chegar ao Google Ads.
ALTER TABLE "Payment" ADD COLUMN "gaSessionId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gclid" TEXT;
