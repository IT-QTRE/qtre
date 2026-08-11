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
import { projectSchema } from "@/lib/validation/projects";
import { publishingFieldsSchema } from "@/lib/validation/shared";
import { CURATED_AMENITIES } from "@/lib/constants/amenities";
import type { PaymentPlanMilestone } from "@/lib/constants/payment-plans";
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
import { PaymentPlanBuilder } from "@/components/forms/payment-plan-builder";
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";

// One form serves both Create and Edit — see developer-form.tsx for the
// rationale. `startingPrice` stays a plain string on the form (like every
// other text input here) and parses back to a number at the submit
// boundary — `z.preprocess()`/`.transform()` on it breaks `zodResolver`'s
// generics (a real issue hit while building this form; see Phase 4b's plan
// doc). Tabbed Details/Relations/SEO layout and Amenities-as-pills mirror
// Properties' form exactly (see property-form.tsx) for consistency across
// entities. Lat/lng are gone entirely for now (no map picker yet) — any
// coordinates already on a record are left untouched on save, since the
// field is omitted from the mutation payload rather than sent as
// `undefined`.
const projectFormSchema = z.object({
  title: projectSchema.shape.title,
  description: projectSchema.shape.description,
  developerId: projectSchema.shape.developerId,
  communityId: projectSchema.shape.communityId,
  countryCode: projectSchema.shape.countryCode,
  city: projectSchema.shape.city,
  status: projectSchema.shape.status,
  startingPrice: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  paymentPlan: projectSchema.shape.paymentPlan,
  seo: projectSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  publishingStatus: publishingFieldsSchema.shape.status,
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const DEFAULT_VALUES: ProjectFormValues = {
  title: { en: "" },
  description: { en: "" },
  developerId: "",
  communityId: undefined,
  countryCode: "",
  city: { en: "" },
  status: "upcoming",
  startingPrice: undefined,
  amenities: [],
  paymentPlan: [],
  seo: undefined,
  slug: "",
  publishingStatus: "draft",
};

function toFormValues(project: Doc<"projects">): ProjectFormValues {
  return {
    title: project.title,
    description: project.description,
    developerId: project.developerId,
    communityId: project.communityId,
    countryCode: project.countryCode,
    city: project.city,
    status: project.status,
    startingPrice: project.startingPrice !== undefined ? String(project.startingPrice) : undefined,
    amenities: project.amenities ?? [],
    paymentPlan: project.paymentPlan ?? [],
    seo: project.seo,
    slug: project.publishing.slug,
    publishingStatus: project.publishing.status,
  };
}

type ProjectFormProps = { mode: "edit"; project: Doc<"projects"> } | { mode: "create" };

export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const developers = useQuery(api.developers.list) ?? [];
  const communities = useQuery(api.communities.list) ?? [];
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhotos, setPendingPhotos] = useState<PendingMediaFile[]>([]);
  const form = useForm<ProjectFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(projectFormSchema), values: toFormValues(props.project) }
      : { resolver: zodResolver(projectFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: ProjectFormValues) {
    const { amenities, paymentPlan, startingPrice, ...rest } = values;

    const payload = {
      ...rest,
      developerId: rest.developerId as Id<"developers">,
      communityId: rest.communityId ? (rest.communityId as Id<"communities">) : undefined,
      startingPrice: startingPrice ? Number(startingPrice) : undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
      paymentPlan: paymentPlan && paymentPlan.length > 0 ? paymentPlan : undefined,
    };

    try {
      if (props.mode === "edit") {
        await updateProject({ id: props.project._id, ...payload });
        toast.success("Project saved");
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
            toast.success("Project created");
          }
        } else {
          toast.success("Project created");
        }
        router.push(`/admin/projects/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save project");
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
              <LocalizedTextField name="title" label="Title" required placeholder="e.g. Marina Heights" />
              <LocalizedTextField
                name="description"
                label="Description"
                multiline
                required
                placeholder="A short description of the project…"
              />
              <LocalizedTextField name="city" label="City" required placeholder="e.g. Dubai" />

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Location &amp; Pricing</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="project-country">Country Code *</Label>
                  <Controller
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <CountryCodeSelect id="project-country" value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Construction Status</Label>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="under_construction">Under Construction</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="project-starting-price">Starting Price</Label>
                  <Input id="project-starting-price" type="number" placeholder="e.g. 1200000" {...form.register("startingPrice")} />
                  <FieldHint>In the local currency implied by Country Code, no symbol.</FieldHint>
                </div>
              </div>

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Payment Plan</h3>
              <div className="space-y-1">
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
                <FieldHint>Load a recommended plan, then edit freely — or build a custom one from scratch.</FieldHint>
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
                  <Label>Developer *</Label>
                  <Controller
                    control={form.control}
                    name="developerId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a developer" />
                        </SelectTrigger>
                        <SelectContent>
                          {developers.map((developer) => (
                            <SelectItem key={developer._id} value={developer._id}>
                              {developer.name.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.developerId && (
                    <p className="text-sm text-destructive">{form.formState.errors.developerId.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Community</Label>
                  <Controller
                    control={form.control}
                    name="communityId"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          {communities.map((community) => (
                            <SelectItem key={community._id} value={community._id}>
                              {community.name.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldHint>Optional — leave unset if not yet known.</FieldHint>
                </div>
              </div>

              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">Publishing</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="project-slug">Slug *</Label>
                  <Input id="project-slug" placeholder="marina-heights" {...form.register("slug")} />
                  <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
                  {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Publishing Status</Label>
                  <Controller
                    control={form.control}
                    name="publishingStatus"
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
                idPrefix="project"
                titlePlaceholder="e.g. Marina Heights | QuickTalk Real Estate"
                descriptionPlaceholder="A search-engine-friendly summary…"
                canonicalPlaceholder="/projects/marina-heights"
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
                  : "Create Project"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Gallery</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="project" entityId={props.project._id} />
        ) : (
          <MediaPicker entityType="project" value={pendingPhotos} onChange={setPendingPhotos} />
        )}
      </div>
    </div>
  );
}
