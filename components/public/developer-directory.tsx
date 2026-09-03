import { CatalogEmpty } from "@/components/public/catalog-empty";
import { DeveloperLogoMarquee } from "@/components/public/developer-logo-marquee";
import { DeveloperNameLink, type DeveloperRow } from "@/components/public/developer-name-link";
import { DirectoryHero } from "@/components/public/directory-hero";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function DeveloperDirectory({
  title,
  intro,
  empty,
  countLabel,
  marksLabel,
  listLabel,
  developers,
}: {
  title: string;
  intro: string;
  empty: string;
  countLabel: string | null;
  marksLabel: string;
  listLabel: string;
  developers: DeveloperRow[];
}) {
  const marks = developers.filter((developer) => developer.imageUrl);

  return (
    <main id="main">
      <DirectoryHero
        title={title}
        intro={intro}
        countLabel={countLabel}
        headingId="developer-directory-heading"
      />

      {developers.length === 0 ? (
        <div className={cn("py-16 sm:py-20", publicGutter)}>
          <CatalogEmpty>{empty}</CatalogEmpty>
        </div>
      ) : (
        <>
          {marks.length > 0 ? <DeveloperLogoMarquee items={marks} label={marksLabel} /> : null}
          <section aria-label={listLabel} className="bg-background text-foreground">
            <ul className={cn("border-b border-foreground/10", publicGutter)}>
              {developers.map((developer) => (
                <li key={developer.id} className="border-t border-foreground/10">
                  <DeveloperNameLink developer={developer} scale="directory" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
