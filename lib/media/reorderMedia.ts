export function moveItemById<T>(
  items: T[],
  fromId: string,
  toId: string,
  getId: (item: T) => string,
): T[] | null {
  if (fromId === toId) return null;
  const from = items.findIndex((item) => getId(item) === fromId);
  const to = items.findIndex((item) => getId(item) === toId);
  if (from < 0 || to < 0) return null;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
