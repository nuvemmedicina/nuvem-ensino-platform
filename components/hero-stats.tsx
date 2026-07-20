const stats = [
  { value: "+500", label: "Médicos formados" },
  { value: "+30", label: "Anos de experiência" },
  { value: "MEC", label: "Certificado" },
];

export default function HeroStats() {
  return (
    <div className="bg-canvas-card border-y border-white/[0.06]">
      <div className="max-w-4xl mx-auto px-6 py-7 sm:py-8">
        <div className="flex items-center justify-around">
          {stats.map((s, i) => (
            <div key={s.label} className="relative flex flex-col items-center px-3 sm:px-8">
              {i > 0 && (
                <span aria-hidden className="absolute -left-px top-1/2 -translate-y-1/2 h-7 w-px bg-white/[0.10]" />
              )}
              <span className="font-serif text-xl sm:text-3xl font-semibold text-white leading-none">
                {s.value}
              </span>
              <span className="font-sans text-[10px] sm:text-[11px] text-white/40 mt-1.5 text-center leading-snug max-w-[72px] sm:max-w-none">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
