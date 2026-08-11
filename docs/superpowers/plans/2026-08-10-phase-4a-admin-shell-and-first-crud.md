# Phase 4a — Admin Shell + DataTable + Developers/Agents/Communities CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin dashboard shell (sidebar/header/layout) and the first three CRUD entities — Developers, Agents, Communities — chosen because none of them reference any other not-yet-built entity. Also builds the two shared pieces every later Phase 4 sub-phase reuses: a generic `DataTable` (TanStack Table + shadcn) and a `LocalizedTextField` form component for `LocalizedText` fields. This is sub-phase 4a of 4 — see `c:\Users\TUF F16\.cursor\plans\phase_4_sub-phase_roadmap_32646a22.plan.md` for the full Phase 4 roadmap (4b: Projects/Properties, 4c: Leads/Blog/Media library/Users/Settings/Audit logs, 4d: the two portals + submission review).

**Architecture decisions (new this sub-phase, beyond the roadmap's shared decisions):**

1. **Convex mutations always set `publishing.updatedAt`/`publishedAt` server-side**, never trust a client-supplied timestamp. `create`/`update` mutation args accept only `slug`/`status` for the publishing sub-object (not the full `PublishingFields` shape) — the handler builds `updatedAt: Date.now()` itself and sets `publishedAt` once, the first time `status` becomes `"published"`, preserving it afterward.
2. **Slug uniqueness is enforced in the mutation, not the schema** — Convex has no unique-index constraint. `create`/`update` for Developers and Agents query the `by_publishing_slug` index for a same-slug row (excluding self on update) and throw if found. Communities checks `by_country_and_slug` (slug only needs to be unique per country). No generic cross-table helper — Convex's typed index builders don't generalize cleanly across tables with different index shapes, so each entity file writes its own ~3-line check.
3. **Create is fields-only; media upload only exists on the Edit view.** The Phase 3 `MediaUploader` needs a real `entityId`, which doesn't exist until the record is first saved. So every entity's Create dialog collects text/select fields only; on success it redirects straight into that record's Edit page, where the `MediaUploader` becomes available. This convention carries forward into 4b (Projects/Properties) and 4c (Blog).
4. **List = dialog for Create, dedicated page for Edit.** Simple entities (Developers/Agents/Communities here; Leads/Website-Settings later) use a shadcn `Dialog` for the fields-only Create step, then a dedicated `/admin/<entity>/[id]` route for Edit (full form + media). This avoids cramming a form-plus-media-gallery into a modal.
5. **No React component unit tests.** This project has no `@testing-library/react` (only `vitest` + `convex-test`, used for backend/pure logic). Convex functions and any pure helpers get real tests as in Phases 0-3; React components (forms, `DataTable`, admin shell) are verified by manual click-through in Task 11, mirroring Phase 3's Task 13 approach for `MediaUploader`.
6. **`DataTable` handles client-side sorting/filtering/pagination** (no server-side pagination) — Developers/Agents/Communities are low-cardinality tables (tens, not thousands, of rows), so `list` queries `.collect()` the full table and `@tanstack/react-table` does the rest in the browser. Revisit if a later entity (Properties) needs server-side pagination.
7. **Admin dashboard nav only lists screens that exist.** `/admin`, `/admin/developers`, `/admin/agents`, `/admin/communities` after this sub-phase — each later sub-phase adds its own nav items when it lands, rather than pre-listing "coming soon" dead links.

## Global Constraints

- **No agent runs `git add` or `git commit` — ever, for any task.** All changes stay uncommitted. Every "Commit" step is replaced by a "Do not commit" note.
- A `npx convex dev` watch process is already running (per the user) — check its terminal output for a successful sync after any `convex/` change instead of running `npx convex dev --once`.
- Role is derived server-side via `ctx.auth.getUserIdentity().tokenIdentifier` (through `requireRole`) — never a client-supplied `userId`/role, consistent with every prior phase.
- Every sensitive mutation (`create`/`update`/`remove` on Developers/Agents/Communities) calls `writeAuditLog` after the role check succeeds, per `foundation.mdc`'s security checklist and this project's own established pattern (`convex/agentInvitations.ts`).
- `convex/lib/roles.ts`'s `PERMISSION_MATRIX` already covers `developers`/`agents`/`communities` for all 4 roles (Task 1 of Phase 1) — no changes needed there.
- Use existing `lib/validation/developers.ts`, `agents.ts`, `communities.ts` Zod schemas for client-side form validation — do not redefine field shapes.
- shadcn components install with `npx shadcn@latest add <name>` (project style is `base-luma`, already configured in `components.json` — this pulls the project's configured style, not shadcn's stock default).
- Icons: `lucide-react` only, per `foundation.mdc`. Toasts: `sonner`, imported as `import { toast } from "sonner"`.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `components/ui/{table,dialog,alert-dialog,sheet,tabs,input,textarea,label,select,form,dropdown-menu,badge,sonner,separator,skeleton}.tsx` | Create (via CLI) | shadcn primitives needed by the shell + forms + DataTable |
| `app/(portal)/layout.tsx` | Modify | Add `<Toaster />`, tighten `<body>` classes per `foundation.mdc` |
| `components/admin/admin-nav-items.ts` | Create | Single source of truth for nav items, shared by sidebar + mobile sheet |
| `components/admin/admin-sidebar.tsx` | Create | Fixed desktop sidebar (`hidden md:flex`), active-link highlighting |
| `components/admin/admin-mobile-header.tsx` | Create | Mobile header + `Sheet` drawer, same nav items |
| `app/(portal)/admin/layout.tsx` | Modify | Wrap `{children}` with the shell (sidebar + header + scrollable `<main>`) around the existing auth guard |
| `app/(portal)/admin/page.tsx` | Modify | Real dashboard overview (welcome + role badge; entity counts wired in Task 11) |
| `components/admin/data-table.tsx` | Create | Generic `DataTable`: sorting, global filter, pagination, column visibility, row selection, bulk actions slot |
| `components/admin/data-table-column-header.tsx` | Create | Sortable column header button used in column defs |
| `components/forms/localized-text-field.tsx` | Create | Per-locale (en/ar/tr) tabbed input/textarea, RTL-aware, wired to RHF via a `name` prefix |
| `convex/lib/slugs.test.ts` / inline checks | — | No shared helper (see decision 2) — each entity file below has its own check + test |
| `convex/developers.ts`, `convex/developers.test.ts` | Create | `list`, `get`, `create`, `update`, `remove` |
| `components/admin/developers/developer-columns.tsx` | Create | `DataTable` column defs for Developers |
| `components/admin/developers/developer-create-dialog.tsx` | Create | Fields-only create dialog |
| `components/admin/developers/developer-edit-form.tsx` | Create | Full form (all fields) + `MediaUploader` |
| `app/(portal)/admin/developers/page.tsx` | Create | List page |
| `app/(portal)/admin/developers/[id]/page.tsx` | Create | Edit page |
| `convex/agents.ts`, `convex/agents.test.ts` | Create | Mirrors `developers.ts` (see Task 7 deltas) |
| `components/admin/agents/*`, `app/(portal)/admin/agents/**` | Create | Mirrors Developers' UI (Task 8 deltas) |
| `convex/communities.ts`, `convex/communities.test.ts` | Create | Mirrors `developers.ts` (see Task 9 deltas) |
| `components/admin/communities/*`, `app/(portal)/admin/communities/**` | Create | Mirrors Developers' UI (Task 10 deltas) |
| `PLAN.md` | Modify | Check off the 5 Phase 4 items this sub-phase completes |
| `TECH_STACK.md` | Modify | Document the shell, `DataTable`, `LocalizedTextField`, and Create→Edit-for-media convention |

---

### Task 1: Install shadcn primitives + wire up `sonner`

**Files:**
- Create (via CLI): `components/ui/{table,dialog,alert-dialog,sheet,tabs,input,textarea,label,select,form,dropdown-menu,badge,sonner,separator,skeleton}.tsx`
- Modify: `app/(portal)/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: the primitive set every later task in this sub-phase (and 4b/4c/4d) builds on.

- [ ] **Step 1: Install primitives**

```bash
npx shadcn@latest add table dialog alert-dialog sheet tabs input textarea label select form dropdown-menu badge sonner separator skeleton
```

- [ ] **Step 2: Wire `<Toaster />` into the portal root layout**

In `app/(portal)/layout.tsx`, import `Toaster` from `@/components/ui/sonner` and render it inside `<body>`, alongside tightening the body classes per `foundation.mdc`:

```tsx
<body className={cn("min-h-full", "flex flex-col overflow-x-hidden")}>
  <ClerkProvider>
    <ConvexClientProvider>{children}</ConvexClientProvider>
  </ClerkProvider>
  <Toaster richColors position="top-right" />
</body>
```

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit` — both clean.

- [ ] **Step 4: Do not commit**

---

### Task 2: Admin shell — sidebar, mobile header, dashboard overview

**Files:**
- Create: `components/admin/admin-nav-items.ts`, `components/admin/admin-sidebar.tsx`, `components/admin/admin-mobile-header.tsx`
- Modify: `app/(portal)/admin/layout.tsx`, `app/(portal)/admin/page.tsx`

**Interfaces:**
- Consumes: Task 1's primitives; the existing auth-guard logic already in `app/(portal)/admin/layout.tsx` (`currentUser.name`/`.role`).
- Produces: the shell every `/admin/*` page (this sub-phase and every later one) renders inside.

- [ ] **Step 1: Shared nav items list**

```ts
// components/admin/admin-nav-items.ts
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Building2, UserRound, MapPin } from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Developers", href: "/admin/developers", icon: Building2 },
  { label: "Agents", href: "/admin/agents", icon: UserRound },
  { label: "Communities", href: "/admin/communities", icon: MapPin },
];
```

- [ ] **Step 2: Desktop sidebar** (`"use client"`, uses `usePathname()` for active-link state, per `foundation.mdc`'s fixed-sidebar pattern)

```tsx
// components/admin/admin-sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./admin-nav-items";

export function AdminSidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r bg-sidebar md:flex md:flex-col">
      <div className="flex h-14 shrink-0 items-center border-b px-4 font-heading font-semibold">Qtre Admin</div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <p className="truncate px-3 text-xs text-muted-foreground">{userName} · {userRole}</p>
        <SignOutButton>
          <Button variant="ghost" className="w-full justify-start">Sign Out</Button>
        </SignOutButton>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Mobile header + `Sheet` drawer** — same `ADMIN_NAV_ITEMS`, current page title derived from `pathname` (per `foundation.mdc`: "Both sidebar and mobile header must have identical nav items").

- [ ] **Step 4: Wrap the shell around the existing auth guard**

In `app/(portal)/admin/layout.tsx`, after the existing redirect checks, render:

```tsx
return (
  <div className="flex h-dvh w-full overflow-hidden">
    <AdminSidebar userName={currentUser.name} userRole={currentUser.role} />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <AdminMobileHeader userName={currentUser.name} userRole={currentUser.role} />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">{children}</main>
    </div>
  </div>
);
```

- [ ] **Step 5: Dashboard overview page**

Replace the `AdminHomePage` placeholder with a welcome header + role badge (`components/ui/badge`). Real entity counts are wired in Task 11, once Developers/Agents/Communities queries exist.

- [ ] **Step 6: Manual verify**

Sign in as an admin/super_admin, confirm the shell renders on `/admin`, sidebar links navigate (404 is fine for `/admin/developers` etc. until later tasks), sign-out works, mobile drawer opens below `md:`.

- [ ] **Step 7: Do not commit**

---

### Task 3: Reusable `DataTable`

**Files:**
- Create: `components/admin/data-table.tsx`, `components/admin/data-table-column-header.tsx`

**Interfaces:**
- Consumes: `@tanstack/react-table` (already a dependency), Task 1's `Table`/`Input`/`DropdownMenu`/`Button` primitives.
- Produces: `<DataTable columns={...} data={...} searchKey="name" bulkActions={...} />`, reused by every list screen in this and every later sub-phase.

- [ ] **Step 1: Column header helper** (sortable button, per-column, used inside column defs)

```tsx
// components/admin/data-table-column-header.tsx
import type { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DataTableColumnHeader<TData>({ column, title }: { column: Column<TData>; title: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {title}
      <ArrowUpDown className="ml-1.5 size-3.5" />
    </Button>
  );
}
```

- [ ] **Step 2: Generic `DataTable`** — sorting, global text filter (via `searchKey`'s column, or a global filter fn), pagination, column-visibility dropdown, row selection with a `bulkActions` slot rendered only when rows are selected.

```tsx
// components/admin/data-table.tsx
"use client";
import { useState } from "react";
import {
  type ColumnDef, type SortingState, flexRender, getCoreRowModel,
  getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
  filterColumnId?: string;
  bulkActions?: (selected: TData[]) => React.ReactNode;
};

export function DataTable<TData>({ columns, data, searchPlaceholder, filterColumnId, bulkActions }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: filterColumnId
      ? (row, _id, value) => String(row.getValue(filterColumnId)).toLowerCase().includes(value.toLowerCase())
      : "auto",
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={searchPlaceholder ?? "Search..."}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {bulkActions && selectedRows.length > 0 && bulkActions(selectedRows)}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

(Column-visibility dropdown can be added as a small follow-up inside this same task if time allows — not blocking for 4a's 3 simple entities, which have few enough columns not to need hiding.)

- [ ] **Step 3: Verify**

Run: `npm run lint && npx tsc --noEmit`. Real manual verification happens once Task 6 wires real data through it.

- [ ] **Step 4: Do not commit**

---

### Task 4: Reusable `LocalizedTextField`

**Files:**
- Create: `components/forms/localized-text-field.tsx`

**Interfaces:**
- Consumes: `react-hook-form`'s `useFormContext`/`Controller` (form must be wrapped in RHF's `<Form>`/`FormProvider`), Task 1's `Tabs`/`Input`/`Textarea`/`Label`.
- Produces: `<LocalizedTextField name="name" label="Name" required />` — renders en/ar/tr tabs, wired to RHF fields `${name}.en` / `${name}.ar` / `${name}.tr`. Reused by every entity form in every remaining Phase 4 sub-phase.

- [ ] **Step 1: Implement**

```tsx
// components/forms/localized-text-field.tsx
"use client";
import { Controller, useFormContext } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const LOCALES = [
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "ar", label: "Arabic", dir: "rtl" as const },
  { code: "tr", label: "Turkish", dir: "ltr" as const },
];

export function LocalizedTextField({
  name, label, required, multiline,
}: { name: string; label: string; required?: boolean; multiline?: boolean }) {
  const { control } = useFormContext();
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Tabs defaultValue="en">
        <TabsList>
          {LOCALES.map((l) => <TabsTrigger key={l.code} value={l.code}>{l.label}</TabsTrigger>)}
        </TabsList>
        {LOCALES.map((l) => (
          <TabsContent key={l.code} value={l.code}>
            <Controller
              control={control}
              name={`${name}.${l.code}`}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  {multiline ? (
                    <Textarea dir={l.dir} rows={5} {...field} value={field.value ?? ""} />
                  ) : (
                    <Input dir={l.dir} {...field} value={field.value ?? ""} />
                  )}
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npx tsc --noEmit`. Real manual verification happens once Task 6 uses it inside an actual form.

- [ ] **Step 3: Do not commit**

---

### Task 5: Developers — Convex backend

**Files:**
- Create: `convex/developers.ts`, `convex/developers.test.ts`

**Interfaces:**
- Consumes: `requireRole` (`convex/lib/permissions.ts`), `writeAuditLog` (`convex/lib/auditLog.ts`), `localizedTextValidator`, `seoFieldsValidator`.
- Produces: `api.developers.{list,get,create,update,remove}`, consumed by Task 6's UI.

- [ ] **Step 1: Write tests first** (TDD) covering: `list` requires `developers:read`; `create` requires `developers:create`, sets `publishing.updatedAt` server-side, rejects a duplicate slug; `update` preserves `publishedAt` once set and rejects a duplicate slug (excluding self); `remove` requires `developers:delete` and calls `writeAuditLog`.

- [ ] **Step 2: Implement** `convex/developers.ts`

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./lib/permissions";
import { writeAuditLog } from "./lib/auditLog";
import { localizedTextValidator } from "./lib/localizedText";
import { seoFieldsValidator } from "./lib/seoFields";

const statusValidator = v.union(v.literal("draft"), v.literal("published"), v.literal("archived"));

async function assertSlugAvailable(ctx: any, slug: string, excludeId?: string) {
  const existing = await ctx.db.query("developers").withIndex("by_publishing_slug", (q: any) => q.eq("publishing.slug", slug)).unique().catch(() => null);
  if (existing && existing._id !== excludeId) {
    throw new Error(`Slug "${slug}" is already in use`);
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "developers", "read");
    return await ctx.db.query("developers").collect();
  },
});

export const get = query({
  args: { id: v.id("developers") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "developers", "read");
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "create");
    await assertSlugAvailable(ctx, args.slug);
    const { slug, status, ...rest } = args;
    const now = Date.now();
    const id = await ctx.db.insert("developers", {
      ...rest,
      publishing: { slug, status, updatedAt: now, publishedAt: status === "published" ? now : undefined },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "create", targetId: id });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("developers"),
    name: localizedTextValidator,
    description: v.optional(localizedTextValidator),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    seo: v.optional(seoFieldsValidator),
    slug: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "update");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Developer not found");
    await assertSlugAvailable(ctx, args.slug, args.id);
    const { id, slug, status, ...rest } = args;
    const now = Date.now();
    await ctx.db.patch(id, {
      ...rest,
      publishing: {
        slug, status, updatedAt: now,
        publishedAt: status === "published" ? existing.publishing.publishedAt ?? now : existing.publishing.publishedAt,
      },
    });
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "update", targetId: id });
  },
});

