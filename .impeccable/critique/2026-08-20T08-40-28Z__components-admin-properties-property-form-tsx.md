---
target: Property create/edit form
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-08-20T08-40-28Z
slug: components-admin-properties-property-form-tsx
---
Target: Property create/edit form (`components/admin/properties/property-form.tsx`). Operate surface for QTRE staff catalog authors. English is the only required language; Arabic/Turkish are optional.

Method: dual-agent (A: 4220c24a-da29-4950-b2fd-df1865f4701e · B: 0add53d2-0a2d-4055-a814-2b8671c0c7d6). Source review; Clerk-gated `/admin` was not visually inspected.

Out of scope for this run: the list. Already shipped and not reopened: one form-level locale switcher, Save draft vs Publish + URL confirm, Cancel + unsaved guard, relations can be None, select labels vs Convex IDs, making Arabic required.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Toasts, Saving…/Publishing…, slug preview exist. Both footer buttons flip to busy together. No EN/AR/TR fill-state. Edit success does not always clear dirty. |
| 2 | Match System / Real World | 2 | Status labels are broker language. Price is a raw number; hint is UAE-only while Market includes TH/TR. Rent vs sale has no period. Slug / Canonical Path are CMS. |
| 3 | User Control and Freedom | 3 | Cancel, GuardedBackLink, discard dialog, beforeunload, None on relations. Strongest heuristic. |
| 4 | Consistency and Standards | 2 | Create Photos = MediaPicker (upload on save). Edit Photos = MediaUploader (upload now, drag reorder). Native Enter submits as draft unless already published. |
| 5 | Error Prevention | 2 | Publish/unpublish confirms and unsaved guard are real. Publish dialog opens before handleSubmit — empty Title still gets “Live at /en/properties/…”. |
| 6 | Recognition Rather Than Recall | 2 | Locale switcher hides the other two languages. No AR/TR empty mark. Currency lives in Market; amount in Price. Amenities are 20 visible pills. |
| 7 | Flexibility and Efficiency | 2 | Auto-slug from title.en is the one accelerator. No Cmd+S. Locale is three clicks at the top, not sticky. |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained, on-brand, not decorative. Noise is always-on SEO + 20 amenity pills, not chrome. |
| 9 | Error Recovery | 2 | Localized fields, Price, Area, Slug show inline errors; onInvalid switches locale and scrolls. Bedrooms, Bathrooms, Market have no error node. |
| 10 | Help and Documentation | 2 | FieldHints exist. English required / AR+TR optional / EN fallback appears only inside the Publish dialog, not on Authoring language. |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict

**Start here.** This is a familiar Operate catalog form, not marketing slop. A Linear/Stripe-fluent admin would trust the chrome. It still authors a **CMS document**, not a Dubai listing. Six equal boxes (Listing / Specs / Relations / Photos / Publishing / SEO) would ship on any multi-locale catalog after a label rename. QTRE-specific content is the data (Studio, For Sale/For Rent/Sold/Rented/Off Market, sq ft, Marina Heights placeholders, AED hint), not the composition. Gold is unused; maroon is reserved for Authoring language selected state and Publish. That restraint is correct for Operate.

**LLM assessment**: Unlikely someone would say “AI made this.” The failure mode is category-interchangeable CMS, not decorative AI grammar (no gradient text, eyebrows, glass, hero-metrics).

**Deterministic scan**: `detect.mjs` exited 0 with **zero findings** across seven files (`property-form`, `localized-text-field`, `form-locale`, `seo-fields-section`, `admin-section`, new/edit pages). The detector is built for marketing-page slop. Agreement: none of the P1s are detector-visible. Detector did not contradict the review; it also did not add locations.

**Visual overlays**: No reliable user-visible overlay. This session has no browser MCP tools. `/admin/properties/new` is Clerk-gated.

## Overall Impression

