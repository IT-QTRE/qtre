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
import { projectSchema } from "@/lib/validation/projects";
import { compactSeoFields, publishingFieldsSchema } from "@/lib/validation/shared";
import { CURATED_AMENITIES } from "@/lib/constants/amenities";
import type { PaymentPlanMilestone } from "@/lib/constants/payment-plans";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { slugFromTitle } from "@/lib/format/slug";
import { digitsOnly } from "@/lib/format/grouped-number";
import { sqftToSqm } from "@/lib/format/area";
import { cn } from "@/lib/utils";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
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
import { PaymentPlanBuilder } from "@/components/forms/payment-plan-builder";
import { CitySelect } from "@/components/forms/city-select";
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { FormattedNumberInput } from "@/components/forms/formatted-number-input";
import { LocationPicker } from "@/components/maps/location-picker";
import { currencyForCountry } from "@/lib/constants/countries";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";
import { AdminSection } from "@/components/admin/admin-section";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import { PROJECT_CONSTRUCTION_STATUSES } from "@/lib/constants/project-status";
import {
  COMPLETION_QUARTERS,
  completionYearOptions,
  isCompletionQuarter,
  parseCompletionDate,
} from "@/lib/format/completion-date";
import { formLocalized, formSeo } from "@/lib/admin/form-values";
import { UnitTypeEditor, type UnitTypeFormRow } from "@/components/forms/unit-type-editor";
import { bedroomTypeSchema } from "@/lib/validation/projects";
import type { BedroomType } from "@/lib/format/bedroom-types";

const NONE_VALUE = "__none__";
const LIST_HREF = "/admin/projects";

const projectFormSchema = z
  .object({
    title: projectSchema.shape.title,
    description: projectSchema.shape.description,
    developerId: projectSchema.shape.developerId,
    communityId: projectSchema.shape.communityId,
    countryCode: projectSchema.shape.countryCode,
    city: projectSchema.shape.city,
    status: projectSchema.shape.status,
    completionQuarter: z.enum(["", "1", "2", "3", "4"]),
    completionYear: z.string(),
    startingPrice: z.string().optional(),
    unitTypes: z.array(
      z.object({
        bedrooms: bedroomTypeSchema,
        minAreaSqm: z.string(),
        maxAreaSqm: z.string(),
        minPrice: z.string(),
        maxPrice: z.string(),
      }),
    ),
    address: z.string().optional(),
    placeId: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    amenities: z.array(z.string()).optional(),
    paymentPlan: projectSchema.shape.paymentPlan,
    seo: projectSchema.shape.seo,
    slug: publishingFieldsSchema.shape.slug,
    publishingStatus: publishingFieldsSchema.shape.status,
  })
  .superRefine((values, ctx) => {
    const hasQuarter = values.completionQuarter !== "";
    const hasYear = values.completionYear !== "";
    if (hasQuarter === hasYear) return;
    ctx.addIssue({
      code: "custom",
      message: "Choose both a quarter and a year, or leave both empty.",
      path: hasQuarter ? ["completionYear"] : ["completionQuarter"],
    });
  });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const DEFAULT_VALUES: ProjectFormValues = {
  title: formLocalized(undefined),
  description: formLocalized(undefined),
  developerId: "",
  communityId: undefined,
  countryCode: "",
  city: formLocalized(undefined),
  status: "upcoming",
  completionQuarter: "",
  completionYear: "",
  startingPrice: "",
  unitTypes: [],
  address: "",
  placeId: undefined,
  coordinates: undefined,
  amenities: [],
  paymentPlan: [],
  seo: formSeo(undefined),
  slug: "",
  publishingStatus: "draft",
};

function numberToDigits(value: number | undefined) {
  return value != null ? String(value) : "";
}

function optionalAmount(value: string | undefined) {
  const digits = digitsOnly(value ?? "");
  return digits ? Number(digits) : undefined;
}

function sqmDigits(value: number | undefined, fallbackSqft: number | undefined) {
  if (value != null) return numberToDigits(value);
  if (fallbackSqft != null) return numberToDigits(sqftToSqm(fallbackSqft));
  return "";
}

