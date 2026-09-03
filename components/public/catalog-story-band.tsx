import { Link } from "@/i18n/navigation";
import { PRIMARY_NAV } from "@/lib/public-nav";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

type StoryCopy = {
  title: string;
  body: string;
  buy: string;
  buyBody: string;
  rent: string;
  rentBody: string;
  offplan: string;
  offplanBody: string;
};

function columnCopy(copy: StoryCopy, key: (typeof PRIMARY_NAV)[number]["key"]) {
  if (key === "buy") return { heading: copy.buy, body: copy.buyBody };
  if (key === "rent") return { heading: copy.rent, body: copy.rentBody };
  return { heading: copy.offplan, body: copy.offplanBody };
}

export function CatalogStoryBand({ copy }: { copy: StoryCopy }) {
  return (
    <section className="relative bg-muted text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-20 sm:py-28", publicGutter)}>
        <h2 className="max-w-[14ch] font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {copy.title}
        </h2>
        <div className="mt-7 h-px w-24 bg-secondary" />
        <p className="mt-8 max-w-prose text-base leading-relaxed text-pretty sm:text-lg">{copy.body}</p>
        <div className="mt-16 h-px w-full max-w-prose bg-secondary/50 sm:mt-20" />
        <ul className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-10 lg:mt-14 lg:gap-16">
          {PRIMARY_NAV.map((item) => {
            const col = columnCopy(copy, item.key);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <h3 className="font-heading text-xl font-semibold tracking-tight transition-colors duration-200 ease-out group-hover:text-primary motion-reduce:transition-none">
                    {col.heading}
                  </h3>
                  <div className="mt-4 h-px w-10 bg-secondary transition-[width] duration-300 ease-out group-hover:w-16 motion-reduce:transition-none" />
                  <p className="mt-5 max-w-prose text-sm leading-relaxed text-pretty text-foreground/80 sm:text-[0.95rem]">
                    {col.body}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
