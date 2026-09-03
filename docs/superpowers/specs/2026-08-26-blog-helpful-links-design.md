# Blog helpful links — Design Spec

> Status: Approved in chat (2026-08-26). Public article: `app/[locale]/blog/[slug]/page.tsx`. Admin: `/admin/blog` create/edit.

## Goal

A published blog article is still a **reading page**. It should also send a visitor into real catalog inventory or another published post when that is useful — in the prose, and in a short strip after the body. Success is a click to a live `/properties/{slug}`, `/projects/{slug}`, or `/blog/{slug}`. Do not invent listings, posts, or “related” guesses.

## What already exists

- Admin body is Tiptap HTML. Toolbar already has Link; it opens `window.prompt` for a URL.
- Public article sanitizes with `sanitize-html` (`lib/sanitize-blog-html.ts`). `<a href>` is allowed. Every link is forced to `target="_blank"` + `rel="noopener noreferrer"`.
- Cover image is a `mediaItems` photo on the post, not inline images in the body. Body tags do not include `img`.
- Public article styles links as maroon underline (`components/public/blog-article.tsx`).
- `blogPosts` has title, body, author, optional SEO, publishing. No related-entity field.
- Catalog and blog slug pages already exist for published records.

## Out of scope

- Inline images or embeds inside the Tiptap body.
- Automatic related (recency, keywords, “you might also like”).
- Tiptap custom nodes / listing cards in the article body.
- Changing the blog index or home blog rail.
- Sitemap, hreflang, JSON-LD (Phase 6).
- Linking unpublished or deleted records on the public page.

## Approaches considered

1. **In-body picker + staff-picked strip (chosen).** Replace the URL prompt with a picker of published properties, projects, and posts (plus paste URL). Store up to four staff picks on the post; render them after the body if still published.
2. **Strip only.** Faster, but in-body links stay a raw prompt and staff will keep shipping walls of text.
3. **Embed cards in the body.** Richer, fights the reading page, and blows up sanitizer + HTML storage. Rejected.

## Visitor mode

**Read, then continue.** The article stays type-led (maroon header, gold date, cover, prose). Helpful links are maroon in the body and a short “Also see” list after it — not a magazine card grid and not the Buy/Rent listing card.

## In-body links (admin)

Replace `window.prompt` with a small dialog on the Link toolbar button.

- **Paste URL** remains: any `http`/`https` URL, or a site path (`/properties/…`, `/projects/…`, `/blog/…`).
- **Pick from catalog:** search published properties, published projects, and published posts (not the post currently being edited). Choosing one inserts a link on the current selection. If the selection is empty, insert the English title (or agent-facing name) as the link text.
- Inserted catalog hrefs are locale-free site paths (`/properties/{slug}`, `/projects/{slug}`, `/blog/{slug}`). Public middleware prefixes the visitor’s locale.
- Empty URL unsets the link (same as today).
- External URLs keep `target="_blank"` and `rel="noopener noreferrer"`.
- Internal paths (relative `/…`, or `siteUrl` origin) open in the **same tab**. Sanitizer must stop forcing `_blank` on those.

## Also see (admin)

New form section **Also see**, after Cover.

- Ordered list of up to **four** items. Each item is one of: a property, a project, or another blog post.
- Admin may pick draft records so a post can be staged before the listing goes live. Public render omits anything not published.
- Cannot add the current post.
- Duplicate picks are rejected.
- Empty is valid. No required related links.
- UI: add-row picker (same published/draft search as other admin relation selects), reorder not required if add-order is the stored order; remove per row.

## Also see (public)

After the article body, only if at least one pick still resolves to a **published** record:

- Heading from `catalog.blogAlsoSee` (EN: “Also see”, plus AR/TR).
- One row per remaining item, in stored order:
  - **Post:** gold date + title, same tone as `BlogPostLink` (no extra card chrome). Href `/blog/{slug}`.
  - **Property:** title + one meta line (sale/rent and price when AE, else city). Href `/properties/{slug}`.
  - **Project:** title + one meta line (city or from-price). Href `/projects/{slug}`.
- Use `next-intl` `Link` (same tab).
- Omit missing, draft, or archived picks silently. If none remain, render no heading and no empty state.

## Data

Add optional `related` on `blogPosts`:

```
related: v.optional(v.array(v.union(
  v.object({ type: v.literal("property"), id: v.id("properties") }),
  v.object({ type: v.literal("project"), id: v.id("projects") }),
  v.object({ type: v.literal("blogPost"), id: v.id("blogPosts") }),
)))
```

- Zod: max 4, unique ids, current post id not allowed on update.
- Convex `create` / `update`: same rules; omit the field (do not store `undefined`) when the list is empty. Use `replace` + `delete` for clearing, consistent with other optional blog fields.
- `getPublishedBlogPostBySlug` returns `related` as resolved public rows (published only), not raw ids. Unpublished picks are dropped in that query so the client never shows a stub.
- No new table. No back-reference on properties/projects.

## Sanitizer

Keep the current tag allowlist. Change link transform:

- If `href` is relative (`/`…) or same origin as `NEXT_PUBLIC_SITE_URL`, output `href` only (no `target`).
- Otherwise keep `target="_blank"` and `rel="noopener noreferrer"`.
- Relative paths must survive sanitization (do not strip `/properties/…` for lacking `http`).

## Copy

Admin English only. Public heading localized. Do not add “Related articles”, “You might also like”, or invented excerpts.

## Tests

- `related` empty / 4 items / duplicate / self-post rejected.
- Public slug omits draft picks; published picks appear in order.
- Sanitizer: internal path stays same-tab; `https://example.com` stays new-tab.
- Existing blog create/update/publish tests still pass with `related` absent.
