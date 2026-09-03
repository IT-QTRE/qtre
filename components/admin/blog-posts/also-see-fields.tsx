"use client";

import { useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { RELATED_MAX } from "@/lib/validation/blogPosts";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NONE_VALUE = "__none__";
const TYPES = [
  { value: "property", label: "Property" },
  { value: "project", label: "Project" },
  { value: "blogPost", label: "Post" },
] as const;

type RelatedType = (typeof TYPES)[number]["value"];
type RelatedRow = { type: RelatedType; id: string };

function optionLabel(title: string, status: string) {
  return status === "published" ? title : `${title} — ${status}`;
}

function OptionalSelect({
  id,
  value,
  onChange,
  placeholder,
  options,
  loading = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { id: string; label: string }[];
  loading?: boolean;
}) {
  const selectedLabel = value ? options.find((option) => option.id === value)?.label : undefined;
  const display = !value ? placeholder : (selectedLabel ?? (loading ? "Loading…" : placeholder));

  return (
    <Select value={value || NONE_VALUE} onValueChange={(next) => onChange(!next || next === NONE_VALUE ? "" : next)}>
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

export function AlsoSeeFields({ excludePostId }: { excludePostId?: string }) {
  const form = useFormContext<{ related: RelatedRow[] }>();
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "related",
    keyName: "rowId",
  });
  const properties = useAuthedQuery(api.properties.list, {});
  const projects = useAuthedQuery(api.projects.list, {});
  const posts = useAuthedQuery(api.blogPosts.list, {});

  const propertyOptions = useMemo(
    () =>
      (properties ?? []).map((row) => ({
        id: row._id,
        label: optionLabel(row.title.en, row.publishing.status),
      })),
    [properties],
  );
  const projectOptions = useMemo(
    () =>
      (projects ?? []).map((row) => ({
        id: row._id,
        label: optionLabel(row.title.en, row.publishing.status),
      })),
    [projects],
  );
  const postOptions = useMemo(
    () =>
      (posts ?? [])
        .filter((row) => row._id !== excludePostId)
        .map((row) => ({
          id: row._id,
          label: optionLabel(row.title.en, row.publishing.status),
        })),
    [excludePostId, posts],
  );

  const taken = new Set(fields.filter((row) => row.id).map((row) => `${row.type}:${row.id}`));

  function optionsFor(type: RelatedType, currentId: string) {
    const all = type === "property" ? propertyOptions : type === "project" ? projectOptions : postOptions;
    return all.filter((option) => option.id === currentId || !taken.has(`${type}:${option.id}`));
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.rowId} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="sm:w-40">
            <Label htmlFor={`also-see-type-${index}`} className="sr-only">
              Type
            </Label>
            <OptionalSelect
              id={`also-see-type-${index}`}
              value={field.type}
              placeholder="Type"
              options={TYPES.map((item) => ({ id: item.value, label: item.label }))}
              onChange={(next) => {
                const type = (TYPES.find((item) => item.value === next)?.value ?? "property") as RelatedType;
                update(index, { type, id: "" });
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor={`also-see-id-${index}`} className="sr-only">
              Record
            </Label>
            <OptionalSelect
              id={`also-see-id-${index}`}
              value={field.id}
              placeholder={
                field.type === "property" ? "Choose a property" : field.type === "project" ? "Choose a project" : "Choose a post"
              }
              loading={
                field.type === "property"
                  ? properties === undefined
                  : field.type === "project"
                    ? projects === undefined
                    : posts === undefined
              }
              options={optionsFor(field.type, field.id)}
              onChange={(id) => update(index, { type: field.type, id })}
            />
          </div>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => remove(index)}>
            <X />
          </Button>
        </div>
      ))}
      {fields.length < RELATED_MAX ? (
        <Button type="button" variant="outline" size="sm" onClick={() => append({ type: "property", id: "" })}>
          <Plus />
          Add link
        </Button>
      ) : null}
    </div>
  );
}
