"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  clampOffset,
  cropImageFile,
  displayedSize,
  initialPortraitOffset,
  sourceCropRect,
} from "@/lib/media/portraitCrop";

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

export function PortraitCropDialog({
  file,
  remainingCount = 0,
  onConfirm,
  onSkip,
}: {
  file: File | null;
  remainingCount?: number;
  onConfirm: (cropped: File) => void | Promise<void>;
  onSkip: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const previewUrl = useRef<string | null>(null);
  const drag = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 240, height: 320 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    previewUrl.current = url;
    setSrc(url);
    setZoom(MIN_ZOOM);
    return () => {
      URL.revokeObjectURL(url);
      if (previewUrl.current === url) previewUrl.current = null;
    };
  }, [file]);

  useLayoutEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const sync = () => setFrameSize({ width: node.clientWidth, height: node.clientHeight });
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  useLayoutEffect(() => {
    if (!imageSize.width || frameSize.width < 8) return;
    const shown = displayedSize(imageSize.width, imageSize.height, frameSize.width, frameSize.height, zoom);
    setOffset((current) => ({
      x: clampOffset(current.x, shown.width, frameSize.width),
      y: clampOffset(current.y, shown.height, frameSize.height),
    }));
  }, [frameSize.width, frameSize.height, imageSize.width, imageSize.height, zoom]);

  function applyOffset(nextX: number, nextY: number, nextZoom = zoom) {
    if (!imageSize.width) return;
    const shown = displayedSize(imageSize.width, imageSize.height, frameSize.width, frameSize.height, nextZoom);
    setOffset({
      x: clampOffset(nextX, shown.width, frameSize.width),
      y: clampOffset(nextY, shown.height, frameSize.height),
    });
  }

  function onImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const node = frameRef.current;
    const frameWidth = node?.clientWidth || frameSize.width;
    const frameHeight = node?.clientHeight || frameSize.height;
    setImageSize({ width, height });
    setFrameSize({ width: frameWidth, height: frameHeight });
    setZoom(MIN_ZOOM);
    setOffset(initialPortraitOffset(width, height, frameWidth, frameHeight, MIN_ZOOM));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, offsetX: offset.x, offsetY: offset.y };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    applyOffset(
      drag.current.offsetX + (event.clientX - drag.current.pointerX),
      drag.current.offsetY + (event.clientY - drag.current.pointerY),
    );
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  function onZoomChange(next: number) {
    setZoom(next);
    applyOffset(offset.x, offset.y, next);
  }

  async function confirm() {
    if (!file || !imageSize.width) return;
    setBusy(true);
    try {
      const crop = sourceCropRect({
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        frameWidth: frameSize.width,
        frameHeight: frameSize.height,
        zoom,
        offsetX: offset.x,
        offsetY: offset.y,
      });
      const cropped = await cropImageFile(file, crop);
      await onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  }

  const shown = imageSize.width
    ? displayedSize(imageSize.width, imageSize.height, frameSize.width, frameSize.height, zoom)
    : null;

  return (
    <Dialog open={file !== null} onOpenChange={(open) => { if (!open && !busy) onSkip(); }}>
      <DialogContent showCloseButton={!busy} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Frame the portrait</DialogTitle>
          <DialogDescription>
            Keep the head at the top of the frame. Head to shoulders or chest reads best on the public profile.
            {remainingCount > 0 ? ` ${remainingCount} more after this.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            ref={frameRef}
            className="relative aspect-3/4 w-[min(100%,16rem)] cursor-grab touch-none overflow-hidden bg-muted active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object-URL while framing, not a remote asset
              <img
                src={src}
                alt=""
                draggable={false}
                onLoad={onImageLoad}
                className="absolute max-w-none select-none"
                style={
                  shown
                    ? { width: shown.width, height: shown.height, left: offset.x, top: offset.y }
                    : { inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }
                }
              />
            ) : null}
          </div>
          <div className="w-full max-w-xs space-y-1">
            <Label htmlFor="portrait-zoom">Zoom</Label>
            <input
              id="portrait-zoom"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={busy}
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={onSkip}>
            Skip
          </Button>
          <Button type="button" className="min-h-11" disabled={busy || !imageSize.width || frameSize.width < 8} onClick={() => void confirm()}>
            {busy ? "Saving…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
