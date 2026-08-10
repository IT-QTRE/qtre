# QuickTalk Real Estate — Technology Stack

## Project Overview

QuickTalk Real Estate is a rebuild and rebrand of the previous QuickTalk Business website.

The new platform will support:

- A public-facing real estate website
- Property and project listings
- Lead and inquiry collection — split by source: the general Contact page uses an embedded GoHighLevel form (see "GoHighLevel" below), while property/project-specific inquiries are stored in our own `leads` table (see "Convex data areas" below), since those need real `propertyId`/`projectId`/`agentId` foreign keys to power the admin Leads screen and Agent Portal
- Agent and developer profiles
- Blog and SEO content
- A secure internal admin dashboard
- Media and document management
- Role-based access and audit logging

---

## Core Development Stack

### Cursor IDE

Cursor is the primary code editor used for development.

### Next.js

The application will use:

- Next.js App Router
- React
- TypeScript
- Server Components where appropriate
- Client Components only when interactivity is required
- Route Handlers for HTTP endpoints and integrations
- Next.js Metadata API for SEO

### Vercel Pro

Vercel will be used for:

- Production hosting
- Preview deployments
- GitHub-based deployments
- Environment variable management
- Image optimization
- Analytics
- Speed Insights
- Vercel Blob integration

---

## Frontend

### Tailwind CSS

Tailwind CSS will be used as the main styling system.

### shadcn/ui

shadcn/ui will provide accessible and customizable UI components, including:

- Buttons
- Forms
- Dialogs
- Dropdown menus
- Tabs
- Sheets
- Tables
- Alerts
- Toast notifications
- Dashboard components

### Motion

The `motion` package will be used selectively for:

- Hero animations
- Section entrances
- Navigation transitions
- Property-card interactions
- Dialog and menu animations
- Image-gallery transitions

Animations should remain subtle, fast, and appropriate for a premium real estate brand.

---

## Forms and Validation

### React Hook Form

React Hook Form will manage complex forms such as:

- Property creation and editing
- Project creation and editing
- Agent profiles
- Property/project inquiry ("Contact this agent about this listing") forms — a Convex mutation writes into the `leads` table
- Website settings

The public Contact page's general form is the one exception — it's an embedded GoHighLevel form (see "GoHighLevel" below), not a React Hook Form + Convex form.

### Zod

Zod will be used for:

- Form validation
- Shared data schemas
- Input validation
- Type-safe parsing
- Validation before Convex mutations

---

## Backend and Database

### Convex

Convex will provide:

- Database storage
- Queries
- Mutations
- Actions
- Reactive data updates
- Scheduled functions
- Backend business logic
- Audit logging
- File and media metadata
- Integration endpoints

Possible Convex data areas include:

- Properties
- Projects
- Developers
- Agents
- Communities (country-aware — see `docs/superpowers/specs/2026-08-08-communities-and-media-model.md`)
- Leads (property/project inquiries only — not the general Contact page, which uses GoHighLevel; see "GoHighLevel" below)
- Property submissions
- Blog posts
- Website settings
- Media items (unified table, foreign-keyed to any entity — same spec above)
- Users and roles
- Audit logs

---

## GoHighLevel (Contact Page Only)

GoHighLevel (GHL) is used **only** for the general public Contact page —
nowhere else. It embeds GHL's provided form snippet (script/iframe embed)
client-side; submissions go straight to GoHighLevel. There is no Convex
mutation, no `leads` table row, and no server-side spam handling on our end
for this specific form — GHL's hosted form handles its own submission
processing and spam protection.

Every other lead-capture point — property inquiries, project inquiries, any
"Contact this agent about this listing" CTA — is **not** GHL. Those go
through our own `leads` table (see "Convex data areas" above) via a Convex
mutation, because they need real `propertyId`/`projectId`/`agentId` foreign
keys to power the admin Leads screen and the Agent Portal's assigned-leads
view — data a generic external form has no way to carry natively.

GHL workflows/automations do support an outbound webhook action that could
also forward Contact-page submissions into Convex later, if we ever want a
single unified inbox across both sources. This is **explicitly deferred**
— see the Backlog in `PLAN.md` — until a concrete need arises.

---

## Authentication and Authorization

### Clerk

Clerk will manage:

- Authentication
- Admin, Agent, and Client sign-in
- User sessions
- User identity
- Account security
- Role and permission metadata

Authorization must also be enforced inside Convex functions. Hiding admin controls in the interface alone is not sufficient.

Roles:

- Super Admin
- Admin
- Agent (has portal access)
- Client (has portal access)

