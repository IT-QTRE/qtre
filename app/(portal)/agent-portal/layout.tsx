import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function AgentPortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/agent-portal");
  }

  const token = (await getToken()) ?? undefined;
  // Provisions the row on an invited Agent's first-ever visit (reads their
  // Clerk public_metadata.role, set by convex/agentInvitations.ts at invite
  // time) — a no-op if the row already exists.
  await fetchAction(api.users.ensureUserProvisioned, {}, { token });

  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || currentUser.role !== "agent") {
    redirect("/");
  }

  return <>{children}</>;
}
