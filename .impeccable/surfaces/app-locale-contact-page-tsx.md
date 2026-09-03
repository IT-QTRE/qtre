---
version: 1
slug: "app-locale-contact-page-tsx"
primary_target: "app/[locale]/contact/page.tsx"
related_targets: ["components/public/contact-directory.tsx","components/public/ghl-form-embed.tsx","components/admin/settings/website-settings-form.tsx"]
---

# Surface: Public contact

- **Mode:** Reach the desk — form or published email/phone.
- **Audience:** A visitor who is not inquiring about a specific listing.
- **Job:** Send a general inquiry through the GHL embed, or use mailto/tel when those exist in Website Settings.
- **Action:** Submit the GHL form (stays in GHL) or open email/phone/social.
- **Proof:** Email, phone, WhatsApp, socials, and form URL only from Website Settings. Form URL must pass `safeGhlFormUrl`. WhatsApp must pass `whatsappHref`. No invented address or hours. No Convex `leads`.
- **Direction:** Maroon DirectoryHero. Catalog split: details start, iframe end. Honest empty copy when no URL.
- **Memorable moment:** The desk is reachable without pretending the form exists.
- **Scope:** Public contact page, settings field, allowlist helper.
- **Untouched:** About, communities, listing inquiry, GHL webhook.
