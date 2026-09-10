"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { propertySchema } from "@/lib/validation/properties";
import { compactSeoFields, publishingFieldsSchema } from "@/lib/validation/shared";
import { CURATED_AMENITIES } from "@/lib/constants/amenities";
import {
  FURNISHING_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  RENTAL_PERIOD_OPTIONS,
} from "@/lib/constants/property-attributes";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { slugFromTitle } from "@/lib/format/slug";
import { digitsOnly } from "@/lib/format/grouped-number";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { FormLocaleProvider, FormLocaleSwitch, useFormLocale, type FormLocale } from "@/components/forms/form-locale";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { AmenityPicker } from "@/components/forms/amenity-picker";
import { CitySelect } from "@/components/forms/city-select";
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { FormattedNumberInput } from "@/components/forms/formatted-number-input";
import { LocationPicker } from "@/components/maps/location-picker";
import { currencyForCountry } from "@/lib/constants/countries";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import {
  emptyPropertyFormValues,
  isSameLocationValue,
  toPropertyFormValues,
} from "@/lib/admin/property-form-values";

const BEDROOM_OPTIONS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6+" },
];

const LISTING_STATUS_OPTIONS = [
  { value: "for_sale", label: "For Sale" },
  { value: "for_rent", label: "For Rent" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "off_market", label: "Off Market" },
] as const;

const BATHROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

const NONE_VALUE = "__none__";
const LIST_HREF = "/admin/properties";

const propertyFormSchema = z.object({
  title: propertySchema.shape.title,
  description: propertySchema.shape.description,
  price: z.string().min(1, "Required"),
  bedrooms: z.string().min(1, "Required"),
  bathrooms: z.string().min(1, "Required"),
  areaSqft: z.string().min(1, "Required"),
  city: propertySchema.shape.city,
  countryCode: propertySchema.shape.countryCode,
  address: z.string().optional(),
  placeId: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  listingStatus: propertySchema.shape.listingStatus,
  propertyType: propertySchema.shape.propertyType,
  furnishing: propertySchema.shape.furnishing,
  rentalPeriod: propertySchema.shape.rentalPeriod,
  amenities: z.array(z.string()).optional(),
  communityId: propertySchema.shape.communityId,
  developerId: propertySchema.shape.developerId,
  projectId: propertySchema.shape.projectId,
  agentId: propertySchema.shape.agentId,
  seo: propertySchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

function firstErrorPath(errors: FieldErrors, prefix = ""): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value && value.message) return path;
    const nested = firstErrorPath(value as FieldErrors, path);
    if (nested) return nested;
  }
  return null;
}

function localeFromPath(path: string): FormLocale {
  if (path.includes(".ar")) return "ar";
  if (path.includes(".tr")) return "tr";
  return "en";
}

