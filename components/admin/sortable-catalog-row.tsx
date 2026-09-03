"use client";

import { useCallback, type ReactNode } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function reorderIds<T extends { _id: string }>(items: T[], event: DragEndEvent): T["_id"][] | null {
  const { active, over } = event;
  if (!over || active.id === over.id) return null;
  const oldIndex = items.findIndex((item) => item._id === active.id);
  const newIndex = items.findIndex((item) => item._id === over.id);
  if (oldIndex < 0 || newIndex < 0) return null;
  return arrayMove(items, oldIndex, newIndex).map((item) => item._id);
}

export function SortableCatalogList({
  ids,
  onDragEnd,
  children,
}: {
  ids: string[];
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function SortableCatalogRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 bg-background", isDragging && "relative z-10 shadow-sm")}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label="Drag to reorder"
        className={cn(
          "inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? "cursor-default opacity-30" : "cursor-grab active:cursor-grabbing",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
    </li>
  );
}

export function useCatalogReorder<T extends { _id: string }>(
  items: T[],
  reorder: (args: { orderedIds: T["_id"][] }) => Promise<unknown>,
) {
  return useCallback(
    (event: DragEndEvent) => {
      const orderedIds = reorderIds(items, event);
      if (!orderedIds) return;
      void reorder({ orderedIds });
    },
    [items, reorder],
  );
}
