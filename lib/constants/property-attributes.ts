export const PROPERTY_TYPES = ["apartment", "villa", "townhouse", "penthouse", "duplex", "hotel_apartment"] as const;
export const FURNISHING_TYPES = ["unfurnished", "semi_furnished", "furnished"] as const;
export const RENTAL_PERIODS = ["yearly", "monthly"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type FurnishingType = (typeof FURNISHING_TYPES)[number];
export type RentalPeriod = (typeof RENTAL_PERIODS)[number];

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "hotel_apartment", label: "Hotel apartment" },
];

export const FURNISHING_OPTIONS: { value: FurnishingType; label: string }[] = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
];

export const RENTAL_PERIOD_OPTIONS: { value: RentalPeriod; label: string }[] = [
  { value: "yearly", label: "Yearly" },
  { value: "monthly", label: "Monthly" },
];
