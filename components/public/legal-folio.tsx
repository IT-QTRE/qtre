import { DirectoryHero } from "@/components/public/directory-hero";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function LegalFolio({
  title,
  intro,
  updated,
  headingId,
  sections,
  contactLabel,
}: {
  title: string;
  intro: string;
  updated: string;
  headingId: string;
  sections: { title: string; body: string }[];
  contactLabel: string;
}) {
  return (
    <main id="main">
      <DirectoryHero title={title} intro={intro} countLabel={updated} headingId={headingId} />
      <article className={cn("bg-background py-16 sm:py-20 lg:py-24", publicGutter)}>
        <div className="mx-auto max-w-prose">
          {sections.map((section) => (
            <section key={section.title} className="mt-12 first:mt-0">
              <h2 className="font-heading text-xl font-semibold tracking-tight text-pretty text-foreground sm:text-2xl">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-pretty text-foreground/80">{section.body}</p>
            </section>
          ))}
          <p className="mt-14">
            <Link
              href="/contact"
              className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {contactLabel}
            </Link>
          </p>
        </div>
      </article>
    </main>
  );
}
