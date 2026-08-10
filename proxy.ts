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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedPortalRoute(req)) {
    await auth.protect();
    // Portal routes live outside [locale] entirely (per the roles/portals
    // spec) — never hand these off to the next-intl middleware.
    return;
  }
  if (isPortalRoute(req)) {
    // Sign-in/sign-up: no auth required, but still must not be
    // locale-prefixed — same reasoning as the protected portal routes above.
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
