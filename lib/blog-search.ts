export type BlogSearch = {
  q?: string;
  topic?: string;
};

export function blogSearchFromParams(search: { q?: string; topic?: string }): BlogSearch {
  const q = search.q?.trim();
  const topic = search.topic?.trim();
  return {
    ...(q ? { q } : {}),
    ...(topic ? { topic } : {}),
  };
}

export function blogHasFilters(search: BlogSearch) {
  return Boolean(search.q || search.topic);
}

export function blogSearchHref(search: BlogSearch = {}) {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.topic) params.set("topic", search.topic);
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export function blogQueryArgs(search: BlogSearch) {
  return {
    ...(search.q ? { q: search.q } : {}),
    ...(search.topic ? { topic: search.topic } : {}),
  };
}
