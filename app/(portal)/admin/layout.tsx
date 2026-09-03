import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";
import { AdminWorkspace } from "@/components/admin/admin-workspace";

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

  // Per-account Admin-access restrictions (see convex/users.ts
  // `updateResourceAccess`) live directly on the actor's own row — no
  // extra query needed. Always empty for super_admin.
  const disabledResources = currentUser.disabledResources ?? [];

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-s-3 focus:top-3 focus:z-50 focus:bg-background focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to main content
      </a>
      <AdminSidebar userName={currentUser.name} userRole={currentUser.role} disabledResources={disabledResources} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminMobileHeader
          userName={currentUser.name}
          userRole={currentUser.role}
          disabledResources={disabledResources}
        />
        <AdminWorkspace>{children}</AdminWorkspace>
      </div>
    </div>
  );
}