export const remove = mutation({
  args: { id: v.id("developers") },
  handler: async (ctx, args) => {
    const actor = await requireRole(ctx, "developers", "delete");
    await ctx.db.delete(args.id);
    await writeAuditLog(ctx, { actorUserId: actor._id, resource: "developers", action: "delete", targetId: args.id });
  },
});
```

Note: the `any` types in `assertSlugAvailable` are a placeholder for the plan doc's readability — the actual implementation should use Convex's generated `QueryCtx`/`MutationCtx` types (no real `any`, consistent with this project's `strict: true` + no-`any` convention from Phase 1).

- [ ] **Step 3: Run tests**

Run: `npm run test:once` — new tests passing, no regressions.

- [ ] **Step 4: Verify types**

Confirm `npx convex dev`'s terminal shows a successful sync (codegen picks up `api.developers.*`), then run `npx tsc --noEmit`.

- [ ] **Step 5: Do not commit**

---

### Task 6: Developers — Admin UI

**Files:**
- Create: `components/admin/developers/developer-columns.tsx`, `developer-create-dialog.tsx`, `developer-edit-form.tsx`
- Create: `app/(portal)/admin/developers/page.tsx`, `app/(portal)/admin/developers/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.developers.*` (Task 5), `DataTable` (Task 3), `LocalizedTextField` (Task 4), `MediaUploader` (Phase 3), `lib/validation/developers.ts`'s `developerSchema`.
- Produces: the working `/admin/developers` screen — the template Tasks 7-10 copy for Agents/Communities.

- [ ] **Step 1: Column defs** — Name (en), Slug, Status (`Badge`, color by status), Email, row actions (`DropdownMenu`: Edit → `/admin/developers/[id]`, Delete → `AlertDialog` confirm calling `remove`, toast on success/error).

- [ ] **Step 2: Create dialog** (fields-only: name, description, website, phone, email, slug, status — no SEO/media here, keeps the create step fast) — RHF + `zodResolver(developerSchema.omit({ seo: true, publishing: true }).extend({ slug: ..., status: ... }))`-shaped subset, or a dedicated smaller Zod schema for just the create step. On submit: call `create`, `toast.success`, close dialog, `router.push(`/admin/developers/${id}`)`.

- [ ] **Step 3: List page**

```tsx
// app/(portal)/admin/developers/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DataTable } from "@/components/admin/data-table";
import { developerColumns } from "@/components/admin/developers/developer-columns";
import { DeveloperCreateDialog } from "@/components/admin/developers/developer-create-dialog";

