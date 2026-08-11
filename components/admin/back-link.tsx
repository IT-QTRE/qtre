import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sits above the title on every admin edit page — these pages are only ever
// reached from their list page, but browser back isn't reliable after a
// save (the form's `values` prop reinitializes, not a navigation), so a
// dedicated link back to the list is worth the vertical space.
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3" nativeButton={false} render={<Link href={href} />}>
      <ArrowLeft className="size-4" />
      {label}
    </Button>
  );
}
