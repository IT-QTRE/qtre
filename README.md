# QuickTalk Real Estate (QTRE)

Dubai brokerage site: published sale, rent, and off-plan inventory, plus developers, team, areas, services, blog, and contact. Admin authors the catalog in Convex. Public locales are English, Arabic, and Turkish.

Live: [qtre.vercel.app](https://qtre.vercel.app). Custom domain (`quicktalkbusiness.com`) is planned; that host still serves QuickTalk Business until DNS cutover.

Voice and brand are locked in `ABOUT.md` and `BRAND.md`. Do not invent testimonials, ROI, office address, hours, or stock photos as listing proof.

## Stack

- **Next.js 16** (App Router) on **Vercel**
- **Convex** (data, listing inquiries, admin)
- **Clerk** (admin / future portals)
- **next-intl** (`en`, `ar`, `tr`)
- **GoHighLevel** iframe on Contact only (CRM; not the Convex Leads table)
- **Vercel Blob** (public listing media; private store reserved for client submissions)
- **Google Maps** (admin pin; public embed when coordinates exist)

## Routes

Public URLs are locale-prefixed (`/en`, `/ar`, `/tr`):

| Path | What |
| --- | --- |
| `/` | Home |
| `/properties?status=sale` / `?status=rent` | Buy / Rent |
| `/properties/{slug}` | Listing |
| `/projects`, `/projects/{slug}` | Off-plan |
| `/communities`, `/developers`, `/agents` | Areas, houses, team (`/agents` stays the URL; public nav says Team) |
| `/services`, `/services/visa/{desk}`, `/services/license/{action}` | QTRE wrap plus visa / license desks |
| `/blog`, `/about`, `/contact` | Notes, About, GHL form + published email / phone / WhatsApp |

Staff:

| Path | What |
| --- | --- |
| `/admin` | Catalog, leads (listing/project inquiries only), settings |
| `/sign-in`, `/sign-up` | Clerk |
| `/agent-portal`, `/client-portal` | Placeholders. Do not ship a List Your Property funnel until the client portal exists. |

## Leads

- **Contact form** → GoHighLevel. Paste the iframe src in Admin → Website Settings. White-label host `go.quicktalkbusiness.com` is allowed. These submissions do not appear in `/admin/leads`.
- **Listing / project inquire** → Convex `leads` (honeypot). Assigned to the listing agent when one exists.

## Local development

Two processes:

```bash
npm install
cp .env.example .env.local   # then fill keys
npx convex dev               # keep running
npm run dev                  # http://localhost:3000
```

```bash
npm run lint
npm run test:once
npm run build                # needs NEXT_PUBLIC_SITE_URL in .env.local
```

Public pages need `npx convex dev` (or a deployed Convex URL). Admin needs Clerk keys in `.env.local`.

## Environment

See `.env.example`. Summary:

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Local: `http://localhost:3000`. Vercel Production: the live origin (`https://qtre.vercel.app` until the custom domain). Required for `next build`. |
| `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOYMENT` | From `npx convex dev`. Production Vercel must use the **prod** Convex URL, not the personal dev deployment. |
| Clerk `NEXT_PUBLIC_*` / `CLERK_SECRET_KEY` / `CLERK_JWT_ISSUER_DOMAIN` | Clerk Dashboard. JWT issuer also belongs on the Convex deployment (`npx convex env set`). Development keys are fine for `qtre.vercel.app` until a Clerk Production instance exists. Add the live origin in Clerk allowed domains before using `/sign-in` or `/admin` there. |
| `BLOB_READ_WRITE_TOKEN` / `PRIVATE_BLOB_READ_WRITE_TOKEN` | Two Blob stores. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript, Places (New), Geocoding. Restrict by HTTP referrer. |

`NEXT_PUBLIC_*` values are baked in at **build** time on Vercel. Changing them requires a redeploy. Publishable Clerk / Convex / site URL variables are **Config**, not Secret. `CLERK_SECRET_KEY` is Secret.

## Deploy

- **Convex prod:** `npx convex deploy` (project production deployment). Local `npx convex dev` stays on the personal **dev** deployment. Prod is a separate database; it does not copy listings from dev unless you import them.
- **Vercel:** GitHub `main` → production. Set Production env to prod Convex + the public site origin + Clerk (same instance as the Convex JWT issuer).
- Do not put `CONVEX_DEPLOYMENT=dev:…` on Vercel.

Convex prod also needs `CLERK_JWT_ISSUER_DOMAIN` and `CLERK_SECRET_KEY` (`npx convex env set --prod …`).

## Still open

Tracked in `PLAN.md`. Notable gaps: Agent Portal and Client Portal, SEO/sitemap/hreflang pass, RTL polish, Clerk **Production** instance before a public custom-domain launch.

## Docs

| File | For |
| --- | --- |
| `PLAN.md` | Build phases and what is done |
| `TECH_STACK.md` | Architecture decisions |
| `ABOUT.md` / `SERVICES.md` / `BRAND.md` | Public copy and identity |
| `convex/_generated/ai/guidelines.md` | Convex API rules for this repo |
