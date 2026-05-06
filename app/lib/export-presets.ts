export const exportPresets = ["thumbnail", "web-optimized", "high-quality"] as const;

export type ExportPreset = (typeof exportPresets)[number];

export const exportPresetLabels: Record<ExportPreset, string> = {
  thumbnail: "Thumbnail",
  "web-optimized": "Web optimized",
  "high-quality": "High quality",
};
