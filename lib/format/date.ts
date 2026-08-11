const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// Convex's `_creationTime` is a raw epoch-ms number on every document. Every
// admin list-table "Created" column formats it through this one helper so
// the display format only ever needs to change in a single place.
export function formatDate(creationTimeMs: number): string {
  return DATE_FORMATTER.format(new Date(creationTimeMs));
}
