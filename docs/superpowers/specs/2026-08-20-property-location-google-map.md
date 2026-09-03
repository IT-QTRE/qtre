# Property location & Google Map — Design Spec

> Status: Approved in chat (2026-08-20). Properties first; copy to Projects later.

## Goal

Staff can set a listing’s map pin from **Market + City + a new Address**, then drag the pin if Google is slightly off. Public visitors see that pin in an embedded map and can open Directions in Google Maps.

## What already exists

- `properties.coordinates` and `projects.coordinates` are optional `{ lat, lng }`.
- `city` (localized) and `countryCode` (Market) already exist and are required on the property form.
- There is **no** street/building address, **no** Place ID, **no** Google Maps SDK, and **no** map on the public property page.
- The admin form does not collect coordinates.

## Out of scope

- Projects (copy this after Properties feels right).
- Localized address (building/street stays one English string).
- Visitors placing their own pin.
- Geocoding from City + Market alone (that would stack every Dubai listing on the city centroid).
- Server-side geocode proxy (the Maps JS key is public by design).

## Approaches considered

1. **Typed address → Geocoding API only.** Cheap. Weak for Dubai towers.
2. **Places Autocomplete + drag (chosen).** Staff pick a Place; pin drops; they can drag. Closest to how a listing desk actually works.
3. **Lat/lng fields only.** Accurate, slow, easy to mistype. Rejected.

## Data

Add to `properties` (and later `projects`):

```ts
address: v.optional(v.string()),          // staff-facing, English, e.g. "Marina Heights, Dubai Marina"
placeId: v.optional(v.string()),          // Google Place ID when picked from Autocomplete
coordinates: v.optional(v.object({        // already on the table
  lat: v.number(),
  lng: v.number(),
})),
```

- `address` is **not** LocalizedText. Community/tower names are proper nouns.
- `placeId` is omitted when the pin was only dragged, or when geocode did not return one.
- Clearing Address also clears `placeId`. Coordinates stay until staff clears the pin (a “Clear location” control) so a dragged pin is not wiped by deleting a typo.
- Convex `create` / `update` persist these like other optional fields; `update` uses the existing `replace` path so omitting them can clear them.

`publicCatalog.getPublishedPropertyBySlug` returns `address`, `coordinates`, and `placeId` (or nulls) so the public page can render the map without a second query.

## Admin (property form)

New **Location** section, after Listing (Market and City stay in Listing — Location reads them):

1. **Address** — text field with Google Places Autocomplete, biased to the selected Market (`componentRestrictions.country`) and toward City when set.
2. **Map** — Maps JavaScript API, ~16:9, pin at `coordinates` or a **preview-only** city view that does **not** save until staff pick a Place, geocode a typed address, or drag.
3. **Clear location** — removes address, placeId, and coordinates.

### Pin write rules

Coordinates are written only when:

- staff **selects a Place** (sets address, placeId, lat/lng), or
- staff **leaves Address** after typing (debounced Geocoding of `"{address}, {city.en}, {country}"`; on success set lat/lng and placeId if present; on failure toast and keep the previous pin), or
- staff **drags the pin** (updates lat/lng; keep address; **always clear placeId**, because the pin is no longer that Place).

Do **not** save coordinates from City + Market with an empty Address.

Changing Market/City re-biases Autocomplete. It does not move a pin the staff already set.

### Errors

- Missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Location section shows a static hint (“Map is not configured”) and Address stays a plain text field. Save still works.
- Autocomplete/geocode failure: toast, do not wipe an existing pin.
- Map load failure: keep Address; pin cannot be dragged until Maps loads.

Location is **not** required to save a draft or to Publish. If there is no pin, the public page has no map.

## Public (property detail)

If `coordinates` is present:

- A **Location** block below the description.
- Embedded map (Maps JS, pan/zoom, pin fixed, no Autocomplete).
- **Directions** link: `https://www.google.com/maps/dir/?api=1&destination=lat,lng` (append `&destination_place_id=` when `placeId` exists).
- Show `address` as the caption when present; otherwise fall back to community name or city (already on the page).

If `coordinates` is missing, omit the whole block. No empty map chrome.

Load the map with a client component and a dynamic import so the Maps script is not on every catalog page.

## API key

- Env: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (document in `.env.example`).
- Enable **Maps JavaScript API**, **Places API**, and **Geocoding API** on that key.
- Restrict by HTTP referrer (`localhost` + production domains).
- One key for admin and public. Do not put a secret Maps key in Convex env.
- Client library: [`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/docs/get-started) (`APIProvider`, `Map`, `Marker`). Places Autocomplete is bound to our address input via `useMapsLibrary('places')` so the field matches the rest of the form.

## Architecture (units)

| Unit | Does | Depends on |
|------|------|------------|
| `lib/maps/query.ts` | Builds the geocode string from address + city.en + country | nothing |
| `components/maps/location-picker.tsx` | Autocomplete + map + drag + clear (admin) | Maps JS, Places |
| `components/maps/listing-map.tsx` | Public embed + Directions link | Maps JS |
| Property form Location section | Wires picker to RHF `address` / `placeId` / `coordinates` | picker |
| `convex/properties.ts` + schema | Persist optional fields | existing replace/clear pattern |
| `convex/publicCatalog.ts` | Expose fields on the published detail | schema |

Default map center when there is no pin: Dubai (`25.2048, 55.2708`) if Market is AE; otherwise a well-known capital for the curated Market (TH/TR/PH/LV/GB). Preview only.

## Testing

- `lib/maps/query.ts`: composed geocode string; empty address does not produce a saveable query.
- Property create/update: optional address/placeId/coordinates round-trip; clear location omits them on replace.
- Public catalog: unpublished listings still hidden; published detail includes coordinates when set, nulls when not.
- No live Google calls in unit tests (picker is mocked or untested at the Convex layer).

## Copy to Projects later

Same three fields on `projects`, same picker on the project form, same public block on the project detail page. Not in this implementation.
