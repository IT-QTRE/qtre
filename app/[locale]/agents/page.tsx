import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { AgentDirectory } from "@/components/public/agent-directory";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, tSection, tCatalog, tBrand, agents] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.listPublishedAgents, {}),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("agentsTitle");
  const description = agents.length > 0 ? tCatalog("agentsMetaDescription") : tSection("agentsBody");
  const canonical = `${siteUrl}/${locale}/agents`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
  };
}

export default async function AgentsPage() {
  const [tSection, tCatalog, tBrand, agents] = await Promise.all([
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.listPublishedAgents, {}),
  ]);

  return (
    <AgentDirectory
      title={tSection("agentsTitle")}
      intro={tCatalog("agentsIntro")}
      empty={tSection("agentsBody")}
      countLabel={agents.length > 0 ? tCatalog("agentCount", { count: agents.length }) : null}
      listLabel={tCatalog("agentListLabel")}
      firmName={tBrand("name")}
      emailLabel={tCatalog("inquireEmail")}
      phoneLabel={tCatalog("inquirePhone")}
      viewLabel={tCatalog("agentView")}
      agents={agents.map((agent) => ({
        id: agent._id,
        name: agent.name,
        position: agent.position,
        imageUrl: agent.imageUrl,
        href: `/agents/${agent.slug}`,
        email: agent.email,
        phone: agent.phone,
      }))}
    />
  );
}