Clerk is not admin-only. Agent and Client accounts authenticate through the
same Clerk instance, scoped by role — see "Roles, Portals, and Property
Submissions" below. (This replaces an earlier 6-role list that included
Property Manager, Content Editor, and Viewer as separate roles; see
`docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`.)

---

## Roles, Portals, and Property Submissions

Full design detail: `docs/superpowers/specs/2026-08-07-roles-and-portals-design.md`

### Role Scope

| Role | Scope |
|---|---|
| Super Admin | Full access to everything. Only role that can create/manage other Admin accounts. |
| Admin | Full access to Properties, Projects, Developers, Agents, Blog, Leads, Media, Settings, Audit Logs. Creates Agent accounts. Assigns property submissions to Agents (or reviews them personally). |
| Agent | Scoped to their own assigned Properties/Projects (edit rights) and leads/submissions assigned to them for review. No access to Users, Settings, Audit Logs, or other agents' records. |
| Client | Scoped to only their own submitted properties. Can create new submissions, upload documents, and view status. No buyer-side browsing/favorites. |

### Agent Portal

An Agent-facing view that reuses the admin dashboard's visual style and
components (`DataTable`, shell layout) rather than a separate design system.
Shows the Agent's own assigned Properties/Projects, property/project
inquiry leads assigned to them, and property submissions assigned to them
for review (with approve/reject actions). Contact-page inquiries are not
shown here — those live in GoHighLevel, not Convex (see "GoHighLevel"
above).

### Client Portal — "List Your Property"

A public-facing "List Your Property" call-to-action leads property owners
into Clerk sign-up/sign-in, then a submission form (property details +
supporting documents such as title deed, floor plan, photos). Submissions
are reviewed by an Admin or assigned Agent before becoming a live
`properties` record. Clients can log back in anytime to check submission
status and submit additional properties later.

Property submissions are modeled as their own `propertySubmissions` table
(see Convex data areas above) — distinct from `leads`, which are
buyer-inquiry-only (property/project inquiries; the general Contact page is
handled separately via GoHighLevel, not Convex — see "GoHighLevel" above).

Both portals live outside `[locale]` (English-only), matching the admin
dashboard's pattern rather than the translated public site.

---

## Data Tables

### TanStack Table

TanStack Table will be used in the admin dashboard for:

- Property tables
- Project tables
- Lead management
- Agent management
- Blog management
- User management
- Audit logs
- Sorting
- Filtering
- Pagination
- Column visibility
- Row selection
- Bulk actions

TanStack Table is headless and will be styled using shadcn/ui and Tailwind CSS.

### TanStack Query

TanStack Query will not be included initially.

Convex already provides:

- Reactive queries
- Client subscriptions
- Query caching
- Mutations
- Live updates
- Loading-state support

TanStack Query may be added later only when there is a clear requirement for managing external REST or third-party API data outside Convex.

### Other TanStack Products

The following are not required:

- TanStack Router
- TanStack Start

Next.js already provides routing, layouts, rendering, navigation, loading boundaries, and error handling.

---

## Media Storage and Image Optimization

### Vercel Blob

Vercel Blob will store:

- Property images
- Project images
- Agent profile photos
- Developer logos
- Blog images
- Brochures
- Floor plans
- Property documents
- Other uploaded media

Only the file URL and related metadata should be stored in Convex.

Suggested image metadata:

```ts
type MediaItem = {
  url: string;
  pathname: string;
  alt: string;
  order: number;
  width?: number;
  height?: number;
  mimeType?: string;
};
```

### Next.js Image

The Next.js `<Image>` component will be used to provide:

- Responsive image sizes
- Lazy loading
- Image resizing
- Modern image formats
- Layout-shift prevention
- Vercel image caching and optimization

Example:

```tsx
import Image from "next/image";

type PropertyImageProps = {
  src: string;
  alt: string;
};

export function PropertyImage({ src, alt }: PropertyImageProps) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}
```

Vercel Blob stores the original file. Next.js Image and Vercel handle optimized delivery.

Cloudinary is not required initially. It may be considered later if advanced transformations, automated watermarks, smart cropping, or digital asset management become necessary.

---

## Email and Notifications (NOT TO BE IMPLEMENTED FOR NOW)

### Resend (NOT TO BE IMPLEMENTED FOR NOW)

Resend may be used for:

- Contact-form submissions
- Lead notifications
- Inquiry confirmations
- Admin alerts
- Agent notifications
- Transactional emails

Email sending should normally be performed through secure backend functions rather than directly from the browser.

---

