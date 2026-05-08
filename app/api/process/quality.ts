export const QUALITY_VALUES = ["low", "medium", "high"] as const;

export type Quality = (typeof QUALITY_VALUES)[number];

export const DEFAULT_QUALITY: Quality = "medium";

// WebP encoder quality (1-100) for each preset. `medium` is set to 85 to
// preserve the route's pre-existing default for callers that omit `quality`.
export const QUALITY_TO_WEBP: Record<Quality, number> = {
  low: 60,
  medium: 85,
  high: 95,
};

export function isQuality(value: unknown): value is Quality {
  return typeof value === "string" && (QUALITY_VALUES as readonly string[]).includes(value);
}
