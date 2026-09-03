// Stored on `projects.status`. Labels are Dubai catalog copy — not CMS words.
// `upcoming` / `completed` stay in the database; staff and visitors see
// Pre-launch / Ready. Off-plan is the catalog (Projects), not a stage.
export const PROJECT_CONSTRUCTION_STATUSES = [
  { value: "upcoming", label: "Pre-launch" },
  { value: "under_construction", label: "Under construction" },
  { value: "completed", label: "Ready" },
] as const;

export type ProjectConstructionStatus = (typeof PROJECT_CONSTRUCTION_STATUSES)[number]["value"];

export const PROJECT_CONSTRUCTION_LABEL: Record<ProjectConstructionStatus, string> = {
  upcoming: "Pre-launch",
  under_construction: "Under construction",
  completed: "Ready",
};