## Analytics, SEO, and Monitoring (NOT TO BE IMPLEMENTED FOR NOW)

### Vercel Analytics (NOT TO BE IMPLEMENTED FOR NOW)

Used for privacy-focused traffic and page-view analytics.

### Vercel Speed Insights (NOT TO BE IMPLEMENTED FOR NOW)

Used to monitor real-world website performance and Core Web Vitals.

### Google Analytics 4 (NOT TO BE IMPLEMENTED FOR NOW)

Used for:

- Marketing analytics
- Conversion tracking
- Campaign measurement
- Lead-form events
- Property interaction events

### Google Search Console (NOT TO BE IMPLEMENTED FOR NOW)

Used for:

- Search performance
- Page indexing
- Sitemap submission
- Search queries
- Crawl issues
- Core Web Vitals reports

---

## Recommended Architecture

```text
Next.js Application
├── Public Website
│   ├── Home
│   ├── Properties
│   ├── Property Details
│   ├── Projects
│   ├── Project Details
│   ├── Developers
│   ├── Agents
│   ├── About
│   ├── Blog
│   ├── Contact
│   └── List Your Property (Client Portal entry point)
│
├── Admin Dashboard
│   ├── Dashboard Overview
│   ├── Properties
│   ├── Projects
│   ├── Developers
│   ├── Agents
│   ├── Leads (property/project inquiries)
│   ├── Blog
│   ├── Media
│   ├── Users and Roles
│   ├── Website Settings
│   └── Audit Logs
│
├── Agent Portal
│   ├── Assigned Properties/Projects
│   ├── Assigned Leads
│   └── Assigned Submissions (review)
│
├── Client Portal
│   ├── Submit Property
│   └── Submission Status
│
├── Clerk
│   ├── Authentication
│   ├── Sessions
│   └── User Identity
│
├── Convex
│   ├── Database
│   ├── Queries
│   ├── Mutations
│   ├── Actions
│   ├── Scheduled Functions
│   └── Authorization
│
├── GoHighLevel (embedded form only, external system — Contact page only)
│   └── Lead capture + CRM (Contact page general inquiries)
│
└── Vercel
    ├── Hosting
    ├── Deployments
    ├── Blob Storage
    ├── Image Optimization
    ├── Analytics
    └── Speed Insights
```

---

## SEO and Metadata Architecture

SEO is a core application feature and should be implemented from the beginning of the rebuild.

### Next.js Metadata API

The project will use the built-in Next.js Metadata API for:

- Default site metadata
- Page-specific titles and descriptions
- Canonical URLs
- Open Graph metadata
- Twitter/X card metadata
- Robots directives
- Dynamic metadata for properties, projects, communities, developers, and blog posts

Shared metadata should be defined in the root layout, while dynamic pages should use `generateMetadata`.

Recommended environment variable:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Example root metadata:

```tsx
import type { Metadata } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "QuickTalk Real Estate | Dubai Properties",
    template: "%s | QuickTalk Real Estate",
  },

  description:
    "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",

  applicationName: "QuickTalk Real Estate",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_AE",
    url: siteUrl,
    siteName: "QuickTalk Real Estate",
    title: "QuickTalk Real Estate | Dubai Properties",
    description:
      "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "QuickTalk Real Estate",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "QuickTalk Real Estate | Dubai Properties",
    description:
      "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",
    images: ["/opengraph-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};
```

### Dynamic Metadata

Dynamic pages should generate unique metadata from published Convex records.

Applicable page types include:

- Properties
- Projects
- Communities
- Developers
- Agents
- Blog posts

Suggested SEO fields in Convex:

```ts
type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogImageUrl?: string;
};
```

Suggested publishing fields:

```ts
type PublishingFields = {
  slug: string;
  title: string;
  summary: string;
  status: "draft" | "published" | "archived";
  publishedAt?: number;
  updatedAt?: number;
};
```

The admin dashboard should allow manual SEO overrides while automatically generating sensible defaults.

### Sitemap

The project will use the standard Next.js App Router sitemap convention:

```text
app/sitemap.ts
```

This is a built-in Next.js file convention. Next.js converts the returned data into XML and serves it automatically at:

```text
/sitemap.xml
```

Standard Next.js structure:

```tsx
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
```

The following functions are project-specific placeholders and must later be connected to actual Convex queries:

```ts
getPublishedProperties();
getPublishedProjects();
getPublishedBlogPosts();
```

Only published, canonical, indexable URLs should be included in the sitemap.

Example project implementation:

