/**
 * Termina sessões PostgreSQL que estejam aguardando ou retendo o advisory lock
 * que o Prisma migrate usa (pg_advisory_lock(72707369)).
 *
 * Com PgBouncer (transaction mode), sessões TCP podem vazar e nunca liberar
 * advisory locks de session level, bloqueando deploys subsequentes.
 */

import { neon } from "@neondatabase/serverless";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[pre-migrate] Nenhuma URL de banco encontrada — ignorando.");
  process.exit(0);
}

const sql = neon(url);

try {
  // Termina backends que estão AGUARDANDO o lock (query bloqueada)
  const waiting = await sql`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE pid != pg_backend_pid()
      AND query LIKE '%pg_advisory_lock(72707369)%'
  `;

  // Termina backends que JÁ SEGURAM o lock (granted = true)
  const holding = await sql`
    SELECT pg_terminate_backend(a.pid)
    FROM pg_locks l
    JOIN pg_stat_activity a ON l.pid = a.pid
    WHERE l.locktype = 'advisory'
      AND l.classid = 0
      AND l.objid = 72707369
      AND l.granted = true
      AND a.pid != pg_backend_pid()
  `;

  const total = waiting.length + holding.length;
  if (total > 0) {
    console.log(`[pre-migrate] Encerradas ${total} sessão(ões) com advisory lock travado.`);
  } else {
    console.log("[pre-migrate] Nenhuma sessão com lock travado. OK.");
  }
} catch (e) {
  // Não fatal — o migrate deploy tentará mesmo assim
  console.log(`[pre-migrate] Verificação ignorada: ${e.message}`);
}
