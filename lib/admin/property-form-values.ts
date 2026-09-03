import { emptyFormLocalized, formLocalized, formSeo, type FormLocalized, type FormSeo } from "./form-values";

export type PropertyFormLocalized = FormLocalized;
export type PropertyFormSeo = FormSeo;

export type PropertyFormListingStatus = "for_sale" | "for_rent" | "sold" | "rented" | "off_market";
export type PropertyFormPropertyType = "apartment" | "villa" | "townhouse" | "penthouse" | "duplex" | "hotel_apartment";
export type PropertyFormFurnishing = "unfurnished" | "semi_furnished" | "furnished";
export type PropertyFormRentalPeriod = "yearly" | "monthly";

export type PropertyFormValues = {
  title: PropertyFormLocalized;
  description: PropertyFormLocalized;
  price: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  city: PropertyFormLocalized;
  countryCode: string;
  address: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
  listingStatus: PropertyFormListingStatus;
  propertyType?: PropertyFormPropertyType;
  furnishing?: PropertyFormFurnishing;
  rentalPeriod?: PropertyFormRentalPeriod;
  amenities: string[];
  communityId?: string;
  developerId?: string;
  projectId?: string;
  agentId?: string;
  seo: PropertyFormSeo;
  slug: string;
  status: "draft" | "published" | "archived";
};

export type PropertyFormLocationValue = {
  address: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
};

export type PropertyFormSource = {
  title: { en: string; ar?: string; tr?: string };
  description: { en: string; ar?: string; tr?: string };
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  city: { en: string; ar?: string; tr?: string };
  countryCode: string;
  address?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
  listingStatus: PropertyFormListingStatus;
  propertyType?: PropertyFormPropertyType;
  furnishing?: PropertyFormFurnishing;
  rentalPeriod?: PropertyFormRentalPeriod;
  amenities?: string[];
  communityId?: string;
  developerId?: string;
  projectId?: string;
  agentId?: string;
  seo?: {
    seoTitle?: { en?: string; ar?: string; tr?: string };
    seoDescription?: { en?: string; ar?: string; tr?: string };
    canonicalPath?: string;
  };
  publishing: { slug: string; status: "draft" | "published" | "archived" };
};

export const emptyPropertyFormValues: PropertyFormValues = {
  title: emptyFormLocalized(),
  description: emptyFormLocalized(),
  price: "",
  bedrooms: "",
  bathrooms: "",
  areaSqft: "",
  city: emptyFormLocalized(),
  countryCode: "",
  address: "",
  placeId: undefined,
  coordinates: undefined,
  listingStatus: "for_sale",
  propertyType: undefined,
  furnishing: undefined,
  rentalPeriod: undefined,
  amenities: [],
  communityId: undefined,
  developerId: undefined,
  projectId: undefined,
  agentId: undefined,
  seo: formSeo(undefined),
  slug: "",
  status: "draft",
};

export function toPropertyFormValues(property: PropertyFormSource): PropertyFormValues {
  return {
    title: formLocalized(property.title),
    description: formLocalized(property.description),
    price: String(property.price),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    areaSqft: String(property.areaSqft),
    city: formLocalized(property.city),
    countryCode: property.countryCode,
    address: property.address ?? "",
    placeId: property.placeId,
    coordinates: property.coordinates,
    listingStatus: property.listingStatus,
    propertyType: property.propertyType,
    furnishing: property.furnishing,
    rentalPeriod: property.rentalPeriod,
    amenities: property.amenities ?? [],
    communityId: property.communityId,
    developerId: property.developerId,
    projectId: property.projectId,
    agentId: property.agentId,
    seo: formSeo(property.seo),
    slug: property.publishing.slug,
    status: property.publishing.status,
  };
}

export function isSameLocationValue(current: PropertyFormLocationValue, next: PropertyFormLocationValue): boolean {
  return (
    current.address === next.address &&
    current.placeId === next.placeId &&
    current.coordinates?.lat === next.coordinates?.lat &&
    current.coordinates?.lng === next.coordinates?.lng
  );
}
