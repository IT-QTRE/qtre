import { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Clerk's Frontend API URL — set on the Convex deployment,
      // not just .env.local, since Convex reads this server-side.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
