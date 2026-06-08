"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Clock, X } from "lucide-react";
import { markAttendance } from "./actions";
import { AttendanceStatus } from "@/app/generated/prisma/client";

type Props = {
  enrollmentId: string;
  courseSlug: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string | null;
  date: string; // "YYYY-MM-DD"
  initialStatus: AttendanceStatus | null;
};

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode; classes: string }
> = {
  PRESENT: {
    label: "Presente",
    icon: <Check className="w-3.5 h-3.5" />,
    classes: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  LATE: {
    label: "Atrasado",
    icon: <Clock className="w-3.5 h-3.5" />,
    classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  ABSENT: {
    label: "Ausente",
    icon: <X className="w-3.5 h-3.5" />,
    classes: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const CYCLE: (AttendanceStatus | null)[] = [null, "PRESENT", "LATE", "ABSENT"];

export function CheckInRow({
  enrollmentId,
  courseSlug,
  studentName,
  studentEmail,
  studentPhone,
  date,
  initialStatus,
}: Props) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(initialStatus);
  const [, startTransition] = useTransition();

  function handleClick() {
    const currentIdx = CYCLE.indexOf(optimisticStatus);
    const nextStatus = CYCLE[(currentIdx + 1) % CYCLE.length];
    const targetStatus: AttendanceStatus = nextStatus ?? "PRESENT";

    startTransition(async () => {
      setOptimisticStatus(targetStatus);
      await markAttendance(enrollmentId, courseSlug, date, targetStatus);
    });
  }

  const config = optimisticStatus ? STATUS_CONFIG[optimisticStatus] : null;

  return (
    <tr className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4">
        <p className="font-sans text-sm text-foreground">{studentName}</p>
        <p className="font-sans text-xs text-muted">{studentEmail}</p>
        {studentPhone && (
          <a
            href={`https://wa.me/55${studentPhone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-green-600 hover:text-green-500 transition-colors"
          >
            📱 {studentPhone}
          </a>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            config
              ? config.classes
              : "bg-white/5 text-muted border-border hover:border-primary/30 hover:text-foreground"
          }`}
        >
          {config ? (
            <>
              {config.icon}
              {config.label}
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              Marcar
            </>
          )}
        </button>
      </td>
    </tr>
  );
}
