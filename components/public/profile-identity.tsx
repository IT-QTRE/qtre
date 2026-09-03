import Image from "next/image";

export function ProfileIdentity({
  title,
  imageUrl,
  imageAlt,
  tone = "logo",
}: {
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
  tone?: "logo" | "photo";
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
      {imageUrl ? (
        tone === "photo" ? (
          <div className="relative size-28 shrink-0 overflow-hidden bg-accent sm:size-32">
            <Image src={imageUrl} alt={imageAlt ?? title} fill className="object-cover" sizes="128px" />
          </div>
        ) : (
          <div className="relative h-14 w-40 shrink-0 sm:h-16">
            <Image src={imageUrl} alt="" fill className="object-contain object-left" sizes="160px" />
          </div>
        )
      ) : null}
      <h1 className="min-w-0 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
        {title}
      </h1>
    </header>
  );
}
