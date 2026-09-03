"use client";

import { useEffect, useState } from "react";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export type ProjectJumpLink = { id: string; label: string };

export function ProjectJump({ label, links }: { label: string; links: ProjectJumpLink[] }) {
  const [active, setActive] = useState(links[0]?.id ?? "");
  const ids = links.map((link) => link.id).join(",");

  useEffect(() => {
    const nodes = ids
      .split(",")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node != null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => b.intersectionRatio - a.intersectionRatio);
        const next = visible[0]?.target.id;
        if (next) setActive(next);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0, 0.2, 0.45, 0.7] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [ids]);

  function go(id: string) {
    const node = document.getElementById(id);
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setActive(id);
  }

  if (links.length < 2) return null;

  return (
    <div className={cn("border-b border-border", publicGutter)}>
      <nav aria-label={label}>
        <ul className="flex gap-1 overflow-x-auto scrollbar-none">
          {links.map((link) => {
            const isActive = active === link.id;
            return (
              <li key={link.id} className="shrink-0">
                <a
                  href={`#${link.id}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    go(link.id);
                  }}
                  className={cn(
                    "inline-flex min-h-11 items-center border-b-2 px-3 font-heading text-sm font-medium touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4",
                    isActive
                      ? "border-secondary text-primary"
                      : "border-transparent text-foreground/70 hover:text-foreground",
                  )}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
