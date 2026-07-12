import { BookOpen } from "lucide-react";

type Size = "sm" | "md" | "lg";

const widths: Record<Size, string> = { sm: "w-24", md: "w-36", lg: "w-48" };

export function CoverThumbnail({
  src,
  alt,
  size = "md",
  className = "",
}: {
  src?: string | null;
  alt: string;
  size?: Size;
  className?: string;
}) {
  return (
    <div className={`relative ${widths[size]} shrink-0 overflow-hidden rounded-xl ${className}`} style={{ aspectRatio: "2/3" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-surface border border-border flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted/30" />
        </div>
      )}
    </div>
  );
}
