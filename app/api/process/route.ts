import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { SUPPORTED_MIME_TYPES, type SupportedMimeType } from "@/lib/image-formats";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

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

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function isSupportedMimeType(mimetype: string): mimetype is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mimetype as SupportedMimeType);
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
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Request body could not be parsed as multipart form data.", 400);
  }

  const image = formData.get("image");

  if (!(image instanceof File)) {
    return jsonError('Upload an image file in the "image" field.', 400);
  }

  if (image.size === 0) {
    return jsonError("Uploaded file is empty.", 400);
  }

  if (image.size > MAX_UPLOAD_BYTES) {
    return jsonError(
      `Uploaded file is too large. Maximum size is ${MAX_UPLOAD_BYTES} bytes.`,
      413,
    );
  }

  if (!isSupportedMimeType(image.type)) {
    return jsonError(
      `Unsupported file type: ${image.type || "unknown"}. Only JPEG, PNG, and WebP are supported.`,
      415,
    );
  }

  // Sentry upload context — captures only filename, mimetype, size, and processing
  // stage label (allowed fields per .cursor/rules/no-sensitive-sentry-context.mdc).
  Sentry.setContext("upload", {
    filename: image.name,
    mimetype: image.type,
    size: image.size,
    stage: "decode",
  });

  const startedAt = performance.now();
  const inputBuffer = Buffer.from(await image.arrayBuffer());

  let originalMetadata: sharp.Metadata;
  let outputBuffer: Buffer;
  let processedMetadata: sharp.Metadata;

  try {
    originalMetadata = await sharp(inputBuffer).metadata();

    Sentry.setContext("upload", {
      filename: image.name,
      mimetype: image.type,
      size: image.size,
      stage: "encode",
    });

    outputBuffer = await sharp(inputBuffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    processedMetadata = await sharp(outputBuffer).metadata();
  } catch {
    return jsonError(
      "Could not decode the uploaded file as a valid image.",
      400,
    );
  }

  const processingTimeMs = Math.round(performance.now() - startedAt);

  const response: ProcessResponse = {
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

  return NextResponse.json(response);
}
