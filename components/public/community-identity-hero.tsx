import type { ReactNode } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { GoldRule } from "@/components/public/gold-rule";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function CommunityIdentityHero({
  breadcrumb,
  title,
  city,
  intro,
  photoLabel,
  headingId,
  imageUrl,
  imageAlt,
}: {
  breadcrumb: ReactNode;
  title: string;
  city: string;
  intro: string;
  photoLabel: string;
  headingId: string;
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  return (
    <header className="relative -mt-24 flex min-h-[min(58svh,32rem)] flex-col overflow-hidden bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:min-h-[min(78svh,44rem)] sm:pt-26">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? ""}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-accent text-foreground/80" aria-hidden>
          <ImageIcon className="size-8" />
          <span className="font-heading text-sm font-medium tracking-tight">{photoLabel}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-foreground/50" aria-hidden />
      <div className={cn("relative z-10 pt-8 sm:pt-10 lg:pt-12", publicGutter)}>{breadcrumb}</div>
      <div className={cn("relative z-10 mt-auto pb-10 sm:pb-20 lg:pb-24", publicGutter)}>
        <h1
          id={headingId}
          className="max-w-[12ch] font-heading text-[clamp(2.25rem,9vw,6rem)] font-semibold leading-[1.02] tracking-tight text-balance"
        >
          {title}
        </h1>
        <p className="mt-3 font-heading text-base font-medium text-primary-foreground/80 sm:mt-4 sm:text-lg">{city}</p>
        <GoldRule draw className="mt-5 w-20 sm:mt-10 sm:w-32" />
        <p className="mt-5 max-w-prose text-sm leading-relaxed text-pretty text-primary-foreground/85 sm:mt-8 sm:text-lg">
          {intro}
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-secondary" />
    </header>
  );
}