```tsx
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getPublishedProperties();
  const projects = await getPublishedProjects();
  const posts = await getPublishedBlogPosts();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${siteUrl}/properties/${property.slug}`,
    lastModified: new Date(property.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...propertyPages,
    ...projectPages,
    ...blogPages,
  ];
}
```

For a small or medium website, a single `app/sitemap.ts` file is sufficient. If the platform later contains a very large number of URLs, use Next.js `generateSitemaps()` to divide them into multiple sitemap files.

### Robots File

The project will use the standard Next.js robots convention:

```text
app/robots.ts
```

Next.js will automatically serve it as:

```text
/robots.txt
```

Example:

```tsx
import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-production-domain.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/sign-in/",
        "/sign-up/",
        "/api/",
        "/preview/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
```

Private pages must still require authentication. `robots.txt` is not a security mechanism.

### Structured Data

The project should add JSON-LD where accurate and relevant.

Recommended schema types include:

- `WebSite`
- `Organization`
- `RealEstateAgent`
- `BreadcrumbList`
- `Article`
- `VideoObject`

Structured data must describe content that is visibly present on the page.

### Canonical URLs and Filters

Filtered property URLs can create duplicate or thin pages, such as:

```text
/properties?bedrooms=2
/properties?location=dubai-marina
/properties?sort=price-low
```

Not every filter combination should be indexable.

The project should:

- Use canonical URLs
- Index only valuable landing pages
- Avoid creating thousands of thin filter pages
- Create dedicated SEO landing pages for important searches

Examples:

```text
/properties-for-sale-in-dubai
/properties-for-rent-in-dubai
/off-plan-properties-in-dubai
/communities/dubai-marina
/communities/downtown-dubai
/developers/emaar
/property-type/villas
/property-type/apartments
```

These pages should contain useful original content in addition to listing grids.

### Sold, Rented, and Unavailable Listings

Unavailable property pages should not always be deleted immediately.

Preferred approach:

- Keep useful pages accessible
- Clearly mark the listing as sold, rented, or unavailable
- Recommend similar active properties
- Remove invalid inquiry actions
- Redirect only to a genuinely equivalent replacement
- Use `410 Gone` only when a page is permanently removed with no suitable replacement

### Metadata File Structure

Recommended Next.js structure:

```text
app/
├── layout.tsx
├── robots.ts
├── sitemap.ts
├── manifest.ts
├── icon.png
├── apple-icon.png
├── opengraph-image.jpg
├── properties/
│   ├── page.tsx
│   └── [slug]/
│       ├── page.tsx
│       └── opengraph-image.tsx
├── projects/
│   └── [slug]/
│       └── page.tsx
├── communities/
│   └── [slug]/
│       └── page.tsx
└── blog/
    └── [slug]/
        └── page.tsx
```

### SEO Tooling

The SEO stack includes:

- Next.js Metadata API
- `generateMetadata`
- `app/sitemap.ts`
- `app/robots.ts`
- Canonical URLs
- Open Graph metadata
- Twitter/X card metadata
- JSON-LD structured data
- Google Search Console
- Next.js Metadata API
- Dynamic `generateMetadata`
- Structured Data / JSON-LD
- Dynamic Sitemap
- Robots configuration
- Canonical URL management
- Multi-locale routing
- Locale-aware metadata and hreflang
- Arabic RTL support
- Locale-aware formatting
- Google Analytics 4
- Vercel Analytics
- Vercel Speed Insights

A separate SEO package is not required initially.


---

## Internationalization and Multi-Locale Architecture

The website will support multiple locales, beginning with:

- English (`en`)
- Arabic (`ar`)
- Turkish (`tr`)

Additional locales may be added later.

### Recommended Route Structure

```text
app/
├── favicon.ico
├── icon.png
├── apple-icon.png
├── globals.css
├── layout.tsx
├── robots.ts
├── sitemap.ts
└── [locale]/
    ├── layout.tsx
    ├── page.tsx
    ├── properties/
    ├── projects/
    ├── communities/
    ├── developers/
    ├── blog/
    └── contact/
