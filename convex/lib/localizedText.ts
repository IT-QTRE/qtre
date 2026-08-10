import { v, type Infer } from "convex/values";

export const localizedTextValidator = v.object({
  en: v.string(),
  ar: v.optional(v.string()),
  tr: v.optional(v.string()),
});

export type LocalizedText = Infer<typeof localizedTextValidator>;
