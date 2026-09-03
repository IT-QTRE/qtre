# Blog topics — Design Spec

> Status: Approved in chat (2026-08-26). Approach 2: `blogCategories` table. Public: `/en/blog`. Admin: post create/edit combobox.

## Goal

A published article can carry **one topic** staff already use (Visa, Property, Project, Market, …) or a **new English name** typed at save time. Visitors on `/blog` can narrow by that topic **and** a title keyword. Success is: pick or create a topic in admin, see a gold label on the article, filter the index without a magazine tag cloud.

## What already exists

- `blogPosts`: title, body, author, optional SEO, optional `related`, publishing. No topic field.
- Public `/blog` is newest-first published posts. No search, no facets.
- Article header: gold date + title. Index rows: date + title (optional cover).
- Admin is English-only. LocalizedText already allows `ar`/`tr` later with English fallback (`pickLocalized`).
- Catalog property filters use query params (`q`, etc.) on the index. Blog should follow that, not `/blog/visa` landings.
- FK pickers elsewhere are plain `Select`s. This field is an **editable combobox** (existing names + type-to-create) because the set is staff-grown, not a closed enum.

## Out of scope

- Dedicated `/blog/{topic}` landings, sitemap/hreflang/JSON-LD (Phase 6).
- Searching article **body**.
- Several topics on one post.
- Filling Arabic/Turkish topic names in this pass (shape must allow it later).
- A standalone Admin “Categories” page, rename UI, or delete-category UI.
- Changing the home blog rail.

## Approaches considered

1. **Plain string on the post.** Combobox of used names. Fast. “Visa” / “visa ” / “Golden Visa” become three filters. No place for AR/TR later.
2. **`blogCategories` table (chosen).** Name + slug; post stores `categoryId`. Combobox creates or reuses a row. Filter `?topic=visa` + `?q=`. Ready for translations without rewriting posts.
3. **Slugify-on-save, no table.** Tidier than (1), still no entity for later translations.

## Visitor mode

The index stays a **reading list**. Search and topic sit above the list in the same quiet catalog-filter tone (not chips-as-hero, not Buy/Rent listing cards). The article stays type-led: gold date, then optional gold topic, then title.

## Data

New table `blogCategories`:

```
name: localizedTextValidator   // en required now; ar/tr optional later
slug: v.string()               // from English name via slugFromTitle; globally unique
```

Indexes: `by_slug`.

- Not a publishable entity: no draft/published, no SEO, no media.
- Creating “Visa” and “visa” must resolve to the **same** row (slug `visa`). Reject a new name whose slug is empty (punctuation-only).
- Do not rename an existing row when a later post types a different casing of the same slug; reuse the row.

On `blogPosts`:

```
categoryId: v.optional(v.id("blogCategories"))
```

Index: `by_category`.

- Omit the field when unset (`undefined` is not stored; `update` uses `replace` + `delete`).
- Empty is valid. Existing posts stay uncategorized.
- One topic per post.

**Ensure-on-save (admin).** The form holds an English name string (may be blank). On create/update:

1. Blank → no `categoryId`.
2. Otherwise `blogCategories.ensure({ nameEn })`: trim; slugify; if a row with that slug exists, return it; else insert `{ name: { en: trimmed }, slug }` and return it.
3. Store that `_id` as `categoryId`.

Permissions: `blogCategories.list` / `ensure` use the existing `blogPosts` resource (`read` / `update` or `create`). No new role-matrix entry.

## Admin

On the post form, after Title (or in Post, before Body): **Topic**.

- Editable field with a dropdown of existing English names (combobox). Filter as the staff types.
- They may choose an existing name or leave a new one. Saving creates the category if needed.
- Clear control unsets the topic.
- No required topic. Duplicate-looking names with the same slug are not an error; they attach to the existing category.
- Admin copy English only. Label “Topic”, hint: “Visa, Property, Project, or type a new name.”

## Public `/blog`

Query params (locale-free, same as catalog):

- `q` — substring match on **title** (all locale fields on the title, case-insensitive), same spirit as property location `q`.
- `topic` — category **slug**. Unknown or unused slug → empty list (not 404).

Combined with AND. Newest-first among matches.

- Topic control lists only categories that still have **≥1 published** post. Uncategorized posts appear when no `topic` is set; they drop out when a topic is selected.
- Title search with no hits: existing empty-catalog tone, plus a way to clear filters.
- Gold topic label on each index row when the post has a category (`pickLocalized`, English fallback).
- Do not invent a count of “topics” in the hero.

## Public article

If `categoryId` resolves, show the topic as a gold line with the date (same `text-secondary` as the date — not a pill, not a maroon badge). Not a link in this pass (filter lives on `/blog`). Missing category: omit the line, do not show “Uncategorized”.

`getPublishedBlogPostBySlug` returns `category: { slug, name } | null` (resolved; never a dangling id).

## Copy

Public strings in `catalog` (EN + AR + TR): topic filter placeholder / “All topics”, title search placeholder (e.g. “Search titles”), empty filtered state, clear filters. Do not say “categories”, “tags”, or “you might also like”. Admin says **Topic**.

## Tests

- `ensure` reuses a row for the same slug (`Visa` / `visa`); creates a new row for a distinct slug; rejects empty slug.
- Post create/update: blank topic omits `categoryId`; named topic sets it; clearing on update deletes the field.
- Public list: `q` matches title only; `topic` keeps published posts in that category; draft posts never appear; uncategorized omitted when `topic` is set.
- Public slug returns resolved category or `null`.
- Existing blog tests still pass when `categoryId` is absent.
