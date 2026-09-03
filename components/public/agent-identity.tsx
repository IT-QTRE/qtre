import Image from "next/image";

export function AgentIdentity({
  title,
  position,
  imageUrl,
}: {
  title: string;
  position?: string | null;
  imageUrl?: string | null;
}) {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-10">
      <span className="relative aspect-3/4 w-40 shrink-0 overflow-hidden bg-accent sm:w-52 lg:w-64">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 16rem, (min-width: 640px) 13rem, 10rem"
            loading="eager"
            fetchPriority="high"
          />
        ) : null}
      </span>
      <div className="min-w-0 pb-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance text-primary sm:text-4xl lg:text-5xl lg:leading-[1.08]">
          {title}
        </h1>
        {position ? (
          <p className="mt-3 text-base text-pretty text-foreground/70 sm:mt-4 sm:text-lg">
            {position}
          </p>
        ) : null}
        <div className="mt-5 h-px w-16 bg-secondary sm:mt-6 sm:w-20" />
      </div>
    </div>
  );
}
