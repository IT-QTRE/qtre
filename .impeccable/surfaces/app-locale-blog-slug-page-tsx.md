---
version: 1
slug: "app-locale-blog-slug-page-tsx"
primary_target: "app/[locale]/blog/[slug]/page.tsx"
related_targets: ["components/public/blog-article.tsx"]
---

# Surface: Public blog article

- **Mode:** Read, then continue via in-body links or Also see.
- **Audience:** A visitor who opened a published post from `/blog` or the home rail.
- **Job:** Read the article in a quiet column, then follow a real catalog or post link if one exists.
- **Action:** Stay in the piece; open `/properties/{slug}`, `/projects/{slug}`, or `/blog/{slug}` when staff linked them.
- **Proof:** Published Convex post only. Cover only with `imageUrl`. Body is sanitized Tiptap HTML. Also see only for still-published picks.
- **Direction:** Editorial-minimalist reading page. Slim maroon breadcrumb stays site-wide (start-aligned). “Back to blog” sits at the end of the article column. Article column is centered; prose stays start-aligned. Gold date, ink title, short gold hairline, landscape cover in the same measure. Not a developer house plate. Not cream/serif magazine. Not centered lines of type.
- **Memorable moment:** Quiet type and space; maroon and gold as accent, not a dyed field.
- **Scope:** `app/[locale]/blog/[slug]/page.tsx` and `blog-article.tsx`. Also see already ships; this pass is the plate and prose.
- **Untouched:** Blog index, home rail, admin Notes chrome, sitemap.
