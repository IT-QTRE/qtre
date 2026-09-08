"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Award,
  ArrowRight,
  Briefcase,
  Check,
  Home,
  Landmark,
  Minus,
  Monitor,
  Palette,
  Pause,
  Plus,
  Receipt,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  detailsReady,
  emptyIntakeDetails,
  formatIntakeNote,
  type IntakeDetails,
} from "@/lib/service-intake";
import type { ServiceGroup } from "@/lib/service-desks";
import { cn } from "@/lib/utils";
import { ServiceInquiryForm, type InquiryDesk } from "@/components/public/service-inquiry-form";

export type IntakeDeskItem = {
  name: string;
  types?: string;
  href: string;
  group: ServiceGroup;
  slug: string;
};

const TOTAL = 3;
const COUNT_MIN = 1;
const COUNT_MAX = 20;

const DESK_ICON: Record<string, LucideIcon> = {
  residence: Home,
  dependent: Users,
  "remote-work": Monitor,
  golden: Award,
  freelance: Palette,
  renewal: Receipt,
  modification: Briefcase,
  cancellation: Landmark,
  freezing: Pause,
};

type Choice = { id: string; titleKey: string; hintKey?: string };

const RESIDENCE_PATHS: Choice[] = [
  { id: "employment", titleKey: "optEmployment", hintKey: "optEmploymentHint" },
  { id: "investor", titleKey: "optInvestor", hintKey: "optInvestorHint" },
  { id: "family", titleKey: "optFamily", hintKey: "optFamilyHint" },
  { id: "domestic", titleKey: "optDomestic" },
  { id: "specialist", titleKey: "optSpecialist" },
  { id: "student", titleKey: "optStudent" },
];

const DEPENDENT_WHO: Choice[] = [
  { id: "spouse", titleKey: "optSpouse" },
  { id: "children", titleKey: "optChildren" },
  { id: "parents", titleKey: "optParents" },
  { id: "parentsInLaw", titleKey: "optParentsInLaw" },
];

const GOLDEN_PATHS: Choice[] = [
  { id: "property", titleKey: "optProperty", hintKey: "optPropertyHint" },
  { id: "entrepreneur", titleKey: "optEntrepreneur" },
  { id: "talent", titleKey: "optTalent" },
  { id: "other", titleKey: "optOther" },
];

const FREELANCE_FIELDS: Choice[] = [
  { id: "media", titleKey: "optMedia" },
  { id: "tech", titleKey: "optTech" },
  { id: "education", titleKey: "optEducation" },
  { id: "design", titleKey: "optDesign" },
];

const ZONES: Choice[] = [
  { id: "mainland", titleKey: "optMainland" },
  { id: "freezone", titleKey: "optFreezone" },
];

const MODIFY_FIELDS: Choice[] = [
  { id: "name", titleKey: "optName" },
  { id: "activity", titleKey: "optActivity" },
  { id: "address", titleKey: "optAddress" },
  { id: "sponsor", titleKey: "optSponsor" },
  { id: "management", titleKey: "optManagement" },
  { id: "partners", titleKey: "optPartners" },
  { id: "capital", titleKey: "optCapital" },
];

const YES_NO: Choice[] = [
  { id: "yes", titleKey: "yes" },
  { id: "no", titleKey: "no" },
];

const FREEZE: Choice[] = [
  { id: "freezeYear", titleKey: "optFreezeYear" },
  { id: "freezeThree", titleKey: "optFreezeThree" },
];

