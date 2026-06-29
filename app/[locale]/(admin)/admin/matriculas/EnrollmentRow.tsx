"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, X, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cancelEnrollment, confirmPayment } from "./actions";

const statusColors: Record<string, string> = {
  ACTIVE:    "text-green-600 bg-green-500/10 border-green-500/20",
  COMPLETED: "text-blue-600 bg-blue-500/10 border-blue-500/20",
  CANCELLED: "text-muted bg-border/50 border-border",
  REFUNDED:  "text-amber-600 bg-amber-500/10 border-amber-500/20",
};

type Props = {
  enrollment: {
    id: string;
    status: string;
    enrolledAt: string;
    user: { name: string | null; email: string; phone: string | null };
    course: { title: string; slug: string; totalSeats: number | null };
    _count: { attendances: number };
    payment: { status: string; method: string; amount: number } | null;
  };
  dateLocale: string;
};

export function EnrollmentRow({ enrollment: e, dateLocale }: Props) {
  const t = useTranslations("admin.enrollments");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const statusColor = statusColors[e.status] ?? statusColors.ACTIVE;

  const statusKey = e.status === "ACTIVE"
    ? "statusActive"
    : e.status === "COMPLETED"
    ? "statusCompleted"
    : e.status === "CANCELLED"
    ? "statusCancelled"
    : "statusRefunded";

  const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  async function handleConfirmPayment() {
    if (!confirm(`Confirmar pagamento manualmente para ${e.user.name ?? e.user.email}?`)) return;
    setConfirming(true);
    setError("");
    try {
      await confirmPayment(e.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleCancel() {
    if (!confirm(`Cancelar matrícula de ${e.user.name ?? e.user.email} em "${e.course.title}"?`)) return;
    setLoading(true);
    setError("");
    try {
      await cancelEnrollment(e.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <tr className="group hover:bg-background/50 transition-colors">
      <td className="px-5 py-3.5">
        <p className="font-sans text-sm font-medium text-foreground">{e.user.name}</p>
        <p className="font-sans text-xs text-muted">{e.user.email}</p>
        {e.user.phone && (
          <a href={`tel:+55${e.user.phone.replace(/\D/g, "")}`} className="font-sans text-xs text-muted hover:text-primary transition-colors">
            {e.user.phone}
          </a>
        )}
        {error && <p className="font-sans text-xs text-red-500 mt-1">{error}</p>}
      </td>
      <td className="px-5 py-3.5">
        {e.course.totalSeats !== null ? (
          <Link
            href={`/admin/cursos/${e.course.slug}/inscritos`}
            className="font-sans text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {e.course.title}
          </Link>
        ) : (
          <span className="font-sans text-sm text-foreground line-clamp-1">{e.course.title}</span>
        )}
      </td>
      <td className="px-5 py-3.5 hidden sm:table-cell">
        <span className="font-sans text-xs text-muted">
          {new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(e.enrolledAt))}
        </span>
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        {e.course.totalSeats !== null ? (
          <span className="font-sans text-xs text-foreground">
            {e._count.attendances === 1
              ? t("attendanceDay", { count: 1 })
              : t("attendanceDays", { count: e._count.attendances })}
          </span>
        ) : (
          <span className="font-sans text-xs text-muted">—</span>
        )}
      </td>
      <td className="px-5 py-3.5 hidden md:table-cell">
        {e.payment ? (
          <div className="flex flex-col gap-0.5">
            <span className={`font-sans text-xs font-semibold ${e.payment.status === "PAID" ? "text-green-600" : "text-amber-500"}`}>
              {e.payment.status === "PAID" ? "Pago" : "Aguardando"}
            </span>
            <span className="font-sans text-[10px] text-muted">{fmtBRL.format(e.payment.amount)}</span>
          </div>
        ) : (
          <span className="font-sans text-xs text-muted">Grátis</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className={`font-sans text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
            {t(statusKey)}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {e.payment?.status !== "PAID" && e.payment && e.status !== "CANCELLED" && (
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                title="Confirmar pagamento manualmente"
                className="p-1 rounded-lg text-muted hover:text-green-600 hover:bg-green-500/10"
              >
                {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            )}
            {e.status !== "CANCELLED" && e.status !== "REFUNDED" && (
              <button
                onClick={handleCancel}
                disabled={loading}
                title="Cancelar matrícula"
                className="p-1 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
