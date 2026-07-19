/**
 * 1. Libera advisory locks travados do Prisma migrate (pg_advisory_lock 72707369).
 * 2. Marca as migrações da lista ROLLED_BACK como rolled-back via SQL direto,
 *    evitando ~10 invocações separadas do prisma CLI (cada uma abre uma nova
 *    conexão com o Neon e demora ~11 segundos).
 *
 * Tudo em uma única conexão → Neon fica quente para o "prisma migrate deploy"
 * que roda logo em seguida.
 */

import { neon } from "@neondatabase/serverless";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[pre-migrate] Nenhuma URL de banco encontrada — ignorando.");
  process.exit(0);
}

// Migrações que devem ser marcadas como rolled-back antes do deploy.
// Adicione aqui qualquer migração nova que precise ser resolvida.
const ROLLED_BACK = [
  "20260625120000_add_module_release_date_and_module_instructors",
  "20260711150000_add_enrollment_pending_status",
  "20260712120000_add_topic",
  "20260712180000_add_course_evaluation",
  "20260712200000_add_module_apostila_url",
  "20260712220000_move_apostila_to_topic",
  "20260712240000_add_flashcards_and_ai",
  "20260713120000_add_course_references",
  "20260718120000_add_enrollment_suspended_status",
  "20260718200000_add_rag_content_chunks",
  "20260718220000_add_presentation_evaluation",
];

const sql = neon(url);

try {
  // ── 1. Libera advisory locks travados ────────────────────────────────────
  const waiting = await sql`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE pid != pg_backend_pid()
      AND query LIKE '%pg_advisory_lock(72707369)%'
  `;
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
  const killed = waiting.length + holding.length;
  if (killed > 0) {
    console.log(`[pre-migrate] Encerradas ${killed} sessão(ões) com advisory lock travado.`);
  } else {
    console.log("[pre-migrate] Nenhuma sessão com lock travado. OK.");
  }

  // ── 2. Marca migrações como rolled-back (idempotente) ────────────────────
  // Equivalente a: prisma migrate resolve --rolled-back <name>
  // Só age se a migração ainda não tiver rolled_back_at definido.
  let resolved = 0;
  for (const name of ROLLED_BACK) {
    // Upsert: insere se não existe, atualiza rolled_back_at se ainda não foi marcado
    const result = await sql`
      INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, applied_steps_count, rolled_back_at)
      VALUES (gen_random_uuid(), '', ${name}, NOW(), 0, NOW())
      ON CONFLICT (migration_name) DO UPDATE
        SET rolled_back_at = COALESCE("_prisma_migrations".rolled_back_at, NOW())
      WHERE "_prisma_migrations".rolled_back_at IS NULL
        AND "_prisma_migrations".finished_at IS NULL
      RETURNING migration_name
    `;
    if (result.length > 0) resolved++;
  }
  if (resolved > 0) {
    console.log(`[pre-migrate] ${resolved} migração(ões) marcadas como rolled-back.`);
  } else {
    console.log("[pre-migrate] Nenhuma migração nova para resolver. OK.");
  }
} catch (e) {
  // Não fatal — o migrate deploy tentará mesmo assim
  console.log(`[pre-migrate] Aviso: ${e.message}`);
}
