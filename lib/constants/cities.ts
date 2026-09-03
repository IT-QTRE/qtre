export type CuratedCity = {
  en: string;
  ar?: string;
  tr?: string;
};

// Cities QuickTalk actually lists in, grouped by Market. Not a closed enum —
// staff can still type a city that isn't here via CitySelect's "Other…".
export const CURATED_CITIES: Record<string, readonly CuratedCity[]> = {
  AE: [
    { en: "Dubai", ar: "دبي", tr: "Dubai" },
    { en: "Abu Dhabi", ar: "أبو ظبي", tr: "Abu Dabi" },
    { en: "Sharjah", ar: "الشارقة", tr: "Şarika" },
    { en: "Ajman", ar: "عجمان", tr: "Acman" },
    { en: "Ras Al Khaimah", ar: "رأس الخيمة", tr: "Ras el-Hayme" },
    { en: "Umm Al Quwain", ar: "أم القيوين", tr: "Ummül Kayveyn" },
    { en: "Fujairah", ar: "الفجيرة", tr: "Füceyre" },
    { en: "Al Ain", ar: "العين", tr: "El Ayn" },
  ],
  TH: [
    { en: "Bangkok", ar: "بانكوك", tr: "Bangkok" },
    { en: "Phuket", ar: "بوكيت", tr: "Phuket" },
    { en: "Pattaya", ar: "باتايا", tr: "Pattaya" },
    { en: "Chiang Mai", ar: "شيانغ ماي", tr: "Chiang Mai" },
    { en: "Samui", ar: "ساموي", tr: "Samui" },
  ],
  TR: [
    { en: "Istanbul", ar: "إسطنبول", tr: "İstanbul" },
    { en: "Ankara", ar: "أنقرة", tr: "Ankara" },
    { en: "Antalya", ar: "أنطاليا", tr: "Antalya" },
    { en: "Izmir", ar: "إزمير", tr: "İzmir" },
    { en: "Bodrum", ar: "بودروم", tr: "Bodrum" },
  ],
  PH: [
    { en: "Manila", ar: "مانيلا", tr: "Manila" },
    { en: "Makati", ar: "ماكاتي", tr: "Makati" },
    { en: "Cebu", ar: "سيبو", tr: "Cebu" },
    { en: "Tagaytay", ar: "تاغيتاي", tr: "Tagaytay" },
    { en: "Davao", ar: "دافاو", tr: "Davao" },
  ],
  LV: [
    { en: "Riga", ar: "ريغا", tr: "Riga" },
    { en: "Jurmala", ar: "جورمالا", tr: "Jurmala" },
  ],
  GB: [
    { en: "London", ar: "لندن", tr: "Londra" },
    { en: "Manchester", ar: "مانشستر", tr: "Manchester" },
    { en: "Birmingham", ar: "برمنغهام", tr: "Birmingham" },
    { en: "Edinburgh", ar: "إدنبرة", tr: "Edinburgh" },
  ],
};

export function citiesForCountry(countryCode: string): readonly CuratedCity[] {
  return CURATED_CITIES[countryCode] ?? [];
}

export function matchCuratedCity(countryCode: string, cityEn: string | undefined): CuratedCity | undefined {
  const needle = cityEn?.trim().toLowerCase();
  if (!needle) return undefined;
  return citiesForCountry(countryCode).find((city) => city.en.toLowerCase() === needle);
}

export function cityLabel(city: CuratedCity, locale: "en" | "ar" | "tr"): string {
  if (locale === "ar") return city.ar || city.en;
  if (locale === "tr") return city.tr || city.en;
  return city.en;
}
