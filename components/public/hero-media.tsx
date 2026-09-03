"use client";

import { useEffect, useRef, useState } from "react";

const HERO_VIDEO = "/brand/hero.mp4";

export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const stop = () => setLoadVideo(false);
    const start = () => {
      if (!media.matches) setLoadVideo(true);
    };

    const onMotionChange = () => {
      if (media.matches) stop();
      else start();
    };

    media.addEventListener("change", onMotionChange);
    if (media.matches) {
      return () => media.removeEventListener("change", onMotionChange);
    }

    let idleId = 0;
    let timeoutId = 0;
    const scheduleIdle = window.requestIdleCallback;
    if (typeof scheduleIdle === "function") {
      idleId = scheduleIdle(start, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(start, 1);
    }

    return () => {
      media.removeEventListener("change", onMotionChange);
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    const play = node.play();
    if (play) void play.catch(() => undefined);
  }, [loadVideo]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-primary contain-strict" aria-hidden>
      {loadVideo ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 size-full object-cover"
            muted
            loop
            playsInline
            preload="none"
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-foreground/40" />
        </>
      ) : null}
    </div>
  );
}
