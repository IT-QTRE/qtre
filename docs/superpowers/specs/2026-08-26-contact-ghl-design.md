# Public Contact page — Design Spec

> Status: Approved in chat (2026-08-26). Layout: catalog split. Form source: Website Settings iframe URL.

## Goal

A visitor who is not inquiring about a specific listing can still reach the desk. Success is sending a general inquiry through the embedded GoHighLevel form, or using a published email/phone. Submissions stay in GHL. They do not create Convex `leads`.

## Locked decisions

- One iframe URL for `/en`, `/ar`, and `/tr`.
- Staff paste the URL in Website Settings (not env, not a raw script snippet).
- Catalog split: maroon DirectoryHero, then details | form on large screens; details first on small screens.
- Email, phone, WhatsApp, and social URLs only when already stored in Website Settings. No invented address, hours, or map.

## Visitor

Route: `/[locale]/contact`.

- Hero: `section.contactTitle` + `catalog.contactIntro`.
- Start column: mailto / tel / WhatsApp (wa.me). Published social links as named outbound links (`rel="noopener noreferrer"`).
- End column: allowlisted iframe, or honest empty copy when no URL.
- If there are no details, the form (or empty copy) uses the full measure — no empty details column.
- Iframe is built by us (`src`, `title`). We do not render admin HTML or GHL’s embed script from settings.

## Admin

Website Settings fields **Contact form URL** and **WhatsApp**. WhatsApp is an international number or `wa.me` link; empty hides it.

## Allowlist

`safeGhlFormUrl` accepts `https` URLs whose hostname is exactly, or a subdomain of: `leadconnectorhq.com`, `msgsndr.com`, `gohighlevel.com`. Reject `javascript:`, `data:`, `http:`, and any other host. `publicGet` returns the URL only when it still passes. `upsert` throws if a non-empty value fails.

## Out of scope

- Convex `leads` / admin Leads for this form.
- GHL webhook into Convex.
- Per-locale form URLs.
- About, communities, List Your Property.
- JSON-LD / sitemap (Phase 6).