export default function DevelopersPage() {
  const developers = useQuery(api.developers.list);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Developers</h1>
          <p className="text-muted-foreground">Manage real estate developer profiles.</p>
        </div>
        <DeveloperCreateDialog />
      </div>
      {developers === undefined ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <DataTable columns={developerColumns} data={developers} searchPlaceholder="Search developers..." filterColumnId="name" />
      )}
    </div>
  );
}
```

(Note: `filterColumnId="name"` filters against the raw `name` object unless the column's `accessorFn` flattens it to `name.en` — column defs should expose a flat string accessor for filtering to work correctly; call this out explicitly in Step 1's column defs.)

- [ ] **Step 4: Edit page** — full form (all `developerSchema` fields including SEO, using `LocalizedTextField` for `name`/`description`/`seo.seoTitle`/`seo.seoDescription`) + `<MediaUploader entityType="developer" entityId={id} />` below the form. Loading/not-found states per `foundation.mdc`.

- [ ] **Step 5: Manual verify**

Create a developer → redirected to its edit page → edit fields, save → upload a logo image via `MediaUploader` → confirm it displays → delete from the list page with the confirm dialog → confirm the row disappears and a toast fires.

- [ ] **Step 6: Do not commit**

---

### Task 7: Agents — Convex backend

**Files:**
- Create: `convex/agents.ts`, `convex/agents.test.ts`

Mirrors Task 5 exactly, with these deltas:
- `name` is `v.string()` (not `LocalizedText` — see the schema's own comment: people's names aren't translated).
- `email` is required (not optional).
- `bio` is the optional `LocalizedText` field (in place of Developers' `description`).
- `userId: v.optional(v.id("users"))` accepted in `create`/`update` args (links an Agent profile to a Clerk-backed `users` row created via Phase 2's invite flow) — no extra validation needed here (an invalid/nonexistent id just fails to resolve later; not a security concern since this is an Admin-only mutation).
- Same slug-uniqueness pattern against `by_publishing_slug`.

- [ ] **Step 1: Tests first**, mirroring Task 5's Step 1 with Agent-specific field names.
- [ ] **Step 2: Implement** `convex/agents.ts`.
- [ ] **Step 3: Run tests** — `npm run test:once`.
- [ ] **Step 4: Verify types** — confirm Convex sync, `npx tsc --noEmit`.
- [ ] **Step 5: Do not commit**

---

### Task 8: Agents — Admin UI

**Files:**
- Create: `components/admin/agents/*` (columns, create dialog, edit form), `app/(portal)/admin/agents/page.tsx`, `app/(portal)/admin/agents/[id]/page.tsx`

Mirrors Task 6 exactly, with these deltas:
- Create dialog: `name` (plain `Input`, not `LocalizedTextField`), `email` (required), `phone`, `slug`, `status`.
- Edit form: adds `bio` (`LocalizedTextField`, multiline), a `userId` display/link field (read-only text showing the linked Clerk account's email if set — no picker UI needed yet since Phase 2's invite flow is the only way a `userId` gets set; wiring an admin-side "link an existing account" picker is out of scope for 4a).
- `<MediaUploader entityType="agent" entityId={id} />` for the agent's photo.
- Columns: Name, Slug, Status, Email, Phone, Actions.

- [ ] **Step 1: Column defs**
- [ ] **Step 2: Create dialog**
- [ ] **Step 3: List page**
- [ ] **Step 4: Edit page**
- [ ] **Step 5: Manual verify** (same click-through as Task 6, Step 5)
- [ ] **Step 6: Do not commit**

---

### Task 9: Communities — Convex backend

**Files:**
- Create: `convex/communities.ts`, `convex/communities.test.ts`

Mirrors Task 5 exactly, with these deltas:
- Adds required `countryCode: v.string()` and required `city: localizedTextValidator`.
- Slug uniqueness is checked **per country**, against the `by_country_and_slug` index (`q.eq("countryCode", args.countryCode).eq("publishing.slug", args.slug)`), not globally — two communities in different countries may legitimately share a slug.
- No `by_publishing_slug` index exists on this table (per `convex/schema.ts`) — don't reference it.

- [ ] **Step 1: Tests first**, including a case confirming the same slug is allowed in two different `countryCode`s but rejected within the same one.
- [ ] **Step 2: Implement** `convex/communities.ts`.
- [ ] **Step 3: Run tests** — `npm run test:once`.
- [ ] **Step 4: Verify types** — confirm Convex sync, `npx tsc --noEmit`.
- [ ] **Step 5: Do not commit**

---

### Task 10: Communities — Admin UI

**Files:**
- Create: `components/admin/communities/*`, `app/(portal)/admin/communities/page.tsx`, `app/(portal)/admin/communities/[id]/page.tsx`

Mirrors Task 6 exactly, with these deltas:
- Create dialog adds `countryCode` (plain `Input`, uppercase 2-letter — validate client-side against the same regex as `lib/validation/communities.ts`) and `city` (`LocalizedTextField`).
- Edit form adds `city` alongside `name`/`description`.
- `<MediaUploader entityType="community" entityId={id} />` for the hero image.
- Columns: Name, Country, City, Slug, Status, Actions.

- [ ] **Step 1: Column defs**
- [ ] **Step 2: Create dialog**
- [ ] **Step 3: List page**
- [ ] **Step 4: Edit page**
- [ ] **Step 5: Manual verify**, including confirming two communities with the same slug in different countries both save successfully, and a same-country duplicate is rejected with a clear toast error.
- [ ] **Step 6: Do not commit**

---

### Task 11: Verification, dashboard counts, and docs

**Files:**
- Modify: `app/(portal)/admin/page.tsx`, `PLAN.md`, `TECH_STACK.md`

- [ ] **Step 1: Wire real counts into the dashboard**

Add three small `useQuery`-backed count cards (Developers/Agents/Communities) to `/admin`, now that all three `list` queries exist.

- [ ] **Step 2: Full automated verification**

Run: `npm run test:once && npm run lint && npx tsc --noEmit` — all clean, no regressions from Phases 0-3's existing tests.

- [ ] **Step 3: Full manual click-through**

Re-walk Tasks 6/8/10's manual-verify steps once more end-to-end in one sitting (create → edit → media upload → delete, for each of the 3 entities), plus: mobile drawer navigation, sign-out, and confirming a `client`/`agent`-role account is correctly denied (redirected) if it tries to hit `/admin` directly (existing `app/(portal)/admin/layout.tsx` guard, unchanged this sub-phase).

- [ ] **Step 4: Update `PLAN.md`**

Check off these 5 Phase 4 items (leave the remaining 9 unchecked for 4b/4c/4d):
- Admin shell: sidebar nav, dashboard overview page, layout separate from public site
- Reusable `DataTable` component
- Developers CRUD
- Agents CRUD
- Communities CRUD

- [ ] **Step 5: Update `TECH_STACK.md`**

Document: the admin shell structure, the `DataTable`/`LocalizedTextField` shared components, the Create-dialog-then-redirect-to-Edit-for-media convention, and the per-entity slug-uniqueness enforcement pattern (global vs. per-country).

- [ ] **Step 6: Do not commit**