The form is a competent catalog desk: sticky Save draft vs Publish, Cancel with a dirty guard, one EN/AR/TR switcher, and relation dropdowns that now show names. The remaining gap is honesty at the high-stakes moment: Publish confirms a live URL before the form is valid, Bedrooms/Bathrooms/Market can fail silently, and Authoring language still looks like every language is required. Biggest opportunity: validate-then-confirm, plus inline errors and a truthful locale switcher, before collapsing amenities/SEO.

## What's Working

1. **High-stakes publishing now has ceremony.** Sticky Save draft vs Publish (label becomes Save when already published), Publish this listing? with the public path, Hide this listing?, Cancel + requestLeave + beforeunload. Correct Operate pattern for putting inventory on the public catalog.
2. **One Authoring language switcher, not per-field tabs.** FormLocaleSwitch (English / Arabic / Turkish) plus dir="rtl" on AR inputs. onInvalid switches locale and scrolls to the first error.
3. **Optional relations and honest hints.** Developer / Community / Project / Agent use None + English labels, not Convex IDs. Relations hint, number-only Price hint, slug “/ar and /tr use the same slug”, SEO “leave blank to fall back.”

## Cognitive load

**7 of 8 checklist items fail (high).** Only grouping passes (`AdminSection` borders, locale `role="group"`, sticky footer).

Listing packs Title, Description, City, Market, Listing Status. Specs packs Price, Area, Bedrooms, Bathrooms **plus 20 amenity pills**. SEO and Canonical Path stay always-on at the same weight as Title. Decision points with >4 visible options: Listing Status (5), Bedrooms (7), Amenities (20), Market (7).

## Emotional journey

Arrival is calm (`New property` / “Add a sale or rent listing to the catalog.”). Authoring language is easy to skip; asterisks on Title/Description/City look required in every language. The long middle (amenities, relations, photos, publishing, SEO) is a valley; switching to Arabic while scrolled to Specs appears to do nothing. False peak: Publish opens the live-URL dialog before validation. Real peak: the three confirms (publish URL, hide listing, discard). End is a toast, not a “this is live” recap. Create then redirects to edit where Photos morph into a different uploader.

## Priority Issues

**[P1] Publish confirm runs before the form is valid**
- **What**: `requestSave("published")` sets status and opens Publish this listing? without `handleSubmit`. Live at `{publicPath}` appears for an empty Title, empty Price, unselected Bedrooms. Validation only runs on Publish inside the dialog action.
- **Why it matters**: Staff confirm “going live,” then get dumped onto a required field. The high-stakes moment lies.
- **Fix**: `handleSubmit` first; open the confirm only when values are valid. Keep the URL preview. Soft-warn on empty AR/TR or zero photos — do not block, do not make Arabic required.
- **Suggested command**: `/impeccable harden`

**[P1] Authoring language still hides completeness; `*` lies on Arabic/Turkish**
- **What**: LocalizedTextField always renders `Title *`, `Description *`, `City *` outside the locale input. Schema requires `en` only. Authoring language has no “English required · Arabic optional · Turkish optional” and no fill dots. Placeholders stay English on AR/TR.
- **Why it matters**: Staff either over-work optional locales or publish EN-only without seeing the gap. The EN fallback rule is buried in the Publish dialog.
- **Fix**: On the switcher: EN required, AR/TR optional, plus a filled/empty mark per locale. When locale ≠ en, drop the asterisk and add “Optional — English shows if blank.”
- **Suggested command**: `/impeccable clarify`

**[P1] Bedrooms, Bathrooms, and Market fail with no inline error**
- **What**: Schema requires bedrooms, bathrooms, countryCode. Price, Area, Slug render inline errors. Bedrooms *, Bathrooms *, Market * (`CountryCodeSelect`) render none. SelectTrigger is not given `aria-invalid`. onInvalid scrolls to `[aria-invalid='true'], .text-destructive` — these three often have neither.
- **Why it matters**: Clicking Publish on a new form dies on the first empty select with no nearby message. Support ticket: “it won’t save.”
- **Fix**: Same error `<p className="text-sm text-destructive">` as Price. Pass invalid state into SelectTrigger. Wire labels. Pair with validate-then-confirm.
- **Suggested command**: `/impeccable harden`

