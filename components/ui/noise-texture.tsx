"use client";

import React, { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface NoiseTextureProps extends ComponentProps<"svg"> {
  /** Extra classes merged onto the root `svg` element. */
  className?: string;
  /**
   * `baseFrequency` for `feTurbulence`; higher values yield finer-grained noise.
   * @default 0.5
   */
  frequency?: number;
  /**
   * `numOctaves` for `feTurbulence`; more octaves add detail at smaller scales.
   * 4 octaves provides optimal grain fidelity while keeping 60fps mobile scroll performance.
   * @default 4
   */
  octaves?: number;
  /**
   * Linear slope on each channel after desaturation; adjusts contrast and visibility of the noise.
   * @default 0.22
   */
  slope?: number;
  /**
   * Opacity of the filled noise layer (`rect`).
   * @default 0.7
   */
  noiseOpacity?: number;
  /**
   * Built-in smooth edge mask to prevent harsh boundaries on mobile/desktop viewports.
   * @default "none"
   */
  mask?: "radial" | "fade-bottom" | "none";
}

export const NoiseTexture = ({
  className,
  frequency = 0.5,
  octaves = 4,
  slope = 0.22,
  noiseOpacity = 0.7,
  mask = "none",
  style,
  ...props
}: NoiseTextureProps) => {
  const rawId = useId();
  // Sanitize React useId characters for bulletproof SVG filter referencing across WebKit and Blink
  const filterId = `noise-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Cross-browser mask support (including iOS Safari WebKit prefix)
  const maskStyle: React.CSSProperties =
    mask === "radial"
      ? {
          WebkitMaskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
          maskImage:
            "radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)",
        }
      : mask === "fade-bottom"
      ? {
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
        }
      : {};

  return (
    <svg
      className={cn(
        "pointer-events-none absolute !mt-0  inset-0 z-0 size-full opacity-60 select-none dark:opacity-85",
        // GPU acceleration hints for jitter-free 60fps scrolling on mobile devices
        "transform-gpu will-change-transform",
        className
      )}
      style={{ ...maskStyle, ...style }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency}
          numOctaves={octaves}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={slope} />
          <feFuncG type="linear" slope={slope} />
          <feFuncB type="linear" slope={slope} />
        </feComponentTransfer>
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId})`}
        opacity={noiseOpacity}
      />
    </svg>
  );
};
