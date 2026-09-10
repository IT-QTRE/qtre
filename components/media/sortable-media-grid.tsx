"use client";

import { useEffect, useRef, type ReactNode, type DragEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

export function MediaSortContext({
  items,
  onReorder,
  children,
}: {
  items: string[];
  onReorder: (fromId: string, toId: string) => void;
  children: ReactNode;
}) {
  // Distance keeps ordinary clicks (Remove) from becoming a drag. PointerSensor
  // plus touch-none on the handle is what actually starts a drag on mouse,
  // trackpad, and touch — MouseSensor alone misses pointer-event browsers.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function SortableMediaItem({
  id,
  isCover,
  portrait,
  onDelete,
  children,
}: {
  id: string;
  isCover: boolean;
  portrait: boolean;
  onDelete: () => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border",
        portrait ? "aspect-3/4" : "aspect-square",
        isDragging && "z-10 opacity-80 shadow-sm",
      )}
    >
      {/* Listeners stay on this layer so Remove still gets clicks. Native image
          drag (the browser ghost of a CDN photo) is killed here — otherwise
          PointerSensor never activates and cover reorder looks broken. */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab touch-none select-none [-webkit-user-drag:none] active:cursor-grabbing"
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="pointer-events-none relative h-full w-full">{children}</div>
      </div>
      {isCover ? (
        <span className="pointer-events-none absolute bottom-1 left-1 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
          Cover
        </span>
      ) : null}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        className="absolute right-1 top-1 z-10 rounded-full bg-background/90 px-2.5 py-1.5 text-xs shadow-sm"
      >
        Remove
      </button>
    </li>
  );
}

export function MediaFileDrop({
  onFiles,
  children,
}: {
  onFiles: (files: FileList) => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onFilesRef = useRef(onFiles);
  onFilesRef.current = onFiles;

  // Dropping files on the surrounding <form> otherwise navigates the tab to
  // the image. Capture those drops so adding photos doesn't depend on hitting
  // the dashed box exactly.
  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;

    function hasFiles(event: globalThis.DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function onDragOver(event: globalThis.DragEvent) {
      if (!hasFiles(event)) return;
      event.preventDefault();
    }

    function onDrop(event: globalThis.DragEvent) {
      if (!event.dataTransfer?.files.length) return;
      event.preventDefault();
      onFilesRef.current(event.dataTransfer.files);
    }

    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, []);

  function acceptDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
  }

  return (
    <div
      ref={rootRef}
      className="space-y-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={acceptDrop}
    >
      {children}
    </div>
  );
}
