"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@/i18n/navigation";
import type { HeroSlide, HeroSlideLink } from "@/lib/hero-slides";

const primaryCtaClass =
  "group relative font-sans text-sm font-semibold px-8 py-3.5 rounded-full bg-accent text-accent-foreground transition-all duration-300 hover:shadow-[0_0_32px_rgba(203,228,230,0.4)] hover:scale-[1.03]";
const secondaryCtaClass =
  "font-sans text-sm font-semibold px-8 py-3.5 rounded-full border border-accent/40 text-accent hover:border-accent hover:bg-accent/10 transition-all duration-300";

function HeroCtaLink({ label, link, className }: { label: string; link: HeroSlideLink; className: string }) {
  if (link.type === "plain") {
    const isExternal = /^https?:\/\//.test(link.href);
    return (
      <NextLink
        href={link.href}
        className={className}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {label}
      </NextLink>
    );
  }
  if (link.pathname === "/cursos/[slug]") {
    return (
      <Link href={{ pathname: "/cursos/[slug]", params: { slug: link.slug } }} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <Link href={link.pathname} className={className}>
      {label}
    </Link>
  );
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-canvas">
      {/* Grid de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(203,228,230,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(203,228,230,0.025) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Orb esquerdo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0,71,94,0.8) 0%, transparent 70%)" }}
      />
      {/* Orb direito */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(203,228,230,0.6) 0%, transparent 70%)" }}
      />

      <div className="relative w-full overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
              <div className="flex flex-col items-center text-center px-4 pt-28 pb-16">
                {/* Selo ISO visível */}
                <div className="relative mb-6">
                  <Image
                    src="/selo-iso-9001.png"
                    alt="Certificação ISO 9001"
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Badge */}
                <div className="relative flex items-center gap-2 mb-7">
                  <span className="animate-dot w-1.5 h-1.5 rounded-full bg-accent block" />
                  <span className="font-sans text-xs font-semibold tracking-[0.25em] uppercase text-accent/80">
                    {slide.badge}
                  </span>
                </div>

                {/* Título */}
                <h1 className="relative font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight max-w-3xl mb-6">
                  {slide.title}{" "}
                  <em
                    className="not-italic italic font-medium"
                    style={{
                      background: "linear-gradient(135deg, #CBE4E6 0%, #7BC5CA 50%, #CBE4E6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {slide.titleHighlight}
                  </em>
                  {slide.titleSuffix ? ` ${slide.titleSuffix}` : ""}
                </h1>

                <p className="relative font-sans text-base sm:text-lg text-white/55 max-w-xl leading-relaxed mb-10">
                  {slide.description}
                </p>

                {/* CTAs */}
                <div className="relative flex flex-col sm:flex-row gap-4 items-center">
                  <HeroCtaLink label={slide.primaryCta.label} link={slide.primaryCta.link} className={primaryCtaClass} />
                  <HeroCtaLink label={slide.secondaryCta.label} link={slide.secondaryCta.link} className={secondaryCtaClass} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Setas de navegação */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Slide anterior"
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Próximo slide"
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200 z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="relative flex items-center justify-center gap-2 pb-10">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ir para o slide ${index + 1}`}
            aria-current={index === selectedIndex}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === selectedIndex ? "w-6 bg-accent" : "w-1.5 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
