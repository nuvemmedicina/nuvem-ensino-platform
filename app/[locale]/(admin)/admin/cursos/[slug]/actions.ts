"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR")) throw new Error("Não autorizado.");
}

async function enrollInstructorInCourse(courseId: string, instructorId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { userId: true },
  });
  if (!instructor) return;
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: instructor.userId, courseId } },
    create: { userId: instructor.userId, courseId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
}

export async function updateCourse(courseId: string, slug: string, formData: FormData) {
  await requireAdmin();

  const str = (key: string) => (formData.get(key) as string) || null;
  const newSlug = (formData.get("slug") as string).trim() || slug;
  const instructorId = formData.get("instructorId") as string | null;

  if (newSlug !== slug) {
    const conflict = await prisma.course.findUnique({ where: { slug: newSlug } });
    if (conflict) throw new Error(`O slug "${newSlug}" já está em uso por outro curso.`);
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title:       formData.get("title") as string,
      shortDesc:   str("shortDesc"),
      description: formData.get("description") as string,
      slug:        newSlug,
      price:       parseFloat(formData.get("price") as string),
      hours:       parseInt(formData.get("hours") as string),
      status:      formData.get("status") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      category:    formData.get("category") as "HANDS_ON" | "ONLINE" | "HYBRID",
      location:    str("location"),
      thumbnailUrl:        str("thumbnailUrl"),
      contentUrl:          str("contentUrl"),
      externalCheckoutUrl: str("externalCheckoutUrl"),
      totalSeats:     formData.get("totalSeats") ? parseInt(formData.get("totalSeats") as string) : null,
    },
  });
  if (instructorId) await enrollInstructorInCourse(courseId, instructorId);

  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/admin/cursos/${newSlug}`);
  revalidatePath("/admin/cursos");
  revalidatePath(`/cursos/${slug}`);
  revalidatePath(`/cursos/${newSlug}`);
  redirect(`/admin/cursos/${newSlug}`);
}

const TIPOS_DE_AULA = ["VIDEO", "LIVE", "TEXT"] as const;

export async function updateLesson(lessonId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const atual = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { muxAssetId: true } });

  // Com vídeo no Mux, a duração vem do vídeo (webhook e scripts/preencher-duracoes.ts)
  // e não é editável. Sem vídeo, o campo aceita uma estimativa em minutos.
  const minutos = formData.get("duration");
  const duracao =
    atual?.muxAssetId || minutos === null
      ? undefined
      : minutos === ""
        ? null
        : Math.max(0, Math.round(Number(minutos)));

  const tipo = formData.get("type");
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title:       formData.get("title") as string,
      videoUrl:    (formData.get("videoUrl") as string) || null,
      audioUrl:    (formData.get("audioUrl") as string) || null,
      description: (formData.get("description") as string) || null,
      isFree:      formData.get("isFree") === "on",
      ...(duracao !== undefined && !Number.isNaN(duracao) ? { duration: duracao } : {}),
      ...(TIPOS_DE_AULA.includes(tipo as (typeof TIPOS_DE_AULA)[number])
        ? { type: tipo as (typeof TIPOS_DE_AULA)[number] }
        : {}),
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

// ── Reordenação ─────────────────────────────────────────────────────────────
// Troca o item de lugar com o vizinho e renumera a lista inteira (1, 2, 3…),
// o que também conserta ordens repetidas que já existam no banco.

function reposicionar<T extends { id: string }>(lista: T[], id: string, direcao: "cima" | "baixo") {
  const i = lista.findIndex((x) => x.id === id);
  const j = direcao === "cima" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return null;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

export async function moveModule(moduleId: string, courseSlug: string, direcao: "cima" | "baixo") {
  await requireAdmin();
  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (!mod) return;
  const lista = await prisma.module.findMany({ where: { courseId: mod.courseId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const nova = reposicionar(lista, moduleId, direcao);
  if (!nova) return;
  await prisma.$transaction(nova.map((m, i) => prisma.module.update({ where: { id: m.id }, data: { order: i + 1 } })));
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function moveTopic(topicId: string, courseSlug: string, direcao: "cima" | "baixo") {
  await requireAdmin();
  const topico = await prisma.topic.findUnique({ where: { id: topicId }, select: { moduleId: true } });
  if (!topico) return;
  const lista = await prisma.topic.findMany({ where: { moduleId: topico.moduleId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { id: true } });
  const nova = reposicionar(lista, topicId, direcao);
  if (!nova) return;
  await prisma.$transaction(nova.map((t, i) => prisma.topic.update({ where: { id: t.id }, data: { order: i + 1 } })));
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function moveLesson(lessonId: string, courseSlug: string, direcao: "cima" | "baixo") {
  await requireAdmin();
  const aula = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { moduleId: true, topicId: true } });
  if (!aula) return;
  const lista = await prisma.lesson.findMany({
    where: aula.topicId ? { topicId: aula.topicId } : { moduleId: aula.moduleId, topicId: null },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const nova = reposicionar(lista, lessonId, direcao);
  if (!nova) return;
  await prisma.$transaction(nova.map((a, i) => prisma.lesson.update({ where: { id: a.id }, data: { order: i + 1 } })));
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateModuleInstructors(
  moduleId: string,
  courseSlug: string,
  instructorIds: string[],
) {
  await requireAdmin();

  const modulo = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });

  await prisma.$transaction([
    prisma.moduleInstructor.deleteMany({ where: { moduleId } }),
    ...instructorIds.map((instructorId, order) =>
      prisma.moduleInstructor.create({
        data: { id: crypto.randomUUID(), moduleId, instructorId, order },
      })
    ),
  ]);

  if (modulo) {
    for (const instructorId of instructorIds) {
      await enrollInstructorInCourse(modulo.courseId, instructorId);
    }
  }

  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateLessonInstructors(
  lessonId: string,
  courseSlug: string,
  instructorIds: string[],
) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await tx.lessonInstructor.deleteMany({ where: { lessonId } });
    if (instructorIds.length > 0) {
      await tx.lessonInstructor.createMany({
        data: instructorIds.map((instructorId, order) => ({ lessonId, instructorId, order })),
      });
    }
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
  return { ok: true };
}

export async function updateModule(moduleId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  await prisma.module.update({
    where: { id: moduleId },
    data: { title: formData.get("title") as string },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createModule(courseId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.module.findMany({ where: { courseId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.module.create({
    data: {
      courseId,
      title: formData.get("title") as string,
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createLesson(moduleId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.lesson.findMany({ where: { moduleId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.lesson.create({
    data: {
      moduleId,
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      duration: formData.get("duration") ? Math.round(parseFloat(formData.get("duration") as string) * 60) : null,
      order:    maxOrder + 1,
      type:     "VIDEO",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createTopic(moduleId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const existing = await prisma.topic.findMany({ where: { moduleId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.topic.create({
    data: {
      moduleId,
      title: formData.get("title") as string,
      order: maxOrder + 1,
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateTopic(topicId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  await prisma.topic.update({
    where: { id: topicId },
    data: { title: formData.get("title") as string },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteTopic(topicId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.topic.delete({ where: { id: topicId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function createLessonUnderTopic(
  topicId: string,
  moduleId: string,
  courseSlug: string,
  formData: FormData,
) {
  await requireAdmin();
  const existing = await prisma.lesson.findMany({ where: { topicId }, select: { order: true } });
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.order), 0);
  await prisma.lesson.create({
    data: {
      moduleId,
      topicId,
      title:    formData.get("title") as string,
      videoUrl: (formData.get("videoUrl") as string) || null,
      order:    maxOrder + 1,
      type:     "VIDEO",
    },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteLesson(lessonId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function removeLessonVideo(lessonId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { muxAssetId: null, muxPlaybackId: null },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteModule(moduleId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateModuleReleaseDate(moduleId: string, courseSlug: string, formData: FormData) {
  await requireAdmin();
  const raw = formData.get("releaseDate") as string;
  await prisma.module.update({
    where: { id: moduleId },
    data: { releaseDate: raw ? new Date(raw) : null },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function updateTopicApostila(topicId: string, courseSlug: string, url: string | null) {
  await requireAdmin();
  await prisma.topic.update({
    where: { id: topicId },
    data: { apostilaUrl: url },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function deleteCourse(courseId: string) {
  await requireAdmin();
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}

// Atualiza apenas os campos de conteúdo de página (segundo formulário — não inclui title/price/etc.)
export async function updateCourseContent(courseId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const str = (key: string) => (formData.get(key) as string) || null;
  await prisma.course.update({
    where: { id: courseId },
    data: {
      startDateLabel: str("startDateLabel"),
      objectives:     str("objectives"),
      targetAudience: str("targetAudience"),
      includes:       str("includes"),
    },
  });
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}`);
}

