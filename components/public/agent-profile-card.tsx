import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { telHref } from "@/components/public/profile-contact";

export type AgentRow = {
  id: string;
  name: string;
  position: string | null;
  imageUrl: string | null;
  href: string;
  email: string;
  phone: string | null;
};

export function AgentProfileCard({
  agent,
  firmName,
  emailLabel,
  phoneLabel,
  viewLabel,
  eager = false,
}: {
  agent: AgentRow;
  firmName: string;
  emailLabel: string;
  phoneLabel: string;
  viewLabel: string;
  eager?: boolean;
}) {
  const email = agent.email.trim();
  const phoneHref = agent.phone ? telHref(agent.phone) : null;

  return (
    <article className="group relative flex overflow-hidden border border-secondary bg-card transition-[box-shadow] duration-300 ease-out motion-reduce:transition-none hover:shadow-[0_12px_32px_color-mix(in_oklab,var(--foreground)_16%,transparent)]">
      <span className="pointer-events-none relative w-28 shrink-0 self-stretch overflow-hidden bg-accent sm:w-36 lg:w-40">
        {agent.imageUrl ? (
          <Image
            src={agent.imageUrl}
            alt=""
            fill
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes="(min-width: 1024px) 10rem, (min-width: 640px) 9rem, 7rem"
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
          />
        ) : null}
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={agent.href}
            className="min-h-11 min-w-0 touch-manipulation before:absolute before:inset-0 before:z-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h2 className="relative font-heading text-lg font-semibold tracking-tight text-balance text-primary sm:text-xl">
              {agent.name}
            </h2>
            {agent.position ? (
              <p className="relative mt-1.5 text-sm text-pretty text-foreground/70">{agent.position}</p>
            ) : null}
            <span aria-hidden className="relative mt-4 block h-px w-10 bg-secondary" />
            <p className="relative mt-3 text-sm text-pretty text-foreground/80">{firmName}</p>
          </Link>
          <Image
            src="/brand/qtre-no-bg.png"
            alt=""
            width={820}
            height={304}
            className="pointer-events-none relative z-0 mt-0.5 h-7 w-auto shrink-0 object-contain sm:h-8"
            sizes="4rem"
          />
        </div>

        {(email || (agent.phone && phoneHref)) ? (
          <dl className="space-y-3 pe-14">
            {email ? (
              <div>
                <dt className="text-[0.7rem] tracking-[0.16em] text-foreground/70">{emailLabel}</dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${email}`}
                    className="relative z-10 block truncate font-heading text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {email}
                  </a>
                </dd>
              </div>
            ) : null}
            {agent.phone && phoneHref ? (
              <div>
                <dt className="text-[0.7rem] tracking-[0.16em] text-foreground/70">{phoneLabel}</dt>
                <dd className="mt-1">
                  <a
                    href={phoneHref}
                    className="relative z-10 block truncate font-heading text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {agent.phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-e-5 bottom-5 bg-primary px-2 py-1 font-heading text-[0.65rem] font-medium tracking-[0.16em] text-primary-foreground opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none sm:inset-e-6 sm:bottom-6 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"
      >
        {viewLabel}
      </span>
    </article>
  );
}
