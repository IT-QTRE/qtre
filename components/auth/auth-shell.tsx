export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col justify-center bg-primary px-8 py-10 text-primary-foreground md:w-[42%] md:justify-end md:px-12 md:py-16">
        <p className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          Quick Talk
          <span className="mt-1 block font-medium">Real Estate</span>
        </p>
        <div className="mt-6 h-px w-12 bg-secondary" />
        <p className="mt-6 max-w-[16ch] font-heading text-xl font-medium leading-snug text-pretty md:text-2xl">
          Bridging Opportunities. Building Futures.
        </p>
      </aside>
      <main className="flex flex-1 items-center justify-center bg-muted p-6 md:p-10">{children}</main>
    </div>
  );
}
