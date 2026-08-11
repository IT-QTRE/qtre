import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import Link from "next/link";
import { Building2, MapPin, UserRound, Building, Home, Inbox, Newspaper } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

const COUNT_CARDS = [
  { label: "Properties", href: "/admin/properties", icon: Home, query: api.properties.list },
  { label: "Projects", href: "/admin/projects", icon: Building, query: api.projects.list },
  { label: "Developers", href: "/admin/developers", icon: Building2, query: api.developers.list },
  { label: "Communities", href: "/admin/communities", icon: MapPin, query: api.communities.list },
  { label: "Agents", href: "/admin/agents", icon: UserRound, query: api.agents.list },
  { label: "Leads", href: "/admin/leads", icon: Inbox, query: api.leads.list },
  { label: "Blog Posts", href: "/admin/blog", icon: Newspaper, query: api.blogPosts.list },
] as const;

export default async function AdminHomePage() {
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;

  const [currentUser, developers, agents, communities, projects, properties, leads, blogPosts] =
    await Promise.all([
      fetchQuery(api.users.current, {}, { token }),
      fetchQuery(api.developers.list, {}, { token }),
      fetchQuery(api.agents.list, {}, { token }),
      fetchQuery(api.communities.list, {}, { token }),
      fetchQuery(api.projects.list, {}, { token }),
      fetchQuery(api.properties.list, {}, { token }),
      fetchQuery(api.leads.list, {}, { token }),
      fetchQuery(api.blogPosts.list, {}, { token }),
    ]);
  const counts = {
    Developers: developers.length,
    Agents: agents.length,
    Communities: communities.length,
    Projects: projects.length,
    Properties: properties.length,
    Leads: leads.length,
    "Blog Posts": blogPosts.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back{currentUser?.name ? `, ${currentUser.name}` : ""}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-muted-foreground">
          Signed in as
          <Badge variant="secondary">{currentUser?.role}</Badge>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {COUNT_CARDS.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex items-center gap-4 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:bg-muted"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <card.icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{counts[card.label]}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
