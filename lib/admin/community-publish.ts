export function communityHasLocaleCopy(
  name: { en?: string; ar?: string; tr?: string },
  description: { en?: string; ar?: string; tr?: string } | undefined,
  city: { en?: string; ar?: string; tr?: string },
  locale: "en" | "ar" | "tr",
) {
  return Boolean(name[locale]?.trim() || description?.[locale]?.trim() || city[locale]?.trim());
}

export function communityPublishNotes(input: {
  photoCount: number | null;
  name: { en?: string; ar?: string; tr?: string };
  description?: { en?: string; ar?: string; tr?: string };
  city: { en?: string; ar?: string; tr?: string };
}): string[] {
  const notes: string[] = [];
  if (input.photoCount === 0) notes.push("No photos yet — the place page will go live without a hero.");
  if (!input.description?.en?.trim()) notes.push("No description yet — the place page will go live without an about section.");
  if (!communityHasLocaleCopy(input.name, input.description, input.city, "ar")) notes.push("Arabic is empty.");
  if (!communityHasLocaleCopy(input.name, input.description, input.city, "tr")) notes.push("Turkish is empty.");
  return notes;
}