function unitTypesToForm(project: Doc<"projects">): UnitTypeFormRow[] {
  const specs: {
    bedrooms: number;
    minAreaSqm?: number;
    maxAreaSqm?: number;
    minAreaSqft?: number;
    maxAreaSqft?: number;
    minPrice?: number;
    maxPrice?: number;
  }[] = project.unitTypes?.length
    ? project.unitTypes
    : (project.bedroomTypes ?? []).map((bedrooms) => ({ bedrooms }));
  return specs.map((spec) => ({
    bedrooms: spec.bedrooms as BedroomType,
    minAreaSqm: sqmDigits(spec.minAreaSqm, spec.minAreaSqft),
    maxAreaSqm: sqmDigits(spec.maxAreaSqm, spec.maxAreaSqft),
    minPrice: numberToDigits(spec.minPrice),
    maxPrice: numberToDigits(spec.maxPrice),
  }));
}

function toFormValues(project: Doc<"projects">): ProjectFormValues {
  return {
    title: formLocalized(project.title),
    description: formLocalized(project.description),
    developerId: project.developerId,
    communityId: project.communityId,
    countryCode: project.countryCode,
    city: formLocalized(project.city),
    status: project.status,
    completionQuarter:
      project.completionDate && isCompletionQuarter(project.completionDate.quarter)
        ? (`${project.completionDate.quarter}` as "1" | "2" | "3" | "4")
        : "",
    completionYear: project.completionDate ? String(project.completionDate.year) : "",
    startingPrice: project.startingPrice !== undefined ? String(project.startingPrice) : "",
    unitTypes: unitTypesToForm(project),
    address: project.address ?? "",
    placeId: project.placeId,
    coordinates: project.coordinates,
    amenities: project.amenities ?? [],
    paymentPlan: project.paymentPlan ?? [],
    seo: formSeo(project.seo),
    slug: project.publishing.slug,
    publishingStatus: project.publishing.status,
  };
}

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
  title: ProjectFormValues["title"],
  description: ProjectFormValues["description"],
  city: ProjectFormValues["city"],
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

type ProjectFormProps = { mode: "edit"; project: Doc<"projects"> } | { mode: "create" };

