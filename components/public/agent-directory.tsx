import { AgentProfileCard, type AgentRow } from "@/components/public/agent-profile-card";
import { CatalogEmpty } from "@/components/public/catalog-empty";
import { DirectoryHero } from "@/components/public/directory-hero";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function AgentDirectory({
  title,
  intro,
  empty,
  countLabel,
  listLabel,
  firmName,
  emailLabel,
  phoneLabel,
  viewLabel,
  agents,
}: {
  title: string;
  intro: string;
  empty: string;
  countLabel: string | null;
  listLabel: string;
  firmName: string;
  emailLabel: string;
  phoneLabel: string;
  viewLabel: string;
  agents: AgentRow[];
}) {
  const firstPhoto = agents.findIndex((agent) => agent.imageUrl);

  return (
    <main id="main">
      <DirectoryHero
        title={title}
        intro={intro}
        countLabel={countLabel}
        headingId="agent-directory-heading"
      />

      {agents.length === 0 ? (
        <div className={cn("py-16 sm:py-20", publicGutter)}>
          <CatalogEmpty>{empty}</CatalogEmpty>
        </div>
      ) : (
        <section aria-label={listLabel} className="bg-background text-foreground">
          <ul
            className={cn(
              "grid grid-cols-1 gap-8 py-16 sm:py-20 lg:grid-cols-2 lg:gap-10 lg:py-24",
              publicGutter,
            )}
          >
            {agents.map((agent, index) => (
              <li key={agent.id}>
                <AgentProfileCard
                  agent={agent}
                  firmName={firmName}
                  emailLabel={emailLabel}
                  phoneLabel={phoneLabel}
                  viewLabel={viewLabel}
                  eager={index === firstPhoto}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
