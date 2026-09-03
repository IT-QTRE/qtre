// Keep in lockstep with `lib/format/slug.ts` — Convex cannot import that file.

const LATIN_FOLD: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
  ß: "ss",
};

const LATIN_FOLD_PATTERN = /[çğıöşüÇĞİÖŞÜß]/g;

export function categorySlugFromName(name: string) {
  return name
    .replace(LATIN_FOLD_PATTERN, (character) => LATIN_FOLD[character] ?? character)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
