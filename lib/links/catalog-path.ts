export function catalogPath(type: "property" | "project" | "blogPost", slug: string) {
  if (type === "property") return `/properties/${slug}`;
  if (type === "project") return `/projects/${slug}`;
  return `/blog/${slug}`;
}
