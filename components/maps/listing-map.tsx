"use client";

import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { googleMapsApiKey } from "@/lib/maps/api-key";
import { GOOGLE_MAP_ID, googleMapsDirectionsUrl, type MapCoordinates } from "@/lib/maps/query";

export function ListingMap({
  coordinates,
  placeId,
  caption,
  directionsLabel,
}: {
  coordinates: MapCoordinates;
  placeId?: string | null;
  caption?: string;
  directionsLabel?: string;
}) {
  const apiKey = googleMapsApiKey();
  const directionsHref = directionsLabel ? googleMapsDirectionsUrl(coordinates, placeId) : null;
  const directionsLink = directionsLabel && directionsHref ? (
    <a href={directionsHref} className="text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
      {directionsLabel}
    </a>
  ) : null;

  if (!apiKey) {
    return (
      <div className="space-y-2">
        {caption ? <p className="text-sm text-foreground/80">{caption}</p> : null}
        {directionsLink}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-64 w-full overflow-hidden bg-[#e8e4de] sm:h-80">
        <APIProvider apiKey={apiKey}>
          <Map
            mapId={GOOGLE_MAP_ID}
            defaultCenter={coordinates}
            defaultZoom={15}
            gestureHandling="cooperative"
            reuseMaps
            style={{ width: "100%", height: "100%" }}
          >
            <AdvancedMarker position={coordinates} />
          </Map>
        </APIProvider>
      </div>
      {caption ? <p className="text-sm text-foreground/80">{caption}</p> : null}
      {directionsLink}
    </div>
  );
}
