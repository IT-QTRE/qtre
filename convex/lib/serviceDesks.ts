import { v } from "convex/values";

export const serviceGroupValidator = v.union(v.literal("visa"), v.literal("license"));

export const serviceDeskSlugValidator = v.union(
  v.literal("residence"),
  v.literal("dependent"),
  v.literal("remote-work"),
  v.literal("golden"),
  v.literal("freelance"),
  v.literal("renewal"),
  v.literal("modification"),
  v.literal("cancellation"),
  v.literal("freezing"),
);

export const serviceLeadStatusValidator = v.union(
  v.literal("new"),
  v.literal("contacted"),
  v.literal("qualified"),
  v.literal("closed"),
);

// Keep in lockstep with `SERVICE_DESKS` in lib/service-desks.ts.
export const SERVICE_DESK_KEYS = [
  { group: "visa", desk: "residence" },
  { group: "visa", desk: "dependent" },
  { group: "visa", desk: "remote-work" },
  { group: "visa", desk: "golden" },
  { group: "visa", desk: "freelance" },
  { group: "license", desk: "renewal" },
  { group: "license", desk: "modification" },
  { group: "license", desk: "cancellation" },
  { group: "license", desk: "freezing" },
] as const;

export function isServiceDesk(group: string, desk: string) {
  return SERVICE_DESK_KEYS.some((item) => item.group === group && item.desk === desk);
}
