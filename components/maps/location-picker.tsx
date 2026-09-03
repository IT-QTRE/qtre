"use client";

import { useEffect, useRef, useState } from "react";
import { APIProvider, AdvancedMarker, Map, useMapsLibrary } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHint } from "@/components/forms/field-hint";
import { googleMapsApiKey } from "@/lib/maps/api-key";
import { GOOGLE_MAP_ID, geocodeQuery, previewCenter, type MapCoordinates } from "@/lib/maps/query";

export type LocationValue = {
  address: string;
  placeId?: string;
  coordinates?: MapCoordinates;
};

export function LocationPicker({
  value,
  onChange,
  cityEn,
  countryCode,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  cityEn: string;
  countryCode: string;
}) {
  const apiKey = googleMapsApiKey();
  if (!apiKey) {
    return (
      <div className="space-y-4">
        <PlainAddressField value={value.address} onChange={(address) => onChange({ ...value, address, placeId: undefined })} />
        <FieldHint>Map is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable pin search and drag.</FieldHint>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places", "geocoding"]}>
      <LocationPickerLoaded value={value} onChange={onChange} cityEn={cityEn} countryCode={countryCode} />
    </APIProvider>
  );
}

function AddressChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor="property-address">Address</Label>
      {children}
      <FieldHint>Search a building or community. Drag the pin if Google lands slightly off.</FieldHint>
    </div>
  );
}

function PlainAddressField({
  value,
  onChange,
}: {
  value: string;
  onChange: (address: string) => void;
}) {
  return (
    <AddressChrome>
      <Input
        id="property-address"
        value={value}
        placeholder="e.g. Marina Heights, Dubai Marina"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </AddressChrome>
  );
}

function PlaceAddressField({
  address,
  countryCode,
  onTypedChange,
  onPlacePicked,
  onBlurGeocode,
}: {
  address: string;
  countryCode: string;
  onTypedChange: (address: string) => void;
  onPlacePicked: (next: LocationValue) => void;
  onBlurGeocode: () => void;
}) {
  const places = useMapsLibrary("places");
  const hostRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const skipBlurGeocode = useRef(false);
  const blurTimer = useRef<number | null>(null);
  const onTypedChangeRef = useRef(onTypedChange);
  const onPlacePickedRef = useRef(onPlacePicked);
  const onBlurGeocodeRef = useRef(onBlurGeocode);
  const addressRef = useRef(address);
  onTypedChangeRef.current = onTypedChange;
  onPlacePickedRef.current = onPlacePicked;
  onBlurGeocodeRef.current = onBlurGeocode;
  addressRef.current = address;

  useEffect(() => {
    if (!places || !hostRef.current) return;
    const el = new places.PlaceAutocompleteElement({
      placeholder: "e.g. Marina Heights, Dubai Marina",
      includedRegionCodes: countryCode ? [countryCode.toLowerCase()] : null,
      locationBias: previewCenter(countryCode),
      requestedLanguage: "en",
      value: address,
    });
    el.id = "property-address";
    el.className = "property-place-autocomplete";
    hostRef.current.replaceChildren(el);
    elementRef.current = el;

    const onSelect = (event: Event) => {
      if (!("placePrediction" in event)) return;
      const prediction = (event as google.maps.places.PlacePredictionSelectEvent).placePrediction;
      skipBlurGeocode.current = true;
      if (blurTimer.current !== null) {
        window.clearTimeout(blurTimer.current);
        blurTimer.current = null;
      }
      void (async () => {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["id", "displayName", "formattedAddress", "location"] });
        const location = place.location;
        if (!location) {
          toast.error("That place has no map location — try another result or drag the pin.");
          return;
        }
        const nextAddress = place.formattedAddress || place.displayName || el.value || "";
        el.value = nextAddress;
        onPlacePickedRef.current({
          address: nextAddress,
          placeId: place.id,
          coordinates: { lat: location.lat(), lng: location.lng() },
        });
      })();
    };

    const onInput = () => {
      if (el.value === addressRef.current) return;
      onTypedChangeRef.current(el.value);
    };

    const onFocusOut = () => {
      if (blurTimer.current !== null) window.clearTimeout(blurTimer.current);
      blurTimer.current = window.setTimeout(() => {
        blurTimer.current = null;
        if (skipBlurGeocode.current) {
          skipBlurGeocode.current = false;
          return;
        }
        onBlurGeocodeRef.current();
      }, 200);
    };

    el.addEventListener("gmp-select", onSelect);
    el.addEventListener("input", onInput);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      if (blurTimer.current !== null) window.clearTimeout(blurTimer.current);
      el.removeEventListener("gmp-select", onSelect);
      el.removeEventListener("input", onInput);
      el.removeEventListener("focusout", onFocusOut);
      el.remove();
      elementRef.current = null;
    };
    // Address is applied as the element's initial value; later edits sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remounting on every keystroke would close the suggestions list
  }, [places, countryCode]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    if (el.value !== address) el.value = address;
  }, [address]);

  return (
    <AddressChrome>
      <div ref={hostRef} className="min-h-9" />
    </AddressChrome>
  );
}

