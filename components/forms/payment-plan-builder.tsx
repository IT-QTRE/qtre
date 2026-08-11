"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_PLAN_PRESETS, type PaymentPlanMilestone } from "@/lib/constants/payment-plans";

// Loading a preset replaces the milestone list outright — the admin can
// then freely edit labels/percentages/notes or add/remove rows to turn any
// preset into something fully custom, same "seed then edit" idea as
// `AmenityPicker`'s curated pills. Percentages aren't forced to sum to 100
// (a plan can legitimately be filled in gradually while drafting), but the
// running total is surfaced so an incomplete or over-allocated plan is
// obvious before publishing.
export function PaymentPlanBuilder({
  value,
  onChange,
}: {
  value: PaymentPlanMilestone[];
  onChange: (next: PaymentPlanMilestone[]) => void;
}) {
  const [presetKey, setPresetKey] = useState("");
  const total = value.reduce((sum, milestone) => sum + (Number.isFinite(milestone.percentage) ? milestone.percentage : 0), 0);

  function applyPreset(key: string | null) {
    if (!key) return;
    setPresetKey(key);
    const preset = PAYMENT_PLAN_PRESETS.find((item) => item.key === key);
    if (preset) {
      onChange(preset.milestones.map((milestone) => ({ ...milestone })));
    }
  }

  function updateMilestone(index: number, patch: Partial<PaymentPlanMilestone>) {
    onChange(value.map((milestone, i) => (i === index ? { ...milestone, ...patch } : milestone)));
  }

  function removeMilestone(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addMilestone() {
    onChange([...value, { label: "", percentage: 0 }]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={presetKey} onValueChange={applyPreset}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Load a recommended plan…" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_PLAN_PRESETS.map((preset) => (
              <SelectItem key={preset.key} value={preset.key}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value.length > 0 && (
          <Badge variant={total === 100 ? "secondary" : "destructive"}>{total}% allocated</Badge>
        )}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((milestone, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_6rem_1fr_auto] sm:items-center">
              <Input
                value={milestone.label}
                onChange={(event) => updateMilestone(index, { label: event.target.value })}
                placeholder="e.g. Down Payment"
                aria-label="Milestone label"
              />
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={milestone.percentage}
                  onChange={(event) => updateMilestone(index, { percentage: Number(event.target.value) })}
                  className="pr-6"
                  aria-label="Milestone percentage"
                />
                <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground">
                  %
                </span>
              </div>
              <Input
                value={milestone.note ?? ""}
                onChange={(event) => updateMilestone(index, { note: event.target.value })}
                placeholder="Note (optional)"
                aria-label="Milestone note"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeMilestone(index)}
                aria-label="Remove milestone"
                className="justify-self-start text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
        <Plus className="size-4" />
        Add Milestone
      </Button>
    </div>
  );
}
