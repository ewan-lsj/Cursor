import sharp from "sharp";

export const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedMimeType = (typeof supportedMimeTypes)[number];

export type SharpMetadata = {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  space?: string;
  channels?: number;
  density?: number;
  hasAlpha?: boolean;
  orientation?: number;
};

export type ProcessedImageResult = {
  original: {
    filename: string;
    mimetype: SupportedMimeType;
    size: number;
    width: number | null;
    height: number | null;
    format: string | null;
    metadata: SharpMetadata;
  };
  processed: {
    filename: string;
    mimetype: "image/webp";
    size: number;
    width: number | null;
    height: number | null;
    format: string | null;
    metadata: SharpMetadata;
    base64: string;
  };
  processingTimeMs: number;
};

export function assertSupportedMimeType(mimetype: string): asserts mimetype is SupportedMimeType {
  if (!supportedMimeTypes.includes(mimetype as SupportedMimeType)) {
    throw new Error(`Unsupported file type: ${mimetype}. Only JPEG, PNG, and WebP are supported.`);
  }
}

function toSharpMetadata(metadata: sharp.Metadata, size?: number): SharpMetadata {
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size,
    space: metadata.space,
    channels: metadata.channels,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    orientation: metadata.orientation,
  };
}

function buildOutputFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  const basename = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;

  return `${basename || "processed-image"}.webp`;
}

export async function processImageFile(image: File): Promise<ProcessedImageResult> {
  assertSupportedMimeType(image.type);

  const startedAt = performance.now();
  const inputBuffer = Buffer.from(await image.arrayBuffer());
  const originalMetadata = await sharp(inputBuffer).metadata();

  const outputBuffer = await sharp(inputBuffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  const processedMetadata = await sharp(outputBuffer).metadata();
  const processingTimeMs = Math.round(performance.now() - startedAt);

  return {
    original: {
      filename: image.name,
      mimetype: image.type,
      size: image.size,
      width: originalMetadata.width ?? null,
      height: originalMetadata.height ?? null,
      format: originalMetadata.format ?? null,
      metadata: toSharpMetadata(originalMetadata, image.size),
    },
    processed: {
      filename: buildOutputFilename(image.name),
      mimetype: "image/webp",
      size: outputBuffer.byteLength,
      width: processedMetadata.width ?? null,
      height: processedMetadata.height ?? null,
      format: processedMetadata.format ?? null,
      metadata: toSharpMetadata(processedMetadata, outputBuffer.byteLength),
      base64: outputBuffer.toString("base64"),
    },
    processingTimeMs,
  };
}
