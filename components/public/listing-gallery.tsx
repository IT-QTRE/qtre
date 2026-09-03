"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type ListingGalleryImage = {
  url: string;
  alt: string;
};

export function ListingGallery({
  images,
  tone = "listing",
}: {
  images: ListingGalleryImage[];
  tone?: "listing" | "project" | "split" | "place";
}) {
  const t = useTranslations("catalog");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [stackIndex, setStackIndex] = useState(0);
  const hero = images[0];
  const isSplit = tone === "split";
  const frame =
    tone === "project"
      ? "md:h-[min(56vw,36rem)] lg:h-[min(50vw,42rem)]"
      : "md:h-[min(42vw,26rem)] lg:h-[min(38vw,28rem)]";
  const phoneAspect =
    tone === "place" ? "aspect-16/10" : tone === "project" || isSplit ? "aspect-5/4" : "aspect-4/3";
  const splitShell = "h-[min(62dvh,28rem)] w-full lg:h-full lg:min-h-0";

  if (!hero) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-accent text-sm text-foreground/80",
          isSplit ? splitShell : cn(phoneAspect, "md:aspect-auto", frame),
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="size-7" aria-hidden />
          <span>{t("placeholderImage")}</span>
        </div>
      </div>
    );
  }

  const total = images.length;
  const side = images.slice(1, 5);
  const hiddenCount = Math.max(0, total - 5);
  const stacked = images[stackIndex] ?? hero;
  const current = openIndex != null ? images[openIndex] : null;

  function open(index: number) {
    setOpenIndex(index);
  }

  function go(next: number) {
    setOpenIndex((next + total) % total);
  }

  function stepStack(delta: number) {
    setStackIndex((index) => (index + delta + total) % total);
  }

  const viewer = (
    <GalleryViewer
      image={current}
      index={openIndex}
      total={total}
      onClose={() => setOpenIndex(null)}
      onPrev={() => go((openIndex ?? 0) - 1)}
      onNext={() => go((openIndex ?? 0) + 1)}
    />
  );

  if (isSplit) {
    return (
      <>
        {total === 1 ? (
          <GalleryTile
            image={hero}
            label={t("galleryPhotoOf", { index: 1, total })}
            onOpen={() => open(0)}
            priority
            className={cn("overflow-hidden", splitShell)}
            sizes="(min-width: 1024px) 58vw, 100vw"
          />
        ) : (
          <div className={cn("relative overflow-hidden bg-accent", splitShell)}>
            <button
              type="button"
              onClick={() => open(stackIndex)}
              className="absolute inset-0 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("galleryPhotoOf", { index: stackIndex + 1, total })}
            >
              <Image
                src={stacked.url}
                alt={stacked.alt}
                fill
                priority={stackIndex === 0}
                className="cursor-pointer object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                stepStack(-1);
              }}
              className="absolute inset-s-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="sr-only">{t("galleryPrevious")}</span>
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                stepStack(1);
              }}
              className="absolute inset-e-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="sr-only">{t("galleryNext")}</span>
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <p className="pointer-events-none absolute inset-e-3 bottom-3 z-10 rounded-md bg-background/90 px-2 py-1 text-xs text-foreground">
              {t("galleryPhotoOf", { index: stackIndex + 1, total })}
            </p>
          </div>
        )}
        {viewer}
      </>
    );
  }

  if (total === 1) {
    return (
      <>
        <GalleryTile
          image={hero}
          label={t("galleryPhotoOf", { index: 1, total })}
          onOpen={() => open(0)}
          priority
          className={cn("w-full overflow-hidden", phoneAspect, "md:aspect-auto", frame)}
          sizes="(min-width: 768px) 100vw, 100vw"
        />
        {viewer}
      </>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <div
          className={cn("relative overflow-hidden bg-accent", phoneAspect)}
          tabIndex={total > 1 ? 0 : undefined}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") stepStack(-1);
            if (event.key === "ArrowRight") stepStack(1);
          }}
        >
          <button
            type="button"
            onClick={() => open(stackIndex)}
            className="absolute inset-0 cursor-pointer touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("galleryPhotoOf", { index: stackIndex + 1, total })}
          >
            <Image
              src={stacked.url}
              alt={stacked.alt}
              fill
              priority={stackIndex === 0}
              className="cursor-pointer object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
              sizes="(max-width: 767px) 100vw, 1px"
            />
          </button>
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepStack(-1);
                }}
                className="absolute inset-s-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="sr-only">{t("galleryPrevious")}</span>
                <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  stepStack(1);
                }}
                className="absolute inset-e-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="sr-only">{t("galleryNext")}</span>
                <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
              </button>
              <p className="pointer-events-none absolute inset-e-3 bottom-3 z-10 rounded-md bg-background/90 px-2 py-1 text-xs text-foreground">
                {t("galleryPhotoOf", { index: stackIndex + 1, total })}
              </p>
            </>
          ) : null}
        </div>
      </div>
      <div className={cn("hidden grid-cols-[minmax(0,2fr)_minmax(14rem,1fr)] gap-px overflow-hidden md:grid", frame)}>
        <GalleryTile
          image={hero}
          label={t("galleryPhotoOf", { index: 1, total })}
          onOpen={() => open(0)}
          priority
          className="min-h-0"
          sizes="(min-width: 768px) 68vw, 1px"
        />
        <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-1">
          {side.map((image, sideIndex) => {
            const index = sideIndex + 1;
            const isMore = sideIndex === 3 && hiddenCount > 0;
            return (
              <GalleryTile
                key={`${image.url}-${index}`}
                image={image}
                label={
                  isMore
                    ? t("galleryMoreCount", { count: hiddenCount })
                    : t("galleryPhotoOf", { index: index + 1, total })}
                onOpen={() => open(index)}
                className={sideTileClass(side.length, sideIndex)}
                sizes="(min-width: 768px) 18vw, 1px"
                overlay={
                  isMore ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/55">
                      <span className="font-heading text-sm font-semibold text-background sm:text-base">
                        {t("galleryMoreCount", { count: hiddenCount })}
                      </span>
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      </div>
      {viewer}
    </>
  );
}

function sideTileClass(count: number, index: number) {
  if (count === 1) return "col-span-2 row-span-2";
  if (count === 2) return "col-span-2";
  if (count === 3 && index === 2) return "col-span-2";
  return undefined;
}

function GalleryTile({
  image,
  label,
  onOpen,
  priority,
  overlay,
  className,
  sizes,
}: {
  image: ListingGalleryImage;
  label: string;
  onOpen: () => void;
  priority?: boolean;
  overlay?: ReactNode;
  className?: string;
  sizes: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className={cn(
        "group relative size-full min-h-11 cursor-pointer overflow-hidden bg-accent touch-manipulation focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        priority={priority}
        className="cursor-pointer object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        sizes={sizes}
      />
      {overlay}
    </button>
  );
}

function GalleryViewer({
  image,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  image: ListingGalleryImage | null | undefined;
  index: number | null;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("catalog");
  const open = image != null && index != null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent
        showCloseButton
        className="h-[min(92dvh,56rem)] w-[min(96vw,80rem)] max-w-[min(96vw,80rem)] gap-0 rounded-xl bg-foreground p-0 text-background duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] data-open:zoom-in-[0.98] data-closed:zoom-out-[0.98] sm:max-w-[min(96vw,80rem)]"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") onPrev();
          if (event.key === "ArrowRight") onNext();
        }}
      >
        <DialogTitle className="sr-only">
          {open ? t("galleryPhotoOf", { index: index + 1, total }) : t("galleryMore")}
        </DialogTitle>
        {image ? (
          <div className="relative h-full min-h-0">
            <Image
              key={image.url}
              src={image.url}
              alt={image.alt}
              fill
              className="qtre-gallery-in object-contain"
              sizes="96vw"
            />
            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute inset-s-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="sr-only">{t("galleryPrevious")}</span>
                  <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute inset-e-3 top-1/2 z-10 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-lg bg-background/90 text-foreground touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="sr-only">{t("galleryNext")}</span>
                  <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
                </button>
                <p className="absolute inset-s-3 bottom-3 rounded-md bg-background/90 px-2 py-1 text-xs text-foreground">
                  {t("galleryPhotoOf", { index: (index ?? 0) + 1, total })}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
