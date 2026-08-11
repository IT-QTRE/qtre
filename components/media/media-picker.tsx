"use client";

import { useRef } from "react";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";

export type PendingMediaFile = { id: string; file: File; previewUrl: string };

// The Create-page counterpart to `MediaUploader`: used before a record (and
// therefore a real entity ID to attach uploads to) exists yet. Files are
// staged locally as object URLs — nothing touches the network here — and
// handed back to the parent form via `value`/`onChange`. The form uploads
// them with `uploadMediaFile` right after its create mutation returns a
// real id, then the admin lands on the edit page where `MediaUploader`
// takes over for any further changes.
export function MediaPicker({
  entityType,
  value,
  onChange,
}: {
  entityType: MediaEntityType;
  value: PendingMediaFile[];
  onChange: (next: PendingMediaFile[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MEDIA_ACCESS_CONFIG[entityType];

  function addFiles(files: FileList) {
    const additions = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...value, ...additions]);
  }

  function remove(id: string) {
    const target = value.find((item) => item.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
        }}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
      >
        Drop photos here or click to select — they&apos;ll upload once you save.
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedContentTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((item) => (
            <li key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object-URL preview of a not-yet-uploaded file, not a next/image-optimizable remote asset */}
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-1 top-1 z-10 rounded-full bg-background/80 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
