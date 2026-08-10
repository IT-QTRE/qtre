import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const token = (await getToken()) ?? undefined;
  const currentUser = await fetchQuery(api.users.current, {}, { token });
  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "super_admin")) {
    // No Convex row (or the wrong role) means no access, even with a valid
    // Clerk session — Admin/Super Admin rows are never auto-provisioned.
    redirect("/");
  }

  return <>{children}</>;
}
