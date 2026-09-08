import { serviceDeskAdminLabel, type ServiceGroup } from "@/lib/service-desks";

export type IntakeDetails = {
  choice?: string;
  extras?: string[];
  count?: number;
  remoteInUae?: "yes" | "no";
  remoteFamily?: "yes" | "no";
};

export function emptyIntakeDetails(): IntakeDetails {
  return { extras: [], count: 1 };
}

const ADMIN_OPTION: Record<string, string> = {
  employment: "Employment",
  investor: "Investor / partner",
  family: "Family",
  domestic: "Domestic worker",
  specialist: "Specialist",
  student: "Student",
  spouse: "Spouse",
  children: "Children",
  parents: "Parents",
  parentsInLaw: "Parents-in-law",
  property: "Property",
  entrepreneur: "Entrepreneur",
  talent: "Specialised talent",
  other: "Other",
  media: "Media",
  tech: "Tech",
  education: "Education",
  design: "Design",
  mainland: "Mainland",
  freezone: "Free zone",
  name: "Name",
  activity: "Activity",
  address: "Address",
  sponsor: "Sponsor",
  management: "Management",
  partners: "Partners",
  capital: "Capital",
  yes: "Yes",
  no: "No",
  freezeYear: "About one year",
  freezeThree: "Up to three years",
};

function optionLabel(id: string) {
  return ADMIN_OPTION[id] ?? id;
}

export function detailsReady(desk: string, details: IntakeDetails): boolean {
  switch (desk) {
    case "residence":
      if (!details.choice) return false;
      return details.choice !== "family" || (details.count ?? 0) >= 1;
    case "dependent":
      return Boolean(details.choice) && (details.count ?? 0) >= 1;
    case "remote-work":
      return Boolean(details.remoteInUae && details.remoteFamily);
    case "golden":
    case "freelance":
    case "freezing":
      return Boolean(details.choice);
    case "renewal":
      return Boolean(details.choice) && (details.count ?? 0) >= 1;
    case "modification":
      return (details.extras?.length ?? 0) > 0;
    case "cancellation":
      if (details.choice === "no") return true;
      return details.choice === "yes" && (details.count ?? 0) >= 1;
    default:
      return false;
  }
}

export function formatIntakeNote(group: ServiceGroup, desk: string, details: IntakeDetails): string {
  const lines = [serviceDeskAdminLabel(group, desk)];

  switch (desk) {
    case "residence":
      if (details.choice) lines.push(`Path: ${optionLabel(details.choice)}`);
      if (details.choice === "family") lines.push(`People: ${details.count ?? 1}`);
      break;
    case "dependent":
      if (details.choice) lines.push(`Sponsoring: ${optionLabel(details.choice)}`);
      lines.push(`People: ${details.count ?? 1}`);
      break;
    case "remote-work":
      if (details.remoteInUae) lines.push(`Already in the UAE: ${optionLabel(details.remoteInUae)}`);
      if (details.remoteFamily) lines.push(`Family coming: ${optionLabel(details.remoteFamily)}`);
      break;
    case "golden":
      if (details.choice) lines.push(`Path: ${optionLabel(details.choice)}`);
      break;
    case "freelance":
      if (details.choice) lines.push(`Field: ${optionLabel(details.choice)}`);
      break;
    case "renewal":
      if (details.choice) lines.push(`Zone: ${optionLabel(details.choice)}`);
      lines.push(`Visas on the license: ${details.count ?? 1}`);
      break;
    case "modification":
      if (details.extras?.length) lines.push(`Changes: ${details.extras.map(optionLabel).join(", ")}`);
      break;
    case "cancellation":
      if (details.choice) lines.push(`Active visas to cancel: ${optionLabel(details.choice)}`);
      if (details.choice === "yes") lines.push(`Visas: ${details.count ?? 1}`);
      break;
    case "freezing":
      if (details.choice) lines.push(`Duration: ${optionLabel(details.choice)}`);
      break;
    default:
      break;
  }

  return lines.join("\n");
}
