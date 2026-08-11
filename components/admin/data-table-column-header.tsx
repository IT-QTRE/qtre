import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Structural type instead of importing `@tanstack/react-table`'s `Column`
// generic directly — v9's `Column<TFeatures, TData, TValue>` type signature
// is awkward to re-derive generically per-entity here, and this header only
// ever touches these two methods regardless of which table it's used in.
type SortableColumn = {
  toggleSorting: (desc?: boolean) => void;
  getIsSorted: () => false | "asc" | "desc";
};

export function DataTableColumnHeader({ column, title }: { column: SortableColumn; title: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {title}
      <ArrowUpDown className="ml-1.5 size-3.5" />
    </Button>
  );
}
