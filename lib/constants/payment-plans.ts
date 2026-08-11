// Recommended payment plan templates for the Projects form's payment-plan
// builder. Selecting one seeds the milestone list, which the admin can then
// edit freely or clear out entirely to build something fully custom —
// mirrors how `CURATED_AMENITIES` seeds the amenity picker without locking
// the field to a closed set.
export type PaymentPlanMilestone = {
  label: string;
  percentage: number;
  note?: string;
};

export type PaymentPlanPreset = {
  key: string;
  label: string;
  milestones: PaymentPlanMilestone[];
};

export const PAYMENT_PLAN_PRESETS: PaymentPlanPreset[] = [
  {
    key: "20-80",
    label: "20/80 — On Handover",
    milestones: [
      { label: "Down Payment", percentage: 20 },
      { label: "On Handover", percentage: 80 },
    ],
  },
  {
    key: "30-70",
    label: "30/70 — On Handover",
    milestones: [
      { label: "Down Payment", percentage: 30 },
      { label: "On Handover", percentage: 70 },
    ],
  },
  {
    key: "40-60",
    label: "40/60 — During Construction",
    milestones: [
      { label: "Down Payment", percentage: 10 },
      { label: "During Construction", percentage: 30 },
      { label: "On Handover", percentage: 60 },
    ],
  },
  {
    key: "50-50",
    label: "50/50 — During Construction",
    milestones: [
      { label: "Down Payment", percentage: 10 },
      { label: "During Construction", percentage: 40 },
      { label: "On Handover", percentage: 50 },
    ],
  },
  {
    key: "60-40",
    label: "60/40 — During Construction",
    milestones: [
      { label: "Down Payment", percentage: 20 },
      { label: "During Construction", percentage: 40 },
      { label: "On Handover", percentage: 40 },
    ],
  },
  {
    key: "1-percent-monthly",
    label: "1% Monthly — Post-Handover",
    milestones: [
      { label: "Down Payment", percentage: 20 },
      { label: "During Construction", percentage: 30 },
      { label: "On Handover", percentage: 10 },
      { label: "Post-Handover", percentage: 40, note: "Paid monthly, ~1% over ~40 months" },
    ],
  },
  {
    key: "10-90-post-handover",
    label: "10/90 — Post-Handover",
    milestones: [
      { label: "Down Payment", percentage: 10 },
      { label: "Post-Handover", percentage: 90, note: "Spread over an agreed schedule after handover" },
    ],
  },
];
