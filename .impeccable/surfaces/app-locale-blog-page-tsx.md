---
version: 1
slug: "app-locale-blog-page-tsx"
primary_target: "app/[locale]/blog/page.tsx"
related_targets: ["components/public/blog-directory.tsx","components/public/blog-index-entry.tsx","components/public/blog-post-link.tsx","app/[locale]/blog/[slug]/page.tsx","components/public/blog-article.tsx"]
---

# Surface: Public blog index

- **Mode:** Read, with wayfinding into `/blog/{slug}`.
- **Audience:** Dubai buyers and investors scanning what QTRE has published in writing.
- **Job:** Find a published article by date and title, then open it. Empty state when none exist.
- **Action:** Open `/blog/{slug}`. Home rail titles also go to the slug, not the index.
- **Proof:** Convex published `blogPosts` only. Cover only when `imageUrl` exists. Body is Tiptap HTML sanitized with `sanitize-html`. No invented posts, authors, or excerpts.
- **Direction:** Jakob’s Law — public label is Blog. Maroon DirectoryHero like the other catalogs. Entries are a photo-led media grid (rounded 16/10 cover, ink title, gold date), not a 42rem editorial stack and not listing-card chrome. No search, category filters, or YouTube. No invented category badges. No-cover posts use a maroon field, not stock.
- **Memorable moment:** Opening a post feels like the same page language as reading it.
- **Scope:** Index page, directory/post-link/article components, slug page, home rail hrefs. Public and admin copy is Blog.
- **Untouched:** About, contact, communities.
