import { useState, useEffect, useCallback, useRef, useMemo, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const PIXEL_FONTS = [
  "'Geist Pixel Square', monospace",
  "'Geist Pixel Grid', monospace",
  "'Geist Pixel Circle', monospace",
  "'Geist Pixel Triangle', monospace",
  "'Geist Pixel Line', monospace",
] as const;

const FONT_NAMES = ["square", "grid", "circle", "triangle", "line"] as const;

type PixelFont = (typeof FONT_NAMES)[number];
type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type PixelHeadingMode = "uniform" | "multi" | "wave" | "random";

interface PixelHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  mode?: PixelHeadingMode;
  autoPlay?: boolean;
  cycleInterval?: number;
  staggerDelay?: number;
  defaultFontIndex?: number;
  showLabel?: boolean;
  prefix?: string;
  prefixFont?: PixelFont | "none";
  initialFont?: PixelFont;
  hoverFont?: PixelFont;
  onFontIndexChange?: (index: number) => void;
}

function fontIndex(name: PixelFont): number {
  return FONT_NAMES.indexOf(name);
}

// Golden-ratio distribution for initial multi/random assignment
function goldenAssign(charCount: number): number[] {
  const phi = 1.618033988749895;
  const result: number[] = [];
  for (let i = 0; i < charCount; i++) {
    result.push(Math.floor(((i * phi) % 1) * PIXEL_FONTS.length));
  }
  return result;
}

export function PixelHeading({
  as: Tag = "h1",
  mode = "multi",
  autoPlay = false,
  cycleInterval = 150,
  staggerDelay = 50,
  defaultFontIndex = 0,
  showLabel = false,
  prefix,
  prefixFont = "none",
  initialFont,
  hoverFont,
  onFontIndexChange,
  children,
  className,
  ...props
}: PixelHeadingProps) {
  const text = typeof children === "string" ? children : String(children ?? "");
  const chars = useMemo(() => text.split(""), [text]);
  const charCount = chars.length;

  const startIdx = initialFont ? fontIndex(initialFont) : defaultFontIndex;

  // Per-character font indices
  const getInitialFonts = useCallback((): number[] => {
    if (mode === "uniform") return Array(charCount).fill(startIdx);
    if (mode === "wave") {
      return chars.map((_, i) => (startIdx + Math.floor((i / charCount) * PIXEL_FONTS.length)) % PIXEL_FONTS.length);
    }
    return goldenAssign(charCount);
  }, [charCount, chars, mode, startIdx]);

  const [charFonts, setCharFonts] = useState<number[]>(getInitialFonts);
  const [active, setActive] = useState(autoPlay);
  const tickRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setCharFonts(getInitialFonts());
  }, [getInitialFonts]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;

      setCharFonts((prev) => {
        const next = [...prev];
        for (let i = 0; i < charCount; i++) {
          const staggerTick = Math.floor((tick * 50) / Math.max(staggerDelay, 1));
          const charTick = staggerTick - i;
          if (charTick < 0) continue;

          if (mode === "uniform") {
            next[i] = (startIdx + tick) % PIXEL_FONTS.length;
          } else if (mode === "wave") {
            next[i] = (startIdx + tick + i) % PIXEL_FONTS.length;
          } else if (mode === "random") {
            next[i] = Math.floor(Math.random() * PIXEL_FONTS.length);
          } else {
            // multi: staggered cascade
            next[i] = (prev[i] + 1) % PIXEL_FONTS.length;
          }
        }

        if (onFontIndexChange && mode === "uniform") {
          onFontIndexChange(next[0]);
        }
        return next;
      });
    }, cycleInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, cycleInterval, staggerDelay, mode, charCount, startIdx, onFontIndexChange]);

  // Swap mode (word variant behavior)
  const isSwapMode = !!hoverFont;
  const [swapped, setSwapped] = useState(false);

  const handleEnter = () => {
    if (isSwapMode) {
      setSwapped(true);
      setCharFonts(Array(charCount).fill(fontIndex(hoverFont!)));
    } else {
      setActive(true);
    }
  };

  const handleLeave = () => {
    if (isSwapMode) {
      setSwapped(false);
      setCharFonts(Array(charCount).fill(startIdx));
    } else if (!autoPlay) {
      setActive(false);
    }
  };

  const prefixFontFamily =
    prefixFont === "none" ? undefined : PIXEL_FONTS[fontIndex(prefixFont)];

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Tag
        className={cn("cursor-default select-none transition-all duration-150", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        tabIndex={0}
        aria-label={text}
        {...props}
      >
        {prefix && (
          <span
            style={prefixFontFamily ? { fontFamily: prefixFontFamily } : undefined}
            className="transition-all duration-150"
          >
            {prefix}
          </span>
        )}
        {chars.map((char, i) => (
          <span
            key={i}
            className="inline-block transition-all duration-150"
            style={{ fontFamily: PIXEL_FONTS[charFonts[i] ?? 0] }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </Tag>
      {showLabel && (
        <p
          className="font-mono text-[10px] text-muted-foreground lowercase"
          aria-live="polite"
        >
          {mode === "uniform"
            ? FONT_NAMES[charFonts[0] ?? 0]
            : `mode: ${mode}`}
        </p>
      )}
    </div>
  );
}
