export const SERVICE_GROUPS = ["visa", "license"] as const;
export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

export const SERVICE_DESKS = [
  {
    group: "visa",
    slug: "residence",
    nameKey: "visaResidenceName",
    bodyKey: "visaResidenceBody",
    typesKey: "visaResidenceTypes",
    dossier: "residence",
  },
  {
    group: "visa",
    slug: "dependent",
    nameKey: "visaDependentName",
    bodyKey: "visaDependentBody",
    typesKey: "visaDependentTypes",
    dossier: "dependent",
  },
  { group: "visa", slug: "remote-work", nameKey: "visaRemoteName", bodyKey: "visaRemoteBody", dossier: "remote-work" },
  {
    group: "visa",
    slug: "golden",
    nameKey: "visaGoldenName",
    bodyKey: "visaGoldenBody",
    typesKey: "visaGoldenTypes",
    dossier: "golden",
  },
  {
    group: "visa",
    slug: "freelance",
    nameKey: "visaFreelanceName",
    bodyKey: "visaFreelanceBody",
    typesKey: "visaFreelanceTypes",
    dossier: "freelance",
  },
  { group: "license", slug: "renewal", nameKey: "licenseRenewName", bodyKey: "licenseRenewBody", dossier: "renewal" },
  {
    group: "license",
    slug: "modification",
    nameKey: "licenseModifyName",
    bodyKey: "licenseModifyBody",
    typesKey: "licenseModifyTypes",
    dossier: "modification",
  },
  { group: "license", slug: "cancellation", nameKey: "licenseCancelName", bodyKey: "licenseCancelBody", dossier: "cancellation" },
  { group: "license", slug: "freezing", nameKey: "licenseFreezeName", bodyKey: "licenseFreezeBody", dossier: "freezing" },
] as const;

export type ServiceDesk = (typeof SERVICE_DESKS)[number];

export function serviceDeskPath(desk: Pick<ServiceDesk, "group" | "slug">) {
  return `/services/${desk.group}/${desk.slug}` as const;
}

export function getServiceDesk(group: string, slug: string) {
  if (group !== "visa" && group !== "license") return null;
  return SERVICE_DESKS.find((desk) => desk.group === group && desk.slug === slug) ?? null;
}

export function desksInGroup(group: ServiceGroup) {
  return SERVICE_DESKS.filter((desk) => desk.group === group);
}

export function isServiceGroup(value: string): value is ServiceGroup {
  return value === "visa" || value === "license";
}

export function serviceDeskAdminLabel(group: string, slug: string) {
  const desk = getServiceDesk(group, slug);
  if (!desk) return `${group} / ${slug}`;
  const labels: Record<ServiceDesk["nameKey"], string> = {
    visaResidenceName: "Residence visa",
    visaDependentName: "Dependent visa",
    visaRemoteName: "Remote work visa",
    visaGoldenName: "Golden Visa",
    visaFreelanceName: "Freelance visa",
    licenseRenewName: "License renewal",
    licenseModifyName: "License modification",
    licenseCancelName: "License cancellation",
    licenseFreezeName: "License freezing",
  };
  return labels[desk.nameKey];
}
