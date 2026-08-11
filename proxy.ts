import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const isProtectedPortalRoute = createRouteMatcher(["/admin(.*)", "/agent-portal(.*)", "/client-portal(.*)"]);
// Broader than isProtectedPortalRoute: also covers /sign-in and /sign-up,
// which must skip locale-prefixing (they live outside [locale]) but must
// NOT require auth.protect() — they're how a signed-out user gets signed in.
const isPortalRoute = createRouteMatcher([
  "/admin(.*)",
  "/agent-portal(.*)",
  "/client-portal(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);
// Next.js Route Handlers (Phase 3's app/api/blob/**) — these must still go
// through clerkMiddleware (Route Handlers that call auth() depend on
// Clerk's middleware having run on the request), but must never be handed
// to intlMiddleware: a locale-prefix redirect would turn
// `/api/blob/upload` into `/en/api/blob/upload`, breaking the endpoint.
// Flagged as a follow-up in NOTES.md after Phase 2 dropped the old
// Phase-0-era `api` exclusion when auth was introduced; this is the fix,
// now that Phase 3 adds the first real app/api/** route.
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPortalRoute(req)) {
    await auth.protect();
    // Portal routes live outside [locale] entirely (per the roles/portals
    // spec) — never hand these off to the next-intl middleware.
    return;
  }
  if (isPortalRoute(req) || isApiRoute(req)) {
    // Sign-in/sign-up and API routes: no auth.protect() at the middleware
    // layer (each API route handler does its own auth() check), but still
    // must not be locale-prefixed — same reasoning as the protected portal
    // routes above.
    return;
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Runs Clerk on every route (needed so /admin, /agent-portal,
    // /client-portal, /sign-in, /sign-up all get auth context), while still
    // excluding Next.js internals and static/metadata files.
    "/((?!_next|favicon.ico|icon0.svg|icon1.png|apple-icon.png|manifest.json|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
