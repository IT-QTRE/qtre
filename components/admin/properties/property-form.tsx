"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { propertySchema } from "@/lib/validation/properties";
import { publishingFieldsSchema } from "@/lib/validation/shared";
import { CURATED_AMENITIES } from "@/lib/constants/amenities";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { AmenityPicker } from "@/components/forms/amenity-picker";
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";

const BEDROOM_OPTIONS = [
  { value: "0", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6+" },
];

const BATHROOM_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

// One form serves both Create and Edit — see developer-form.tsx for the
// rationale. Price/area stay plain strings on the form (like every other
// text input here) and parse back to numbers at the submit boundary —
// `z.preprocess()`/`.transform()` on these fields breaks `zodResolver`'s
// generics (a real issue hit while building this form; see Phase 4b's plan
// doc). Bedrooms/bathrooms are also strings for the same Select-binding
// reason, but from a small fixed option list rather than free numeric entry
// — the real-world range is small enough that a dropdown beats typos. Lat/
// lng are gone entirely for now (no map picker yet; a free-text pair wasn't
// pulling its weight) — any coordinates already on a record are simply left
// untouched on save, not scrubbed, since the field is omitted from the
// mutation payload rather than sent as `undefined`.
const propertyFormSchema = z.object({
  title: propertySchema.shape.title,
  description: propertySchema.shape.description,
  price: z.string().min(1, "Required"),
  bedrooms: z.string().min(1, "Required"),
  bathrooms: z.string().min(1, "Required"),
  areaSqft: z.string().min(1, "Required"),
  city: propertySchema.shape.city,
  countryCode: propertySchema.shape.countryCode,
  listingStatus: propertySchema.shape.listingStatus,
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

const DEFAULT_VALUES: PropertyFormValues = {
  title: { en: "" },
  description: { en: "" },
  price: "",
  bedrooms: "",
  bathrooms: "",
  areaSqft: "",
  city: { en: "" },
  countryCode: "",
  listingStatus: "for_sale",
  amenities: [],
  communityId: undefined,
  developerId: undefined,
  projectId: undefined,
  agentId: undefined,
  seo: undefined,
  slug: "",
  status: "draft",
};

function toFormValues(property: Doc<"properties">): PropertyFormValues {
  return {
    title: property.title,
    description: property.description,
    price: String(property.price),
    bedrooms: String(property.bedrooms),
    bathrooms: String(property.bathrooms),
    areaSqft: String(property.areaSqft),
    city: property.city,
    countryCode: property.countryCode,
    listingStatus: property.listingStatus,
    amenities: property.amenities ?? [],
    communityId: property.communityId,
    developerId: property.developerId,
    projectId: property.projectId,
    agentId: property.agentId,
    seo: property.seo,
    slug: property.publishing.slug,
    status: property.publishing.status,
  };
}

// A `Select` needs a non-empty string to show its placeholder correctly for
// an unset optional relation — `""` (rather than `undefined`) is what we
// feed its `value` prop, then translated back to `undefined` on submit.
function OptionalRelationSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | undefined;
  onChange: (value: string | null) => void;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type PropertyFormProps = { mode: "edit"; property: Doc<"properties"> } | { mode: "create" };

export function PropertyForm(props: PropertyFormProps) {
  const router = useRouter();
  const developers = useQuery(api.developers.list) ?? [];
  const communities = useQuery(api.communities.list) ?? [];
  // `listNames` (rather than `list`) — a property may legitimately belong
  // to a project another Admin created, and Projects are otherwise
  // Admin-scoped.
  const projects = useQuery(api.projects.listNames) ?? [];
  const agents = useQuery(api.agents.list) ?? [];
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhotos, setPendingPhotos] = useState<PendingMediaFile[]>([]);
  const form = useForm<PropertyFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(propertyFormSchema), values: toFormValues(props.property) }
      : { resolver: zodResolver(propertyFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: PropertyFormValues) {
    const { amenities, price, bedrooms, bathrooms, areaSqft, ...rest } = values;

    const payload = {
      ...rest,
      price: Number(price),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqft: Number(areaSqft),
      communityId: rest.communityId ? (rest.communityId as Id<"communities">) : undefined,
      developerId: rest.developerId ? (rest.developerId as Id<"developers">) : undefined,
      projectId: rest.projectId ? (rest.projectId as Id<"projects">) : undefined,
      agentId: rest.agentId ? (rest.agentId as Id<"agents">) : undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
    };

    try {
      if (props.mode === "edit") {
        await updateProperty({ id: props.property._id, ...payload });
        toast.success("Property saved");
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
            toast.success("Property created");
          }
        } else {
          toast.success("Property created");
        }
        router.push(`/admin/properties/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save property");
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Basic Info</h3>
              <LocalizedTextField name="title" label="Title" required placeholder="e.g. 2BR Apartment in Marina Heights" />
              <LocalizedTextField
                name="description"
                label="Description"
                multiline
                required
                placeholder="A short description of the listing…"
              />
              <LocalizedTextField name="city" label="City" required placeholder="e.g. Dubai" />

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Pricing &amp; Specs</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="property-price">Price *</Label>
                  <Input id="property-price" type="number" placeholder="e.g. 1200000" {...form.register("price")} />
                  <FieldHint>In the local currency implied by Country Code, no symbol.</FieldHint>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="property-area">Area (sq ft) *</Label>
                  <Input id="property-area" type="number" placeholder="e.g. 1450" {...form.register("areaSqft")} />
                </div>
                <div className="space-y-1">
                  <Label>Bedrooms *</Label>
                  <Controller
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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
                </div>
                <div className="space-y-1">
                  <Label>Bathrooms *</Label>
                  <Controller
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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
                </div>
                <div className="space-y-1">
                  <Label htmlFor="property-country">Country Code *</Label>
                  <Controller
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <CountryCodeSelect id="property-country" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Listing Status</Label>
                  <Controller
                    control={form.control}
                    name="listingStatus"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="for_sale">For Sale</SelectItem>
                          <SelectItem value="for_rent">For Rent</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="off_market">Off Market</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Amenities</h3>
              <div className="space-y-1">
                <Controller
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <AmenityPicker value={field.value ?? []} onChange={field.onChange} options={CURATED_AMENITIES} />
                  )}
                />
                <FieldHint>Click to toggle, or add one not listed below.</FieldHint>
              </div>
            </TabsContent>

            <TabsContent value="relations" className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Relations</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Developer</Label>
                  <Controller
                    control={form.control}
                    name="developerId"
                    render={({ field }) => (
                      <OptionalRelationSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="None"
                        options={developers.map((developer) => ({ id: developer._id, label: developer.name.en }))}
                      />
                    )}
                  />
                  <FieldHint>Optional — leave unset if not yet known.</FieldHint>
                </div>
                <div className="space-y-1">
                  <Label>Community</Label>
                  <Controller
                    control={form.control}
                    name="communityId"
                    render={({ field }) => (
                      <OptionalRelationSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="None"
                        options={communities.map((community) => ({ id: community._id, label: community.name.en }))}
                      />
                    )}
                  />
                  <FieldHint>Optional — leave unset if not yet known.</FieldHint>
                </div>
                <div className="space-y-1">
                  <Label>Project</Label>
                  <Controller
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <OptionalRelationSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="None"
                        options={projects.map((project) => ({ id: project._id, label: project.title }))}
                      />
                    )}
                  />
                  <FieldHint>Optional — leave unset if not yet known.</FieldHint>
                </div>
                <div className="space-y-1">
                  <Label>Agent</Label>
                  <Controller
                    control={form.control}
                    name="agentId"
                    render={({ field }) => (
                      <OptionalRelationSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="None"
                        options={agents.map((agent) => ({ id: agent._id, label: agent.name }))}
                      />
                    )}
                  />
                  <FieldHint>Optional — leave unset if not yet known.</FieldHint>
                </div>
              </div>

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Publishing</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="property-slug">Slug *</Label>
                  <Input id="property-slug" placeholder="2br-marina-heights" {...form.register("slug")} />
                  <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
                  {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Publishing Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldHint>Draft is hidden from the public site. Published is live. Archived is hidden but kept for records.</FieldHint>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <SeoFieldsSection
                idPrefix="property"
                titlePlaceholder="e.g. 2BR Apartment in Marina Heights | QuickTalk Real Estate"
                descriptionPlaceholder="A search-engine-friendly summary…"
                canonicalPlaceholder="/properties/2br-marina-heights"
              />
            </TabsContent>
          </Tabs>

          <Separator />
          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? props.mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.mode === "edit"
                  ? "Save Changes"
                  : "Create Property"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Photos</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="property" entityId={props.property._id} />
        ) : (
          <MediaPicker entityType="property" value={pendingPhotos} onChange={setPendingPhotos} />
        )}
      </div>
    </div>
  );
}