// Atualiza apenas as traduções EN/ES (terceiro formulário)
export async function updateCourseTranslations(courseId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const str = (key: string) => (formData.get(key) as string) || null;
  await prisma.course.update({
    where: { id: courseId },
    data: {
      titleEn:       str("titleEn"),
      shortDescEn:   str("shortDescEn"),
      descriptionEn: str("descriptionEn"),
      titleEs:       str("titleEs"),
      shortDescEs:   str("shortDescEs"),
      descriptionEs: str("descriptionEs"),
      objectivesEs:      str("objectivesEs"),
      objectivesEn:      str("objectivesEn"),
      targetAudienceEs:  str("targetAudienceEs"),
      targetAudienceEn:  str("targetAudienceEn"),
      includesEs:        str("includesEs"),
      includesEn:        str("includesEn"),
      startDateLabelEs:  str("startDateLabelEs"),
      startDateLabelEn:  str("startDateLabelEn"),
    },
  });
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}`);
}

const CAMPOS_TRADUCAO = ["titleEs", "titleEn", "descriptionEs", "descriptionEn"] as const;
type Traducao = Partial<Record<(typeof CAMPOS_TRADUCAO)[number], string | null>>;

/** Só os campos do formulário que mudaram (vazio = volta a usar o português). */
function traducaoAlterada(formData: FormData, prefixo: string, atual: Traducao) {
  const data: Traducao = {};
  for (const campo of CAMPOS_TRADUCAO) {
    const bruto = formData.get(`${prefixo}:${campo}`);
    if (bruto === null) continue;
    const valor = (bruto as string).trim() || null;
    if (valor !== (atual[campo] ?? null)) data[campo] = valor;
  }
  return Object.keys(data).length ? data : null;
}

/**
 * Salva as traduções (ES/EN) de um módulo, dos temas e das aulas dele num
 * envio só. Grava uma linha por vez e só as que mudaram: uma transação com
 * dezenas de updates estoura o tempo limite do Neon.
 */
export async function salvarTraducoesModulo(moduleId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const sel = { id: true, titleEs: true, titleEn: true, descriptionEs: true, descriptionEn: true } as const;
  const modulo = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { ...sel, topics: { select: { ...sel, lessons: { select: sel } } } },
  });
  if (!modulo) return;

  const m = traducaoAlterada(formData, `m:${modulo.id}`, modulo);
  if (m) await prisma.module.update({ where: { id: modulo.id }, data: m });
  for (const tp of modulo.topics) {
    const t = traducaoAlterada(formData, `t:${tp.id}`, tp);
    if (t) await prisma.topic.update({ where: { id: tp.id }, data: t });
    for (const a of tp.lessons) {
      const l = traducaoAlterada(formData, `a:${a.id}`, a);
      if (l) await prisma.lesson.update({ where: { id: a.id }, data: l });
    }
  }
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/dashboard/cursos/${slug}`);
}

