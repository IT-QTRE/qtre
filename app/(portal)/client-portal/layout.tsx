import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/client-portal");
  }

  const token = (await getToken()) ?? undefined;
  // Provisions the row on a self-service signup's first-ever visit — the
  // only portal where a missing row is filled in with a default role
  // ("client") rather than denied.
  await fetchAction(api.users.ensureUserProvisioned, {}, { token });

  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || currentUser.role !== "client") {
    redirect("/");
  }

  return <>{children}</>;
}