function localeHasCopy(
  title: PropertyFormValues["title"],
  description: PropertyFormValues["description"],
  city: PropertyFormValues["city"],
  locale: FormLocale,
) {
  return Boolean(title[locale]?.trim() || description[locale]?.trim() || city[locale]?.trim());
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function OptionalRelationSelect({
  id,
  value,
  onChange,
  placeholder,
  options,
  loading = false,
}: {
  id: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder: string;
  options: { id: string; label: string }[];
  loading?: boolean;
}) {
  const selectedLabel = value ? options.find((option) => option.id === value)?.label : undefined;
  const display = !value ? placeholder : selectedLabel ?? (loading ? "Loading…" : placeholder);

  return (
    <Select value={value ?? NONE_VALUE} onValueChange={(next) => onChange(!next || next === NONE_VALUE ? undefined : next)}>
      <SelectTrigger id={id} className="w-full">
        <span className={cn("flex flex-1 truncate text-left", !value ? "text-muted-foreground" : undefined)}>
          {display}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OptionalEnumSelect<T extends string>({
  id,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  placeholder: string;
  options: { value: T; label: string }[];
}) {
  const selectedLabel = value ? options.find((option) => option.value === value)?.label : undefined;

  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(next) => onChange(!next || next === NONE_VALUE ? undefined : (next as T))}
    >
      <SelectTrigger id={id} className="w-full">
        <span className={cn("flex flex-1 truncate text-left", !value ? "text-muted-foreground" : undefined)}>
          {selectedLabel ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PropertyFormProps = { mode: "edit"; property: Doc<"properties"> } | { mode: "create" };

function PropertyFormFields(props: PropertyFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const developers = useAuthedQuery(api.developers.list, {});
  const communities = useAuthedQuery(api.communities.list, {});
  const projects = useAuthedQuery(api.projects.listNames, {});
  const agents = useAuthedQuery(api.agents.list, {});
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "property", entityId: props.property._id } : "skip",
  );
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhotos, setPendingPhotos] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const form = useForm<PropertyFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(propertyFormSchema),
          defaultValues: toPropertyFormValues(props.property),
          values: toPropertyFormValues(props.property),
        }
      : { resolver: zodResolver(propertyFormSchema), defaultValues: emptyPropertyFormValues },
  );

  const title = form.watch("title");
  const description = form.watch("description");
  const city = form.watch("city");
  const slug = form.watch("slug");
  const amenities = form.watch("amenities") ?? [];
  const countryCode = form.watch("countryCode");
  const address = form.watch("address") ?? "";
  const placeId = form.watch("placeId");
  const coordinates = form.watch("coordinates");
  const listingStatus = form.watch("listingStatus");
  const savedStatus = props.mode === "edit" ? props.property.publishing.status : "draft";
  const titleEn = title.en;
  const photoCount = props.mode === "create" ? pendingPhotos.length : savedPhotos === undefined ? null : savedPhotos.length;
  const missingArabic = !localeHasCopy(title, description, city, "ar");
  const missingTurkish = !localeHasCopy(title, description, city, "tr");

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty || pendingPhotos.length > 0);
  }, [form.formState.isDirty, pendingPhotos.length, unsaved]);

  useEffect(() => {
    if (slugEdited.current) return;
    const next = slugFromTitle(titleEn ?? "");
    if (next && next !== slug) {
      form.setValue("slug", next, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, slug, titleEn]);

  function onInvalid(errors: FieldErrors<PropertyFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("property-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: PropertyFormValues) {
    const { amenities, price, bedrooms, bathrooms, areaSqft, address, placeId, coordinates, propertyType, furnishing, rentalPeriod, ...rest } =
      values;

    const payload = {
      ...rest,
      price: Number(digitsOnly(price)),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqft: Number(areaSqft),
      address: address?.trim() ? address.trim() : undefined,
      placeId: placeId?.trim() ? placeId.trim() : undefined,
      coordinates,
      propertyType: propertyType || undefined,
      furnishing: furnishing || undefined,
      rentalPeriod: rest.listingStatus === "for_rent" && rentalPeriod ? rentalPeriod : undefined,
      communityId: rest.communityId ? (rest.communityId as Id<"communities">) : undefined,
      developerId: rest.developerId ? (rest.developerId as Id<"developers">) : undefined,
      projectId: rest.projectId ? (rest.projectId as Id<"projects">) : undefined,
      agentId: rest.agentId ? (rest.agentId as Id<"agents">) : undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
      seo: compactSeoFields(rest.seo),
    };

    try {
      if (props.mode === "edit") {
        await updateProperty({ id: props.property._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.status === "published" ? "Listing is live" : "Draft saved");
      } else {
        const id = await createProperty(payload);
        if (pendingPhotos.length > 0) {
          const results = await Promise.allSettled(
            pendingPhotos.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "property", id);
              await createMediaItem({ entityType: "property", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning(`Property created, but ${failedCount} photo(s) failed to upload — add them from the edit page.`);
          } else {
            toast.success(values.status === "published" ? "Listing is live" : "Draft saved");
          }
        } else {
          toast.success(values.status === "published" ? "Listing is live" : "Draft saved");
        }
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        router.push(`/admin/properties/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save property"
          ? detail
          : "Couldn't save this listing. Check the highlighted fields and try again.",
      );
    } finally {
      setSaveIntent(null);
    }
  }

  function requestSave(status: "draft" | "published") {
    form.setValue("status", status, { shouldDirty: true });
    if (status === "published" && savedStatus !== "published") {
      void form.handleSubmit(() => {
        setConfirm("publish");
      }, onInvalid)();
      return;
    }
    if (status === "draft" && savedStatus === "published") {
      void form.handleSubmit(() => {
        setConfirm("unpublish");
      }, onInvalid)();
      return;
    }
    setSaveIntent(status);
    void form.handleSubmit(onSubmit, onInvalid)();
  }

  const publicPath = slug ? `/en/properties/${slug}` : "/en/properties/…";
  const slugField = form.register("slug");

  return (
    <FormProvider {...form}>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          requestSave(savedStatus === "published" ? "published" : "draft");
        }}
        className="flex flex-col gap-4 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32 **:data-[slot=select-trigger]:scroll-mb-32"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormLocaleSwitch
            filled={{
              en: localeHasCopy(title, description, city, "en"),
              ar: localeHasCopy(title, description, city, "ar"),
              tr: localeHasCopy(title, description, city, "tr"),
            }}
          />
        </div>

        <AdminSection title="Listing">
          <LocalizedTextField name="title" label="Title" required placeholder="e.g. 2BR Apartment in Marina Heights" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            required
            placeholder="A short description of the listing…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="property-country">Market *</Label>
              <Controller
                control={form.control}
                name="countryCode"
                render={({ field, fieldState }) => (
                  <CountryCodeSelect
                    id="property-country"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(fieldState.error)}
                  />
                )}
              />
              <FieldError message={form.formState.errors.countryCode?.message} />
            </div>
            <Controller
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <div>
                  <CitySelect
                    countryCode={countryCode}
                    value={field.value}
                    onChange={field.onChange}
                    locale={formLocale?.locale ?? "en"}
                    invalid={Boolean(fieldState.error)}
                  />
                  <FieldError message={form.formState.errors.city?.en?.message} />
                </div>
              )}
            />
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="property-listing-status">Listing Status</Label>
              <Controller
                control={form.control}
                name="listingStatus"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="property-listing-status" className="w-full">
                      <span className="flex flex-1 truncate text-left">
                        {LISTING_STATUS_OPTIONS.find((option) => option.value === field.value)?.label ?? "Select…"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </AdminSection>

        <AdminSection title="Location" hint="Optional. Search an address, then drag the pin if Google is slightly off.">
          <LocationPicker
            cityEn={city.en ?? ""}
            countryCode={countryCode}
            value={{
              address,
              placeId,
              coordinates,
            }}
            onChange={(next) => {
              if (isSameLocationValue({ address, placeId, coordinates }, next)) return;
              form.setValue("address", next.address, { shouldDirty: true });
              form.setValue("placeId", next.placeId, { shouldDirty: true });
              form.setValue("coordinates", next.coordinates, { shouldDirty: true });
            }}
          />
        </AdminSection>

        <AdminSection title="Specs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="property-price">Price *</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <FormattedNumberInput
                    id="property-price"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="1,200,000…"
                    prefix={currencyForCountry(countryCode)}
                    invalid={Boolean(fieldState.error)}
                  />
                )}
              />
              <FieldHint>Amount only — grouping is added as you type.</FieldHint>
              {form.formState.errors.price ? (
                <FieldError message={form.formState.errors.price.message} />
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-area">Area (sq ft) *</Label>
              <Input id="property-area" type="number" inputMode="numeric" autoComplete="off" placeholder="e.g. 1450" {...form.register("areaSqft")} />
              {form.formState.errors.areaSqft ? (
                <FieldError message={form.formState.errors.areaSqft.message} />
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-bedrooms">Bedrooms *</Label>
              <Controller
                control={form.control}
                name="bedrooms"
                render={({ field, fieldState }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="property-bedrooms" className="w-full" aria-invalid={fieldState.error ? true : undefined}>
                      <span className={cn("flex flex-1 truncate text-left", !field.value ? "text-muted-foreground" : undefined)}>
                        {BEDROOM_OPTIONS.find((option) => option.value === field.value)?.label ?? "Select…"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {BEDROOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.bedrooms?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-bathrooms">Bathrooms *</Label>
              <Controller
                control={form.control}
                name="bathrooms"
                render={({ field, fieldState }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="property-bathrooms" className="w-full" aria-invalid={fieldState.error ? true : undefined}>
                      <span className={cn("flex flex-1 truncate text-left", !field.value ? "text-muted-foreground" : undefined)}>
                        {BATHROOM_OPTIONS.find((option) => option.value === field.value)?.label ?? "Select…"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {BATHROOM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.bathrooms?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-type">Property type</Label>
              <Controller
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <OptionalEnumSelect
                    id="property-type"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Not set"
                    options={PROPERTY_TYPE_OPTIONS}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-furnishing">Furnishing</Label>
              <Controller
                control={form.control}
                name="furnishing"
                render={({ field }) => (
                  <OptionalEnumSelect
                    id="property-furnishing"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Not set"
                    options={FURNISHING_OPTIONS}
                  />
                )}
              />
            </div>
            {listingStatus === "for_rent" ? (
              <div className="space-y-1">
                <Label htmlFor="property-rental-period">Rental period</Label>
                <Controller
                  control={form.control}
                  name="rentalPeriod"
                  render={({ field }) => (
                    <OptionalEnumSelect
                      id="property-rental-period"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Not set"
                      options={RENTAL_PERIOD_OPTIONS}
                    />
                  )}
                />
              </div>
            ) : null}
          </div>
          <details className="border-t border-border pt-4">
            <summary className="cursor-pointer text-sm font-medium">
              Amenities{amenities.length > 0 ? ` (${amenities.length} selected)` : ""}
            </summary>
            <div className="mt-3 space-y-1">
              <Controller
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <AmenityPicker value={field.value ?? []} onChange={field.onChange} options={CURATED_AMENITIES} />
                )}
              />
              <FieldHint>Click to toggle, or add one not listed below.</FieldHint>
            </div>
          </details>
        </AdminSection>

        <AdminSection title="Relations" hint="Optional — leave unset if not yet known.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="property-developer">Developer</Label>
              <Controller
                control={form.control}
                name="developerId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    id="property-developer"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="None"
                    loading={developers === undefined}
                    options={(developers ?? []).map((developer) => ({ id: developer._id, label: developer.name.en }))}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-community">Community</Label>
              <Controller
                control={form.control}
                name="communityId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    id="property-community"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="None"
                    loading={communities === undefined}
                    options={(communities ?? [])
                      .toSorted(
                        (a, b) =>
                          Number(b.publishing.status === "published") - Number(a.publishing.status === "published") ||
                          a.name.en.localeCompare(b.name.en),
                      )
                      .map((community) => ({
                        id: community._id,
                        label:
                          community.publishing.status === "published"
                            ? community.name.en
                            : `${community.name.en} (${community.publishing.status === "archived" ? "Archived" : "Draft"})`,
                      }))}
                  />
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-project">Project</Label>
              <Controller
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    id="property-project"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="None"
                    loading={projects === undefined}
                    options={(projects ?? []).map((project) => ({ id: project._id, label: project.title }))}
                  />
                )}
              />
              <FieldHint>Published units linked here appear under this project’s matching unit type.</FieldHint>
            </div>
            <div className="space-y-1">
              <Label htmlFor="property-agent">Agent</Label>
              <Controller
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    id="property-agent"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="None"
                    loading={agents === undefined}
                    options={(agents ?? []).map((agent) => ({ id: agent._id, label: agent.name }))}
                  />
                )}
              />
            </div>
          </div>
        </AdminSection>

        <AdminSection
          title="Photos"
          hint={
            props.mode === "edit"
              ? "First photo is the listing image. Uploads immediately — drag to reorder."
              : "First photo is the listing image. Photos upload when you save — drag to set the cover."
          }
        >
          {props.mode === "edit" ? (
            <MediaUploader entityType="property" entityId={props.property._id} />
          ) : (
            <MediaPicker entityType="property" value={pendingPhotos} onChange={setPendingPhotos} />
          )}
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="property-slug">Slug *</Label>
            <Input
              id="property-slug"
              placeholder="2br-marina-heights…"
              autoComplete="off"
              spellCheck={false}
              translate="no"
              {...slugField}
              onChange={(event) => {
                slugEdited.current = true;
                void slugField.onChange(event);
              }}
            />
            <p className="font-mono text-xs text-muted-foreground" translate="no">{publicPath}</p>
            <FieldHint>Live URL for English. Arabic and Turkish use the same slug under /ar and /tr.</FieldHint>
            {form.formState.errors.slug ? (
              <FieldError message={form.formState.errors.slug.message} />
            ) : null}
          </div>
        </AdminSection>

        <AdminSection id="property-seo" title="SEO" hint="Leave blank to fall back to the listing title and description." collapsible>
          <SeoFieldsSection
            idPrefix="property"
            titlePlaceholder="e.g. 2BR Apartment in Marina Heights | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/properties/2br-marina-heights"
          />
        </AdminSection>

        <AdminStickyActions
          disabled={form.formState.isSubmitting}
          draftLabel={form.formState.isSubmitting && saveIntent === "draft" ? "Saving…" : "Save draft"}
          publishLabel={
            form.formState.isSubmitting && saveIntent === "published"
              ? savedStatus === "published"
                ? "Saving…"
                : "Publishing…"
              : savedStatus === "published"
                ? "Save"
                : "Publish"
          }
          onCancel={() => {
            if (unsaved) unsaved.requestLeave(LIST_HREF);
            else router.push(LIST_HREF);
          }}
          onSaveDraft={() => requestSave("draft")}
          onPublish={() => requestSave("published")}
        />
      </form>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this listing?" : "Publish this listing?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public catalog. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {photoCount === 0 ? " No photos yet — the listing will go live without a cover image." : null}
                  {missingArabic ? " Arabic is empty." : null}
                  {missingTurkish ? " Turkish is empty." : null}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const nextStatus = confirm === "unpublish" ? "draft" : "published";
                setConfirm(null);
                setSaveIntent(nextStatus);
                void form.handleSubmit(onSubmit, onInvalid)();
              }}
            >
              {confirm === "unpublish" ? "Save as draft" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}

export function PropertyForm(props: PropertyFormProps) {
  return (
    <FormLocaleProvider>
      <PropertyFormFields {...props} />
    </FormLocaleProvider>
  );
}
