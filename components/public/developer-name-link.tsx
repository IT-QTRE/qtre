"use client";

import Image from "next/image";
import { DirectoryWipeLink } from "@/components/public/directory-wipe-link";
import { cn } from "@/lib/utils";

export type DeveloperRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  href: string;
};

export function DeveloperNameLink({
  developer,
  scale = "roster",
}: {
  developer: DeveloperRow;
  scale?: "roster" | "directory";
}) {
  return (
    <DirectoryWipeLink
      href={developer.href}
      name={developer.name}
      scale={scale}
      leading={
        developer.imageUrl ? (
          <Image
            src={developer.imageUrl}
            alt=""
            width={120}
            height={40}
            className={cn(
              "relative z-10 me-[0.4em] h-[0.7em] w-auto shrink-0 object-contain",
              scale === "directory" ? "max-w-20 sm:max-w-24" : "max-w-16 sm:max-w-20",
            )}
          />
        ) : null
      }
    />
  );
}
