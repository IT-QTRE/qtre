"use client";

import dynamic from "next/dynamic";

export const PublicListingMap = dynamic(
  () => import("./listing-map").then((mod) => mod.ListingMap),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-[#e8e4de] sm:h-80" aria-hidden />,
  },
);
