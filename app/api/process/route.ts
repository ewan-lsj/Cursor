import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_MIME_TYPES,
  UPLOAD_FILE_TOO_LARGE_MESSAGE,
  type SupportedMimeType,
} from "@/lib/image-formats";

type SharpMetadata = {
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

type ProcessResponse = {
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

function unsupportedMimeMessage(mimetype: string): string | null {
  if (SUPPORTED_MIME_TYPES.includes(mimetype as SupportedMimeType)) {
    return null;
  }

  return `Unsupported file type: ${mimetype}. Only JPEG, PNG, and WebP are supported.`;
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

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ message: "Upload an image file in the image field." }, { status: 400 });
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ message: UPLOAD_FILE_TOO_LARGE_MESSAGE }, { status: 413 });
  }

  const mimeMessage = unsupportedMimeMessage(image.type);
  if (mimeMessage) {
    return NextResponse.json({ message: mimeMessage }, { status: 400 });
  }

  Sentry.setContext("upload", {
    // Allowed fields only: filename, mimetype, size (see no-sensitive-sentry-context).
    filename: image.name,
    mimetype: image.type,
    size: image.size,
  });

  const startedAt = performance.now();
  const inputBuffer = Buffer.from(await image.arrayBuffer());
  const originalMetadata = await sharp(inputBuffer).metadata();

  const outputBuffer = await sharp(inputBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  const processedMetadata = await sharp(outputBuffer).metadata();
  const processingTimeMs = Math.round(performance.now() - startedAt);

  const response: ProcessResponse = {
    original: {
      filename: image.name,
      mimetype: image.type as SupportedMimeType,
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

  return NextResponse.json(response);
}