function StageProgress({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={cn("h-0.5 flex-1", index < current ? "bg-primary" : "bg-foreground/10")}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-heading text-xs tabular-nums text-foreground/50">
          {current}/{total}
        </span>
        <span className="font-heading text-xs font-medium tracking-[0.14em] text-foreground/50 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

function OptionButton({
  selected,
  onSelect,
  icon: Icon,
  title,
  hint,
  trailing,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: LucideIcon;
  title: string;
  hint?: string;
  trailing?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full min-h-14 cursor-pointer items-center gap-3 border px-3 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-secondary bg-background" : "border-foreground/10 hover:border-foreground/25",
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center border",
            selected ? "border-secondary text-secondary" : "border-foreground/15 text-foreground/55",
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-semibold tracking-tight text-foreground">{title}</span>
        {hint ? <span className="mt-0.5 block text-xs leading-relaxed text-foreground/60">{hint}</span> : null}
      </span>
      {selected ? (
        <Check className="size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
      ) : (
        trailing
      )}
    </button>
  );
}

function CountField({
  id,
  label,
  value,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-4 border border-foreground/10 px-4 py-3">
      <label htmlFor={id} className="font-heading text-sm font-medium tracking-tight text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex size-9 items-center justify-center border border-foreground/15 text-foreground hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          aria-label={decreaseLabel}
          disabled={value <= COUNT_MIN}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <input
          id={id}
          readOnly
          value={value}
          className="w-10 bg-transparent text-center font-heading text-sm tabular-nums outline-none"
        />
        <button
          type="button"
          className="flex size-9 items-center justify-center border border-foreground/15 text-foreground hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
          aria-label={increaseLabel}
          disabled={value >= COUNT_MAX}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function ChoiceList({
  legend,
  choices,
  selected,
  onSelect,
  t,
}: {
  legend: string;
  choices: Choice[];
  selected?: string;
  onSelect: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <fieldset>
      <legend className="font-heading text-sm font-medium tracking-tight text-foreground">{legend}</legend>
      <ul className="mt-3 space-y-2">
        {choices.map((choice) => (
          <li key={choice.id}>
            <OptionButton
              selected={selected === choice.id}
              onSelect={() => onSelect(choice.id)}
              title={t(choice.titleKey)}
              hint={choice.hintKey ? t(choice.hintKey) : undefined}
            />
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function selectionFromItem(item: IntakeDeskItem): InquiryDesk {
  return { group: item.group, slug: item.slug, label: item.name };
}

export function ServiceIntakeWizard({
  group,
  items,
  idPrefix,
  locked = false,
}: {
  group: ServiceGroup;
  items: IntakeDeskItem[];
  idPrefix: string;
  locked?: boolean;
}) {
  const t = useTranslations("serviceInquiry");
  const countId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const first = items[0];
  const [step, setStep] = useState(locked ? 1 : 0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<InquiryDesk | null>(() =>
    locked && first ? selectionFromItem(first) : null,
  );
  const [details, setDetails] = useState<IntakeDetails>(emptyIntakeDetails);
  const minStep = locked ? 1 : 0;
  const focusKey = useRef({ step, done });

  useEffect(() => {
    const previous = focusKey.current;
    const changed = previous.step !== step || previous.done !== done;
    focusKey.current = { step, done };
    if (!changed) return;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  const stageLabel =
    step === 0 ? (group === "visa" ? t("stageType") : t("stageAction")) : step === 1 ? t("stageFacts") : t("stageContact");

  function selectDesk(item: IntakeDeskItem) {
    if (selected?.group === item.group && selected.slug === item.slug) return;
    setSelected({ group: item.group, slug: item.slug, label: item.name });
    setDetails(emptyIntakeDetails());
  }

  function patchDetails(patch: Partial<IntakeDetails>) {
    setDetails((current) => ({ ...current, ...patch }));
  }

  function toggleExtra(id: string) {
    setDetails((current) => {
      const extras = current.extras ?? [];
      return {
        ...current,
        extras: extras.includes(id) ? extras.filter((item) => item !== id) : [...extras, id],
      };
    });
  }

  const canContinue =
    step === 0 ? Boolean(selected) : step === 1 ? Boolean(selected && detailsReady(selected.slug, details)) : false;

  const question =
    step === 0
      ? group === "visa"
        ? t("visaQuestion")
        : t("licenseQuestion")
      : step === 1
        ? t("factsQuestion")
        : t("contactQuestion");
  const hint =
    step === 0
      ? group === "visa"
        ? t("visaQuestionHint")
        : t("licenseQuestionHint")
      : step === 1
        ? t("factsHint")
        : t("contactHint");

  if (done) {
    return (
      <div className="bg-background px-5 py-7 text-foreground shadow-[2px_3px_12px_rgba(31,31,31,0.06)] sm:px-7 sm:py-9">
        <StageProgress current={TOTAL} total={TOTAL} label={t("stageContact")} />
        <div className="mt-8" role="status">
          <h3 ref={headingRef} tabIndex={-1} className="font-heading text-xl font-semibold tracking-tight text-foreground outline-none">
            {t("successTitle")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-pretty text-foreground/70">{t("successBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-5 py-7 text-foreground shadow-[2px_3px_12px_rgba(31,31,31,0.06)] sm:px-7 sm:py-9">
      <StageProgress current={step + 1} total={TOTAL} label={stageLabel} />
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 font-heading text-xl font-semibold tracking-tight text-balance text-foreground outline-none sm:text-2xl"
      >
        {question}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-foreground/60">{hint}</p>

      <div className="mt-6">
        {step === 0 ? (
          <ul className="max-h-[min(22rem,50vh)] space-y-2 overflow-y-auto pe-1">
            {items.map((item) => {
              const Icon = DESK_ICON[item.slug];
              const active = selected?.slug === item.slug;
              return (
                <li
                  key={item.href}
                  className={cn(
                    "flex items-stretch border",
                    active ? "border-secondary bg-background" : "border-foreground/10",
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectDesk(item)}
                    className="flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Icon ? (
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center border",
                          active ? "border-secondary text-secondary" : "border-foreground/15 text-foreground/55",
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-sm font-semibold tracking-tight">{item.name}</span>
                      {item.types ? (
                        <span className="mt-0.5 block text-xs leading-relaxed text-foreground/60">{item.types}</span>
                      ) : null}
                    </span>
                    {active ? <Check className="size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden /> : null}
                  </button>
                  <Link
                    href={item.href}
                    className="flex shrink-0 items-center border-s border-foreground/10 px-3 font-heading text-[0.65rem] font-medium tracking-[0.12em] text-secondary uppercase hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("dossier")}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {step === 1 && selected ? (
          <div className="max-h-[min(22rem,50vh)] space-y-6 overflow-y-auto pe-1">
            {selected.slug === "residence" ? (
              <>
                <ChoiceList
                  legend={t("residencePath")}
                  choices={RESIDENCE_PATHS}
                  selected={details.choice}
                  onSelect={(id) => patchDetails({ choice: id })}
                  t={t}
                />
                {details.choice === "family" ? (
                  <CountField
                    id={`${countId}-people`}
                    label={t("peopleCount")}
                    value={details.count ?? 1}
                    onChange={(count) => patchDetails({ count })}
                    decreaseLabel={t("decrease")}
                    increaseLabel={t("increase")}
                  />
                ) : null}
              </>
            ) : null}

            {selected.slug === "dependent" ? (
              <>
                <ChoiceList
                  legend={t("dependentWho")}
                  choices={DEPENDENT_WHO}
                  selected={details.choice}
                  onSelect={(id) => patchDetails({ choice: id })}
                  t={t}
                />
                <CountField
                  id={`${countId}-people`}
                  label={t("peopleCount")}
                  value={details.count ?? 1}
                  onChange={(count) => patchDetails({ count })}
                  decreaseLabel={t("decrease")}
                  increaseLabel={t("increase")}
                />
              </>
            ) : null}

            {selected.slug === "remote-work" ? (
              <div className="space-y-6">
                <ChoiceList
                  legend={t("remoteInUae")}
                  choices={YES_NO}
                  selected={details.remoteInUae}
                  onSelect={(id) => patchDetails({ remoteInUae: id as "yes" | "no" })}
                  t={t}
                />
                <ChoiceList
                  legend={t("remoteFamily")}
                  choices={YES_NO}
                  selected={details.remoteFamily}
                  onSelect={(id) => patchDetails({ remoteFamily: id as "yes" | "no" })}
                  t={t}
                />
              </div>
            ) : null}

            {selected.slug === "golden" ? (
              <ChoiceList
                legend={t("goldenPath")}
                choices={GOLDEN_PATHS}
                selected={details.choice}
                onSelect={(id) => patchDetails({ choice: id })}
                t={t}
              />
            ) : null}

            {selected.slug === "freelance" ? (
              <ChoiceList
                legend={t("freelanceField")}
                choices={FREELANCE_FIELDS}
                selected={details.choice}
                onSelect={(id) => patchDetails({ choice: id })}
                t={t}
              />
            ) : null}

            {selected.slug === "renewal" ? (
              <>
                <ChoiceList
                  legend={t("licenseZone")}
                  choices={ZONES}
                  selected={details.choice}
                  onSelect={(id) => patchDetails({ choice: id })}
                  t={t}
                />
                <CountField
                  id={`${countId}-visas`}
                  label={t("visaCount")}
                  value={details.count ?? 1}
                  onChange={(count) => patchDetails({ count })}
                  decreaseLabel={t("decrease")}
                  increaseLabel={t("increase")}
                />
              </>
            ) : null}

            {selected.slug === "modification" ? (
              <fieldset>
                <legend className="font-heading text-sm font-medium tracking-tight text-foreground">{t("modifyWhat")}</legend>
                <ul className="mt-3 space-y-2">
                  {MODIFY_FIELDS.map((choice) => (
                    <li key={choice.id}>
                      <OptionButton
                        selected={Boolean(details.extras?.includes(choice.id))}
                        onSelect={() => toggleExtra(choice.id)}
                        title={t(choice.titleKey)}
                      />
                    </li>
                  ))}
                </ul>
              </fieldset>
            ) : null}

            {selected.slug === "cancellation" ? (
              <>
                <ChoiceList
                  legend={t("cancelActive")}
                  choices={YES_NO}
                  selected={details.choice}
                  onSelect={(id) => patchDetails({ choice: id })}
                  t={t}
                />
                {details.choice === "yes" ? (
                  <CountField
                    id={`${countId}-cancel`}
                    label={t("cancelCount")}
                    value={details.count ?? 1}
                    onChange={(count) => patchDetails({ count })}
                    decreaseLabel={t("decrease")}
                    increaseLabel={t("increase")}
                  />
                ) : null}
              </>
            ) : null}

            {selected.slug === "freezing" ? (
              <ChoiceList
                legend={t("freezeHowLong")}
                choices={FREEZE}
                selected={details.choice}
                onSelect={(id) => patchDetails({ choice: id })}
                t={t}
              />
            ) : null}
          </div>
        ) : null}

        {step === 2 && selected ? (
          <ServiceInquiryForm
            selected={selected}
            idPrefix={idPrefix}
            hideDeskLabel
            intakeNote={formatIntakeNote(selected.group, selected.slug, details)}
            onSent={() => setDone(true)}
          />
        ) : null}
      </div>

      {step < 2 ? (
        <div className="mt-6 space-y-3">
          {step > minStep ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(minStep, current - 1))}
              className="font-heading text-sm text-foreground/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("back")}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((current) => current + 1)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary-foreground uppercase transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-foreground/15 disabled:text-foreground/40 disabled:opacity-100"
          >
            {t("continue")}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="mt-4 font-heading text-sm text-foreground/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("back")}
        </button>
      )}
    </div>
  );
}