**[P2] Specs is a wall: 20 amenity pills + always-on SEO**
- **What**: AmenityPicker paints all 20 CURATED_AMENITIES as small pills under Price/Area/Beds/Baths. SEO (SEO Title, SEO Description, Canonical Path) is a full AdminSection, not collapsed. Canonical is expert-only.
- **Why it matters**: The four numbers that define a listing compete with a facet taxonomy and search-engine overrides. Canonical Path at the same weight as Title is the hierarchy fail.
- **Fix**: Keep Price/Area/Beds/Baths as the Specs cluster. Collapse Amenities behind “Amenities (n selected)” or a common set + More. Collapse SEO to a closed details block.
- **Suggested command**: `/impeccable distill`

**[P2] Photos are two products; Remove is hover-only; no cover**
- **What**: Create uses MediaPicker (“they’ll upload once you save”). After redirect to edit, the same photos become MediaUploader with undocumented drag-reorder. Remove is `opacity-0 group-hover:opacity-100` on both. No “first photo is the listing image.”
- **Why it matters**: The create→edit handoff changes the control. Thumb and keyboard users cannot reliably remove a photo. Publishing without a cover is silent.
- **Fix**: One photo vocabulary. Always-visible Remove. State that photo 1 is the public hero. Soft-warn on Publish if there are zero photos.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Alex (power user)**: No Cmd+S; Enter on the form saves draft unless already published. Authoring language is at the top, not sticky. 20 amenity toggles. Both Save draft and Publish show busy copy from the same isSubmitting.

**Casey (distracted / one-handed)**: Sticky footer puts Publish in the thumb zone — that works. Authoring language is top-of-page. Amenity pills and hover-only Remove fail 44pt. Returning after create lands on a different Photos UI.

**Sam (keyboard / screen reader)**: Authoring language has visible labels and aria-pressed. Locale change is not announced. Title is announced required on AR/TR. Bedrooms/Bathrooms/Market are unlabeled selects (`Label` without htmlFor, no error text). Photo Remove is not in the focus order until hover.

**QTRE listing admin**: Needs accurate AED, community/project when known, and a public URL they can paste into WhatsApp. None on relations matches incomplete files. Missing: formatted AED, rent period, cover photo, locale fill-state, a pre-publish recap (title · beds · price · URL). They will publish EN-only because nothing on Authoring language tells them that is allowed — and nothing tells them AR is empty.

## Minor Observations

- Listing Status is unlabeled as required, defaults to For Sale, and spans sm:col-span-2 inside Listing.
- Edit AdminPageHeader title is always property.title.en.
- isSubmitting relabels Save draft → “Saving…” and Publish → “Publishing…” at the same time.
- Slug preview is hardcoded `/en/properties/…` even when Authoring language is Arabic.
- slugEdited latches forever after one keystroke; clearing the slug does not resume autogen.
- CountryCodeSelect Other… reveals a 2-letter ISO input; regex errors have nowhere to render.
- No coordinates control though the schema allows it — do not invent a map picker.
- Gold unused on this surface; leave it.

## Questions to Consider

1. Should Authoring language show English required / Arabic optional / Turkish optional with fill-state, or stay a silent EN/AR/TR toggle and keep the fallback copy only on Publish?
2. Must Publish this listing? appear only after validation, or do you want the dialog even on an incomplete form so staff see the URL before they finish Specs?
3. Is the 20-pill Amenities row a first-class Specs decision every time, or should Price / Area / Bedrooms / Bathrooms stand alone with amenities (and SEO/Canonical) collapsed until needed?
