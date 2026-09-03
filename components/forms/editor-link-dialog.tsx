"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { catalogPath } from "@/lib/links/catalog-path";
import { useAuthedQuery } from "@/components/admin/use-authed-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CatalogPick = { href: string; title: string };

export function EditorLinkDialog({
  open,
  onOpenChange,
  initialHref,
  excludePostId,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialHref?: string;
  excludePostId?: string;
  onApply: (href: string, title?: string) => void;
}) {
  const [href, setHref] = useState(initialHref ?? "");
  const [query, setQuery] = useState("");
  const properties = useAuthedQuery(api.properties.list, open ? {} : "skip");
  const projects = useAuthedQuery(api.projects.list, open ? {} : "skip");
  const posts = useAuthedQuery(api.blogPosts.list, open ? {} : "skip");

  useEffect(() => {
    if (!open) return;
    setHref(initialHref ?? "");
    setQuery("");
  }, [initialHref, open]);

  const needle = query.trim().toLowerCase();
  const propertyPicks = useMemo(
    () =>
      (properties ?? [])
        .filter((row) => row.publishing.status === "published")
        .filter((row) => !needle || row.title.en.toLowerCase().includes(needle))
        .map((row) => ({ href: catalogPath("property", row.publishing.slug), title: row.title.en })),
    [needle, properties],
  );
  const projectPicks = useMemo(
    () =>
      (projects ?? [])
        .filter((row) => row.publishing.status === "published")
        .filter((row) => !needle || row.title.en.toLowerCase().includes(needle))
        .map((row) => ({ href: catalogPath("project", row.publishing.slug), title: row.title.en })),
    [needle, projects],
  );
  const postPicks = useMemo(
    () =>
      (posts ?? [])
        .filter((row) => row.publishing.status === "published" && row._id !== excludePostId)
        .filter((row) => !needle || row.title.en.toLowerCase().includes(needle))
        .map((row) => ({ href: catalogPath("blogPost", row.publishing.slug), title: row.title.en })),
    [excludePostId, needle, posts],
  );

  function pick(item: CatalogPick) {
    onApply(item.href, item.title);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Link</DialogTitle>
          <DialogDescription>Paste a URL, or pick a published listing or post.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="editor-link-url">URL</Label>
            <Input
              id="editor-link-url"
              value={href}
              placeholder="/properties/… or https://"
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setHref(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onApply(href.trim());
                  onOpenChange(false);
                }
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="editor-link-search">Pick from catalog</Label>
            <Input
              id="editor-link-search"
              value={query}
              placeholder="Search published properties, projects, posts…"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="max-h-56 space-y-3 overflow-y-auto">
            <PickGroup title="Properties" items={propertyPicks} onPick={pick} />
            <PickGroup title="Projects" items={projectPicks} onPick={pick} />
            <PickGroup title="Posts" items={postPicks} onPick={pick} />
          </div>
        </div>
        <DialogFooter>
          {initialHref ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onApply("");
                onOpenChange(false);
              }}
            >
              Remove link
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => {
              onApply(href.trim());
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PickGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: CatalogPick[];
  onPick: (item: CatalogPick) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="px-1 text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="mt-1">
        {items.map((item) => (
          <li key={item.href}>
            <button
              type="button"
              className="flex w-full rounded-2xl px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => onPick(item)}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
