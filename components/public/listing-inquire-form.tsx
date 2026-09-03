"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListingInquireFormProps = {
  heading: string;
  body: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  messageLabel: string;
  submitLabel: string;
  pendingLabel: string;
  successTitle: string;
  successBody: string;
  errorLabel: string;
  emailFallback?: string;
  phoneFallback?: string;
  emphasis?: boolean;
} & ({ propertyId: Id<"properties"> } | { projectId: Id<"projects"> });

export function ListingInquireForm(props: ListingInquireFormProps) {
  const {
    heading,
    body,
    nameLabel,
    emailLabel,
    phoneLabel,
    messageLabel,
    submitLabel,
    pendingLabel,
    successTitle,
    successBody,
    errorLabel,
    emailFallback,
    phoneFallback,
    emphasis,
  } = props;
  const t = useTranslations("catalog");
  const createListingInquiry = useMutation(api.publicLeads.createListingInquiry);
  const createProjectInquiry = useMutation(api.publicLeads.createProjectInquiry);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = z.object({
    name: z.string().trim().min(1, t("inquireRequired")),
    email: z.email(t("inquireEmailInvalid")),
    phone: z.string().optional(),
    message: z.string().optional(),
    companyUrl: z.string().optional(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "", companyUrl: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    setFormError(null);
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
      message: values.message?.trim() ? values.message.trim() : undefined,
      companyUrl: values.companyUrl?.trim() ? values.companyUrl.trim() : undefined,
    };
    try {
      if ("projectId" in props) {
        await createProjectInquiry({ projectId: props.projectId, ...payload });
      } else {
        await createListingInquiry({ propertyId: props.propertyId, ...payload });
      }
      setSent(true);
    } catch {
      setFormError(errorLabel);
    }
  }

  return (
    <div className={emphasis ? "bg-muted px-6 py-8 sm:px-7 sm:py-10" : "bg-muted px-5 py-6 sm:px-6 sm:py-7"}>
      <h2 id="inquire" className={cn("font-heading font-semibold tracking-tight text-pretty", emphasis ? "text-xl" : "text-lg")}>
        {heading}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{body}</p>
      {sent ? (
        <div className="mt-6" role="status">
          <p className="font-heading text-base font-medium text-foreground">{successTitle}</p>
          <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{successBody}</p>
        </div>
      ) : (
        <form className="relative mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor="listing-company-url">Company</label>
            <input id="listing-company-url" tabIndex={-1} autoComplete="off" {...form.register("companyUrl")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="listing-name">{nameLabel} *</Label>
            <Input id="listing-name" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name) || undefined} {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="listing-email">{emailLabel} *</Label>
            <Input
              id="listing-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(form.formState.errors.email) || undefined}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="listing-phone">{phoneLabel}</Label>
            <Input id="listing-phone" type="tel" autoComplete="tel" {...form.register("phone")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="listing-message">{messageLabel}</Label>
            <Textarea id="listing-message" rows={4} {...form.register("message")} />
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="min-h-11 w-full touch-manipulation" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? pendingLabel : submitLabel}
          </Button>
        </form>
      )}
      {emailFallback || phoneFallback ? (
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {emailFallback ? (
            <a href={`mailto:${emailFallback}`} className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {emailFallback}
            </a>
          ) : null}
          {phoneFallback ? (
            <a href={`tel:${phoneFallback}`} className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {phoneFallback}
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
