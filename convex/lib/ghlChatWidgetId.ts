const WIDGET_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function candidateId(value: string) {
  const straight = value.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  const fromAttr = /data-widget-id\s*=\s*["']([a-zA-Z0-9_-]{8,64})["']/i.exec(straight);
  if (fromAttr?.[1]) return fromAttr[1];
  return straight.trim();
}

/** Canonical GHL chat widget ID, or null if it must not be loaded. */
export function safeGhlChatWidgetId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const id = candidateId(trimmed);
  if (!WIDGET_ID_RE.test(id)) return null;
  return id;
}
