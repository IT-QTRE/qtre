import Image from "next/image";
import Link from "next/link";

export function AdminBrand({ href = "/admin" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center px-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src="/brand/qtre-lockup.png"
        alt="QuickTalk Real Estate"
        width={727}
        height={235}
        className="h-10 w-auto max-w-full object-contain"
        priority
      />
    </Link>
  );
}
