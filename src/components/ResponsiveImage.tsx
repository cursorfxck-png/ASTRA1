"use client";

import { useEffect, useState } from "react";

import { hasMediaSrc } from "@/lib/content-merge";

interface ResponsiveImageProps {
  src: string;
  mobileSrc?: string;
  alt: string;
  className?: string;
  imageRatio?: string;
}

export function ResponsiveImage({
  src,
  mobileSrc,
  alt,
  className = "",
  imageRatio = "125%",
}: ResponsiveImageProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const desktopSrc = hasMediaSrc(src) ? src : null;
  const mobileImageSrc =
    isMobile && hasMediaSrc(mobileSrc) ? mobileSrc : desktopSrc;

  if (!mobileImageSrc) {
    return (
      <div
        className={`responsive-image-placeholder ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  if (isMobile) {
    return (
      <div className={`responsive-image-mobile ${className}`.trim()}>
        <img src={mobileImageSrc} alt={alt} loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`responsive-image-desktop ${className}`.trim()}
      style={
        {
          ["--ratio-percent" as string]: imageRatio,
        } as React.CSSProperties
      }
    >
      <img src={mobileImageSrc} alt={alt} loading="lazy" />
    </div>
  );
}