function LocationPickerLoaded({
  value,
  onChange,
  cityEn,
  countryCode,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  cityEn: string;
  countryCode: string;
}) {
  const geocoding = useMapsLibrary("geocoding");
  const [mapNonce, setMapNonce] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const center = value.coordinates ?? previewCenter(countryCode);

  useEffect(() => {
    setMapReady(true);
  }, []);

  async function geocodeTypedAddress() {
    const query = geocodeQuery(value.address, cityEn, countryCode);
    if (!query || !geocoding) return;
    try {
      const geocoder = new geocoding.Geocoder();
      const response = await geocoder.geocode({
        address: query,
        componentRestrictions: countryCode ? { country: countryCode.toLowerCase() } : undefined,
      });
      const result = response.results[0];
      const location = result?.geometry.location;
      if (!location) {
        toast.error("Couldn't find that address — drag the pin or try a more specific building or community.");
        return;
      }
      onChange({
        address: value.address,
        placeId: result.place_id,
        coordinates: { lat: location.lat(), lng: location.lng() },
      });
      setMapNonce((nonce) => nonce + 1);
    } catch {
      toast.error("Couldn't find that address — drag the pin or try a more specific building or community.");
    }
  }

  return (
    <div className="space-y-4">
      <PlaceAddressField
        address={value.address}
        countryCode={countryCode}
        onTypedChange={(address) => onChange({ ...value, address, placeId: undefined })}
        onPlacePicked={(next) => {
          onChange(next);
          setMapNonce((nonce) => nonce + 1);
        }}
        onBlurGeocode={() => {
          void geocodeTypedAddress();
        }}
      />
      <div className="h-48 w-full overflow-hidden border border-border sm:h-56">
        {mapReady ? (
          <Map
            key={mapNonce}
            mapId={GOOGLE_MAP_ID}
            defaultCenter={center}
            defaultZoom={value.coordinates ? 16 : 11}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            reuseMaps
            style={{ width: "100%", height: "100%" }}
          >
            {value.coordinates ? (
              <AdvancedMarker
                position={value.coordinates}
                draggable
                onDragEnd={(event) => {
                  const latLng = event.latLng;
                  if (!latLng) return;
                  onChange({
                    ...value,
                    placeId: undefined,
                    coordinates: { lat: latLng.lat(), lng: latLng.lng() },
                  });
                }}
              />
            ) : null}
          </Map>
        ) : null}
      </div>
      {value.coordinates || value.address ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onChange({ address: "" });
            setMapNonce((nonce) => nonce + 1);
          }}
        >
          Clear location
        </Button>
      ) : null}
    </div>
  );
}
