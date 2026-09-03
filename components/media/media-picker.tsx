"use client";

import { useRef, useState } from "react";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import { MEDIA_ACCESS_CONFIG } from "@/convex/lib/mediaAccessConfig";
import { usesPortraitCrop } from "@/lib/media/portraitCrop";
import { PortraitCropDialog } from "./portrait-crop-dialog";

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
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const portrait = usesPortraitCrop(entityType);

  function addFiles(files: FileList | File[]) {
    const additions = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...value, ...additions]);
  }

  function handleFiles(files: FileList) {
    if (portrait) {
      setCropQueue((current) => [...current, ...Array.from(files).filter((file) => file.type.startsWith("image/"))]);
      return;
    }
    addFiles(files);
  }

  function confirmCrop(cropped: File) {
    addFiles([cropped]);
    setCropQueue((current) => current.slice(1));
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
          if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files);
        }}
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground"
        onClick={() => fileInputRef.current?.click()}
      >
        {portrait ? "Drop a portrait or click to add" : "Drop photos here or click to add"}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.allowedContentTypes.join(",")}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {portrait ? (
        <p className="text-xs text-muted-foreground">
          You'll frame a 3:4 portrait next — keep the head at the top, head to shoulders or chest.
        </p>
      ) : null}
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((item, index) => (
            <li
              key={item.id}
              className={
                portrait
                  ? "relative aspect-3/4 overflow-hidden rounded-lg border border-border"
                  : "relative aspect-square overflow-hidden rounded-lg border border-border"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- local object-URL preview of a not-yet-uploaded file, not a next/image-optimizable remote asset */}
              <img
                src={item.previewUrl}
                alt=""
                className={portrait ? "h-full w-full object-cover object-top" : "h-full w-full object-cover"}
              />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="absolute right-1 top-1 z-10 rounded-full bg-background/90 px-2.5 py-1.5 text-xs shadow-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <PortraitCropDialog
        file={cropQueue[0] ?? null}
        remainingCount={Math.max(0, cropQueue.length - 1)}
        onConfirm={confirmCrop}
        onSkip={() => setCropQueue((current) => current.slice(1))}
      />
    </div>
  );
}
