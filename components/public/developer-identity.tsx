import Image from "next/image";

export function DeveloperIdentity({
  title,
  imageUrl,
  imageAlt,
}: {
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  return (
    <div>
      {imageUrl ? (
        <div className="mb-8 flex h-20 w-fit min-w-44 max-w-60 items-center justify-center bg-background px-5 sm:h-24 sm:max-w-72 sm:px-6">
          <Image
            src={imageUrl}
            alt={imageAlt ?? ""}
            width={240}
            height={80}
            className="h-12 w-auto max-w-full object-contain sm:h-14"
            priority
          />
        </div>
      ) : null}
      <h1 className="max-w-[14ch] font-heading text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
        {title}
      </h1>
      <div className="mt-8 h-px w-28 bg-secondary sm:mt-10 sm:w-32" />
    </div>
  );
}
