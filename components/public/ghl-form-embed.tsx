export function GhlFormEmbed({ src, title }: { src: string; title: string }) {
  return (
    <iframe
      src={src}
      title={title}
      className="min-h-[47rem] w-full bg-background"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
