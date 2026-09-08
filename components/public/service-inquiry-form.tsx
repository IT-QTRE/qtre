"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { getServiceDesk, type ServiceGroup } from "@/lib/service-desks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type InquiryDesk = {
  group: ServiceGroup;
  slug: string;
  label: string;
};

export type InquiryChoice = {
  group: ServiceGroup;
  slug: string;
  name: string;
};

function choiceValue(group: ServiceGroup, slug: string) {
  return `${group}:${slug}`;
}

const selectClassName =
  "h-9 w-full min-w-0 rounded-none border border-transparent bg-input/50 px-3 py-1 text-base outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}
      <span className="text-destructive" aria-hidden>
        {" "}
        *
      </span>
    </span>
  );
}

function joinMessage(intakeNote: string | undefined, note: string | undefined) {
  const parts = [intakeNote?.trim(), note?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

export function ServiceInquiryForm({
  selected,
  idPrefix,
  choices,
  onSelect,
  hideDeskLabel,
  intakeNote,
  onSent,
}: {
  selected: InquiryDesk | null;
  idPrefix: string;
  choices?: { visa: InquiryChoice[]; license: InquiryChoice[] };
  onSelect?: (next: InquiryDesk) => void;
  hideDeskLabel?: boolean;
  intakeNote?: string;
  onSent?: () => void;
}) {
  const t = useTranslations("serviceInquiry");
  const createInquiry = useMutation(api.publicServiceLeads.create);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const schema = z.object({
    name: z.string().trim().min(1, t("required")),
    email: z.email(t("emailInvalid")),
    phone: z.string().trim().min(1, t("required")),
    message: z.string().optional(),
    companyUrl: z.string().optional(),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "", companyUrl: "" },
  });
  const desk = selected ? getServiceDesk(selected.group, selected.slug) : null;
  const allChoices = choices ? [...choices.visa, ...choices.license] : [];

  function onChoiceChange(value: string) {
    if (!onSelect) return;
    const [group, slug] = value.split(":");
    if (group !== "visa" && group !== "license") return;
    const choice = allChoices.find((item) => item.group === group && item.slug === slug);
    if (!choice) return;
    onSelect({ group: choice.group, slug: choice.slug, label: choice.name });
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!desk) return;
    setFormError(null);
    try {
      await createInquiry({
        name: values.name,
        email: values.email,
        phone: values.phone.trim(),
        message: joinMessage(intakeNote, values.message),
        companyUrl: values.companyUrl?.trim() ? values.companyUrl.trim() : undefined,
        group: desk.group,
        desk: desk.slug,
      });
      if (onSent) {
        onSent();
        return;
      }
      setSent(true);
    } catch {
      setFormError(t("error"));
    }
  }

  if (sent) {
    return (
      <div role="status">
        <p className="font-heading text-base font-medium text-foreground">{t("successTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-foreground/70">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form className="relative space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor={`${idPrefix}-company-url`}>Company</label>
        <input id={`${idPrefix}-company-url`} tabIndex={-1} autoComplete="off" {...form.register("companyUrl")} />
      </div>
      {choices ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-need`}>
            <RequiredLabel>{t("needLabel")}</RequiredLabel>
          </Label>
          <select
            id={`${idPrefix}-need`}
            className={selectClassName}
            value={selected ? choiceValue(selected.group, selected.slug) : ""}
            onChange={(event) => onChoiceChange(event.target.value)}
            required
            aria-invalid={!desk || undefined}
          >
            <option value="" disabled>
              {t("chooseDesk")}
            </option>
            <optgroup label={t("visa")}>
              {choices.visa.map((item) => (
                <option key={choiceValue(item.group, item.slug)} value={choiceValue(item.group, item.slug)}>
                  {item.name}
                </option>
              ))}
            </optgroup>
            <optgroup label={t("license")}>
              {choices.license.map((item) => (
                <option key={choiceValue(item.group, item.slug)} value={choiceValue(item.group, item.slug)}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      ) : hideDeskLabel ? null : (
        <p className="font-heading text-sm font-medium tracking-tight text-pretty">
          {selected && desk ? selected.label : t("chooseDesk")}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>
          <RequiredLabel>{t("name")}</RequiredLabel>
        </Label>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="name"
          className="rounded-none"
          aria-invalid={Boolean(form.formState.errors.name) || undefined}
          {...form.register("name")}
        />
        {form.formState.errors.name ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-email`}>
          <RequiredLabel>{t("email")}</RequiredLabel>
        </Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          className="rounded-none"
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
        <Label htmlFor={`${idPrefix}-phone`}>
          <RequiredLabel>{t("phone")}</RequiredLabel>
        </Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          className="rounded-none"
          aria-invalid={Boolean(form.formState.errors.phone) || undefined}
          {...form.register("phone")}
        />
        {form.formState.errors.phone ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.phone.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-message`}>{t("message")}</Label>
        <Textarea id={`${idPrefix}-message`} rows={4} className="rounded-none" {...form.register("message")} />
      </div>
      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:opacity-100"
        disabled={form.formState.isSubmitting || !desk}
      >
        {form.formState.isSubmitting ? t("pending") : t("submit")}
      </button>
    </form>
  );
}
