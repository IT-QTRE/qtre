import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

const column = "mx-auto w-full max-w-[42rem]";

const bodyClasses = cn(
  "text-base leading-[1.75] text-pretty text-foreground sm:text-[1.0625rem] sm:leading-[1.8]",
  "[&_p]:mt-6 [&_p:first-child]:mt-0",
  "[&_h1]:mt-14 [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-balance",
  "[&_h2]:mt-14 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-balance sm:[&_h2]:text-[1.35rem]",
  "[&_h3]:mt-10 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-balance",
  "[&_h4]:mt-8 [&_h4]:font-heading [&_h4]:text-base [&_h4]:font-semibold",
  "[&_ul]:my-6 [&_ul]:list-disc [&_ul]:ps-6",
  "[&_ol]:my-6 [&_ol]:list-decimal [&_ol]:ps-6",
  "[&_li]:mt-2",
  "[&_blockquote]:my-10 [&_blockquote]:border-s [&_blockquote]:border-secondary [&_blockquote]:ps-5 [&_blockquote]:text-foreground/80",
  "[&_a]:text-primary [&_a]:underline [&_a]:decoration-secondary/70 [&_a]:underline-offset-[0.3em] [&_a]:transition-colors [&_a]:duration-300 [&_a]:ease-[cubic-bezier(0.25,1,0.5,1)] [&_a]:hover:decoration-primary motion-reduce:[&_a]:transition-none",
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm",
  "[&_code]:font-mono [&_code]:text-[0.95em]",
  "[&_hr]:my-14 [&_hr]:w-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-secondary",
  "[&_strong]:font-semibold",
);

export function BlogArticle({
  breadcrumb,
  backLabel,
  dateLabel,
  publishedAt,
  topicLabel,
  title,
  imageUrl,
  imageAlt,
  html,
  alsoSee,
}: {
  breadcrumb: ReactNode;
  backLabel: string;
  dateLabel: string;
  publishedAt: number;
  topicLabel?: string | null;
  title: string;
  imageUrl: string | null;
  imageAlt: string;
  html: string;
  alsoSee?: ReactNode;
}) {
  return (
    <main id="main" className="w-full">
      <header className="relative -mt-24 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26">
        <div className={cn("pt-5 pb-8 sm:pt-6 sm:pb-10", publicGutter)}>{breadcrumb}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
      </header>

      <article className={cn("pt-8 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32", publicGutter)}>
        <div className={column}>
          <header>
            <time className="text-sm text-secondary" dateTime={new Date(publishedAt).toISOString()}>
              {dateLabel}
            </time>
            {topicLabel ? <p className="mt-2 text-sm text-secondary">{topicLabel}</p> : null}
            <h1 className="mt-5 font-heading text-[clamp(1.875rem,4.2vw,2.75rem)] font-semibold leading-[1.15] tracking-tight text-balance text-foreground">
              {title}
            </h1>
            <div className="mt-7 h-px w-12 bg-secondary sm:mt-8" />
          </header>

          {imageUrl ? (
            <div className="relative mt-8 aspect-2/1 overflow-hidden bg-muted sm:mt-12">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 42rem, 100vw"
                priority
              />
            </div>
          ) : null}

          {html ? <div className={cn(bodyClasses, "mt-10 sm:mt-12")} dangerouslySetInnerHTML={{ __html: html }} /> : null}
          {alsoSee}
          <p className="mt-14 sm:mt-16">
            <Link
              href="/blog"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground/80 touch-manipulation transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
              {backLabel}
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