// Atualiza dados do co-instrutor (quarto formulário)
export async function updateCourseCoInstructor(courseId: string, slug: string, formData: FormData) {
  await requireAdmin();
  const str = (key: string) => (formData.get(key) as string) || null;
  await prisma.course.update({
    where: { id: courseId },
    data: {
      coInstructorName:       str("coInstructorName"),
      coInstructorCredential: str("coInstructorCredential"),
      coInstructorPhotoUrl:   str("coInstructorPhotoUrl"),
      coInstructorBio:        str("coInstructorBio"),
      coInstructorInstagram:  str("coInstructorInstagram"),
    },
  });
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}`);
}

// Chamado pelo MuxUploader após upload concluído
export async function updateCourseFaq(
  courseId: string,
  slug: string,
  items: { q: string; a: string }[],
) {
  await requireAdmin();
  await prisma.course.update({
    where: { id: courseId },
    data: { faqJson: JSON.stringify(items) },
  });
  revalidatePath(`/admin/cursos/${slug}`);
  revalidatePath(`/cursos/${slug}`);
}

export async function saveMuxAsset(lessonId: string, muxAssetId: string, courseSlug: string) {
  await requireAdmin();
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { muxAssetId },
  });
  revalidatePath(`/admin/cursos/${courseSlug}`);
}

export async function duplicateCourse(courseId: string) {
  await requireAdmin();

  const original = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    include: {
      modules: { include: { lessons: true }, orderBy: { order: "asc" } },
    },
  });

  // Gera slug único: base-slug-cópia, base-slug-cópia-2, etc.
  const baseSlug = `${original.slug}-copia`;
  let candidateSlug = baseSlug;
  let suffix = 2;
  while (await prisma.course.findUnique({ where: { slug: candidateSlug } })) {
    candidateSlug = `${baseSlug}-${suffix++}`;
  }

  const { id, slug, createdAt, updatedAt, modules, ...fields } = original;
  void id; void slug; void createdAt; void updatedAt; void modules;

  const duplicate = await prisma.course.create({
    data: {
      ...fields,
      slug: candidateSlug,
      title: `${original.title} (Cópia)`,
      status: "DRAFT",
      reservedSeats: 0,
      startDate: null,
      endDate: null,
      modules: {
        create: original.modules.map((mod) => ({
          title: mod.title,
          order: mod.order,
          lessons: {
            create: mod.lessons.map((lesson) => ({
              title:     lesson.title,
              order:     lesson.order,
              type:      lesson.type,
              videoUrl:  lesson.videoUrl,
              duration:  lesson.duration,
              isFree:    lesson.isFree,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${duplicate.slug}`);
}