```

Global files such as the favicon, robots file, sitemap, and application icons must remain outside the `[locale]` folder.

### Locale Configuration

```ts
export const locales = ["en", "ar", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
```

Reuse this configuration for routing, metadata, sitemap generation, language switching, translation loading, and validation.

### Translation System

Use one translation system consistently. A suitable option is `next-intl`.

```text
messages/
├── en.json
├── ar.json
└── tr.json
```

Translations should cover navigation, forms, validation messages, listing labels, filters, admin text, metadata, and relevant email templates.

### Locale Middleware or Proxy

Locale routing must exclude static and metadata files.

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)",
  ],
};
```

The favicon must remain available at:

```text
/favicon.ico
```

It must not redirect to `/en/favicon.ico` or another locale-specific path.

### Locale Layout

The locale layout should set language and direction:

```tsx
<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
```

Arabic support requires full RTL testing, not only translated text.

### Localized Metadata

Each locale should have localized titles, descriptions, Open Graph content, canonicals, and alternate-language URLs.

```tsx
alternates: {
  canonical: `/${locale}`,
  languages: {
    en: "/en",
    ar: "/ar",
    tr: "/tr",
    "x-default": "/en",
  },
}
```

Each locale page should normally use a self-referencing canonical and reference all available translations.

### Multi-Locale Sitemap

The sitemap should include every published canonical locale URL.

Only include translations that actually exist and are published. Do not create sitemap entries for incomplete translations.

### Convex Content Model

Keep shared property facts separate from translated marketing content.

Shared facts:

- Price
- Bedrooms
- Bathrooms
- Area
- Coordinates
- Status
- Amenities
- Country code (ISO 3166-1 alpha-2 — e.g. `AE`, `TH`)

Translated content:

- Title
- Description
- SEO title
- SEO description
- Image alternative text
- City / community display name (e.g. "Dubai" / "دبي")

Example:

```ts
type LocalizedText = {
  en: string;
  ar?: string;
  tr?: string;
};
```

Images are not embedded on the entity itself — each image is a row in the
unified `mediaItems` table, foreign-keyed to its entity (`entityType` +
`entityId`) and ordered via an index, per
`docs/superpowers/specs/2026-08-08-communities-and-media-model.md`. This
avoids the unbounded-array-on-a-document problem (1MB document limit,
full-document rewrite on every reorder) that embedding a `MediaItem[]` field
directly would cause.

### Language Switcher

The language switcher should preserve the current page when a translation exists and fall back to the locale homepage when it does not.

### RTL Requirements

Use logical CSS properties where possible:

```css
margin-inline-start
margin-inline-end
padding-inline-start
padding-inline-end
inset-inline-start
inset-inline-end
```

Review directional icons, breadcrumbs, sliders, forms, tables, pagination, cards, and animation direction.

### Locale-Aware Formatting

Use the JavaScript `Intl` API for currency, numbers, dates, time, area measurements, and pluralization.

```ts
new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "AED",
  maximumFractionDigits: 0,
}).format(price);
```

### Internationalization Checklist

- Keep `app/favicon.ico` outside `[locale]`
- Exclude static and metadata files from locale middleware
- Define locales centrally
- Add localized metadata
- Add canonical and alternate-language URLs
- Include locale URLs in the sitemap
- Support RTL for Arabic
- Use locale-aware formatting
- Translate validation and interface messages
- Prevent indexing of incomplete translations
- Test all major pages in every locale


---

## Final Technology List

- Cursor IDE
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion
- React Hook Form
- Zod
- TanStack Table
- Convex
- Clerk
- Vercel Pro
- Vercel Blob
- Next.js Image
- Resend (NOT TO BE IMPLEMENTED FOR NOW)
- Vercel Analytics (NOT TO BE IMPLEMENTED FOR NOW)
- Vercel Speed Insights (NOT TO BE IMPLEMENTED FOR NOW)
- Google Analytics 4 (NOT TO BE IMPLEMENTED FOR NOW)
- Google Search Console (NOT TO BE IMPLEMENTED FOR NOW)
- Next.js Metadata API 
- Dynamic `generateMetadata`
- Structured Data / JSON-LD
- Dynamic Sitemap
- Robots configuration
- Canonical URL management
- Multi-locale routing
- Locale-aware metadata and hreflang
- Arabic RTL support
- Locale-aware formatting

---

## Initial Package Guidance

Packages should be installed only when they are needed.

Suggested packages include:

```bash
npm install convex @clerk/nextjs
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table
npm install motion (DONE)
npm install @vercel/blob
```

shadcn/ui components should be added individually rather than installing unnecessary components in advance.

---

## Development Principles

- Use TypeScript strict mode.
- Keep public and admin layouts separated.
- Enforce permissions in Convex backend functions.
- Validate all important inputs.
- Store secrets only in environment variables.
- Do not store uploaded media directly in GitHub.
- Use Server Components by default.
- Keep Client Components small and purposeful.
- Optimize images and provide meaningful alternative text.
- Use reusable schemas and shared types.
- Record sensitive admin actions in audit logs.
- Avoid unnecessary dependencies.
- Prioritize accessibility, SEO, security, and performance.
