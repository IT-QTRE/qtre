"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorLinkDialog } from "@/components/forms/editor-link-dialog";
import { linkRelAndTarget } from "@/lib/links/internal-href";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  value: string; // HTML string
  onChange: (html: string) => void;
  dir?: "ltr" | "rtl";
  excludePostId?: string;
};

export function RichTextEditor({ value, onChange, dir, excludePostId }: RichTextEditorProps) {
  // Force a re-render on selection/transaction so toolbar active states stay in sync.
  const [, setToolbarTick] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: {},
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    const refreshToolbar = () => setToolbarTick((tick) => tick + 1);
    editor.on("selectionUpdate", refreshToolbar);
    editor.on("transaction", refreshToolbar);
    return () => {
      editor.off("selectionUpdate", refreshToolbar);
      editor.off("transaction", refreshToolbar);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div
        dir={dir}
        className="min-h-32 rounded-2xl border border-transparent bg-input/50 px-3 py-3 text-sm text-muted-foreground"
      />
    );
  }

  function applyLink(href: string, title?: string) {
    if (!editor) return;
    if (savedSelection) {
      editor.commands.setTextSelection(savedSelection);
    }
    if (href === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const attrs = { href, ...linkRelAndTarget(href, siteUrl) };
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: title || href,
          marks: [{ type: "link", attrs }],
        })
        .run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
  }

  const currentHref = (editor.getAttributes("link").href as string | undefined) ?? "";

  return (
    <div dir={dir} className="overflow-hidden rounded-2xl border border-transparent bg-input/50">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1 py-1">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            setSavedSelection({ from: editor.state.selection.from, to: editor.state.selection.to });
            setLinkOpen(true);
          }}
        >
          <Link2 />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none px-3 py-3 text-base md:text-sm",
          "[&_.tiptap]:min-h-28 [&_.tiptap]:outline-none",
          "[&_.tiptap_p]:my-0 [&_.tiptap_p+p]:mt-2",
        )}
      />
      <EditorLinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        initialHref={currentHref}
        excludePostId={excludePostId}
        onApply={applyLink}
      />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-xs"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