function ProjectFormFields(props: ProjectFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const developers = useAuthedQuery(api.developers.list, {});
  const communities = useAuthedQuery(api.communities.list, {});
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "project", entityId: props.project._id } : "skip",
  );
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhotos, setPendingPhotos] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const form = useForm<ProjectFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(projectFormSchema),
          defaultValues: toFormValues(props.project),
          values: toFormValues(props.project),
        }
      : { resolver: zodResolver(projectFormSchema), defaultValues: DEFAULT_VALUES },
  );

  const title = form.watch("title");
  const description = form.watch("description");
  const city = form.watch("city");
  const slug = form.watch("slug");
  const countryCode = form.watch("countryCode");
  const address = form.watch("address") ?? "";
  const placeId = form.watch("placeId");
  const coordinates = form.watch("coordinates");
  const developerId = form.watch("developerId");
  const completionYear = form.watch("completionYear");
  const savedStatus = props.mode === "edit" ? props.project.publishing.status : "draft";
  const titleEn = title.en;
  const photoCount = props.mode === "create" ? pendingPhotos.length : savedPhotos === undefined ? null : savedPhotos.length;
  const missingArabic = !localeHasCopy(title, description, city, "ar");
  const missingTurkish = !localeHasCopy(title, description, city, "tr");
  const selectedDeveloper = (developers ?? []).find((developer) => developer._id === developerId);
  const yearChoices = completionYearOptions(undefined, completionYear ? Number(completionYear) : undefined);

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

  function onInvalid(errors: FieldErrors<ProjectFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("project-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: ProjectFormValues) {
    const {
      amenities,
      paymentPlan,
      startingPrice,
      unitTypes,
      address,
      placeId,
      coordinates,
      completionQuarter,
      completionYear,
      ...rest
    } = values;
    const priceDigits = digitsOnly(startingPrice ?? "");
    const layouts = unitTypes.flatMap((row) => {
      const spec: {
        bedrooms: BedroomType;
        minAreaSqm?: number;
        maxAreaSqm?: number;
        minPrice?: number;
        maxPrice?: number;
      } = { bedrooms: row.bedrooms };
      const minAreaSqm = optionalAmount(row.minAreaSqm);
      const maxAreaSqm = optionalAmount(row.maxAreaSqm);
      const minPrice = optionalAmount(row.minPrice);
      const maxPrice = optionalAmount(row.maxPrice);
      if (minAreaSqm != null) spec.minAreaSqm = minAreaSqm;
      if (maxAreaSqm != null) spec.maxAreaSqm = maxAreaSqm;
      if (minPrice != null) spec.minPrice = minPrice;
      if (maxPrice != null) spec.maxPrice = maxPrice;
      return [spec];
    });

    const payload = {
      ...rest,
      developerId: rest.developerId as Id<"developers">,
      communityId: rest.communityId ? (rest.communityId as Id<"communities">) : undefined,
      startingPrice: priceDigits ? Number(priceDigits) : undefined,
      completionDate: parseCompletionDate(completionQuarter, completionYear),
      bedroomTypes: layouts.length > 0 ? layouts.map((row) => row.bedrooms) : undefined,
      unitTypes: layouts.length > 0 ? layouts : undefined,
      address: address?.trim() ? address.trim() : undefined,
      placeId: placeId?.trim() ? placeId.trim() : undefined,
      coordinates,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
      paymentPlan: paymentPlan && paymentPlan.length > 0 ? paymentPlan : undefined,
      seo: compactSeoFields(rest.seo),
    };

    try {
      if (props.mode === "edit") {
        await updateProject({ id: props.project._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.publishingStatus === "published" ? "Project is live" : "Draft saved");
      } else {
        const id = await createProject(payload);
        if (pendingPhotos.length > 0) {
          const results = await Promise.allSettled(
            pendingPhotos.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "project", id);
              await createMediaItem({ entityType: "project", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning(`Project created, but ${failedCount} photo(s) failed to upload — add them from the edit page.`);
          } else {
            toast.success(values.publishingStatus === "published" ? "Project is live" : "Draft saved");
          }
        } else {
          toast.success(values.publishingStatus === "published" ? "Project is live" : "Draft saved");
        }
        unsaved?.setDirty(false);
        router.push(`/admin/projects/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save project"
          ? detail
          : "Couldn't save this project. Check the highlighted fields and try again.",
      );
    } finally {
      setSaveIntent(null);
    }
  }

  function requestSave(status: "draft" | "published") {
    form.setValue("publishingStatus", status, { shouldDirty: true });
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

  const publicPath = slug ? `/en/projects/${slug}` : "/en/projects/…";
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

        <AdminSection title="Project">
          <LocalizedTextField name="title" label="Title" required placeholder="e.g. Marina Heights" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            required
            placeholder="A short description of the project…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="project-country">Market *</Label>
              <Controller
                control={form.control}
                name="countryCode"
                render={({ field, fieldState }) => (
                  <CountryCodeSelect
                    id="project-country"
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
            <div className="space-y-1">
              <Label htmlFor="project-status">Construction status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="project-status" className="w-full">
                      <span className="flex flex-1 truncate text-left">
                        {PROJECT_CONSTRUCTION_STATUSES.find((option) => option.value === field.value)?.label ?? "Select…"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_CONSTRUCTION_STATUSES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <fieldset className="space-y-3 sm:col-span-2">
              <legend className="text-sm font-medium">Completion date</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="project-completion-quarter">Quarter</Label>
                  <Controller
                    control={form.control}
                    name="completionQuarter"
                    render={({ field }) => (
                      <Select
                        value={field.value || NONE_VALUE}
                        onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
                      >
                        <SelectTrigger id="project-completion-quarter" className="w-full">
                          <span className="flex flex-1 truncate text-left">
                            {field.value ? `Q${field.value}` : "Not set"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                          {COMPLETION_QUARTERS.map((quarter) => (
                            <SelectItem key={quarter} value={String(quarter)}>
                              Q{quarter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.completionQuarter ? (
                    <FieldError message={form.formState.errors.completionQuarter.message} />
                  ) : null}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="project-completion-year">Year</Label>
                  <Controller
                    control={form.control}
                    name="completionYear"
                    render={({ field }) => (
                      <Select
                        value={field.value || NONE_VALUE}
                        onValueChange={(value) => field.onChange(value === NONE_VALUE ? "" : value)}
                      >
                        <SelectTrigger id="project-completion-year" className="w-full">
                          <span className="flex flex-1 truncate text-left">{field.value || "Not set"}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Not set</SelectItem>
                          {yearChoices.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.completionYear ? (
                    <FieldError message={form.formState.errors.completionYear.message} />
                  ) : null}
                </div>
              </div>
              <FieldHint>Optional. The quarter window other portals list, for example Q4 2027.</FieldHint>
            </fieldset>
            <div className="space-y-1">
              <Label htmlFor="project-starting-price">Starting price</Label>
              <Controller
                control={form.control}
                name="startingPrice"
                render={({ field, fieldState }) => (
                  <FormattedNumberInput
                    id="project-starting-price"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="1,200,000…"
                    prefix={currencyForCountry(countryCode)}
                    invalid={Boolean(fieldState.error)}
                  />
                )}
              />
              <FieldHint>Optional. Amount only — grouping is added as you type.</FieldHint>
              {form.formState.errors.startingPrice ? (
                <FieldError message={form.formState.errors.startingPrice.message} />
              ) : null}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Unit types</Label>
            <Controller
              control={form.control}
              name="unitTypes"
              render={({ field }) => (
                <UnitTypeEditor
                  value={field.value ?? []}
                  onChange={field.onChange}
                  currency={currencyForCountry(countryCode) ?? "AED"}
                />
              )}
            />
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
              form.setValue("address", next.address, { shouldDirty: true });
              form.setValue("placeId", next.placeId, { shouldDirty: true });
              form.setValue("coordinates", next.coordinates, { shouldDirty: true });
            }}
          />
        </AdminSection>

        <AdminSection title="Payment plan" hint="Load a recommended plan, then edit freely — or build a custom one from scratch.">
          <Controller
            control={form.control}
            name="paymentPlan"
            render={({ field }) => (
              <PaymentPlanBuilder
                value={(field.value ?? []) as PaymentPlanMilestone[]}
                onChange={field.onChange}
              />
            )}
          />
        </AdminSection>

        <AdminSection title="Amenities" hint="Click to toggle, or add one not listed below.">
          <Controller
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <AmenityPicker value={field.value ?? []} onChange={field.onChange} options={CURATED_AMENITIES} />
            )}
          />
        </AdminSection>

        <AdminSection title="Relations">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="project-developer">Developer *</Label>
              <Controller
                control={form.control}
                name="developerId"
                render={({ field, fieldState }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(next) => field.onChange(!next || next === NONE_VALUE ? "" : next)}
                  >
                    <SelectTrigger
                      id="project-developer"
                      className="w-full"
                      aria-invalid={fieldState.error ? true : undefined}
                    >
                      <span className={cn("flex flex-1 truncate text-left", !field.value ? "text-muted-foreground" : undefined)}>
                        {selectedDeveloper?.name.en ?? (developers === undefined ? "Loading…" : "Select a developer")}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Select a developer</SelectItem>
                      {(developers ?? []).map((developer) => (
                        <SelectItem key={developer._id} value={developer._id}>
                          {developer.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={form.formState.errors.developerId?.message} />
              <FieldHint>
                Not in the list?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    if (unsaved) unsaved.requestLeave("/admin/developers/new");
                    else router.push("/admin/developers/new");
                  }}
                >
                  Add a developer
                </button>
              </FieldHint>
            </div>
            <div className="space-y-1">
              <Label htmlFor="project-community">Community</Label>
              <Controller
                control={form.control}
                name="communityId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    id="project-community"
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
              <FieldHint>Optional — leave unset if not yet known.</FieldHint>
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
            <MediaUploader entityType="project" entityId={props.project._id} />
          ) : (
            <MediaPicker entityType="project" value={pendingPhotos} onChange={setPendingPhotos} />
          )}
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="project-slug">Slug *</Label>
            <Input
              id="project-slug"
              placeholder="marina-heights…"
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

        <AdminSection id="project-seo" title="SEO" hint="Leave blank to fall back to the project title and description." collapsible>
          <SeoFieldsSection
            idPrefix="project"
            titlePlaceholder="e.g. Marina Heights | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/projects/marina-heights"
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
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this project?" : "Publish this project?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public catalog. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {photoCount === 0 ? " No photos yet — the project will go live without a cover image." : null}
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

export function ProjectForm(props: ProjectFormProps) {
  return (
    <FormLocaleProvider>
      <ProjectFormFields {...props} />
    </FormLocaleProvider>
  );
}
