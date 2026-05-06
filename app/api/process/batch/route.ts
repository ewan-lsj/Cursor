import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { processImageFile } from "@/lib/image-processing";

const maxBatchSize = 12;

type BatchProcessResponse = {
  results: Awaited<ReturnType<typeof processImageFile>>[];
  totalProcessingTimeMs: number;
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("images");
  const images = files.filter((entry): entry is File => entry instanceof File);

  if (images.length === 0) {
    return NextResponse.json({ message: "Upload at least one image in the images field." }, { status: 400 });
  }

  if (images.length > maxBatchSize) {
    return NextResponse.json({ message: `Batch size exceeds ${maxBatchSize} images.` }, { status: 400 });
  }

  Sentry.setContext("batch-upload", {
    count: images.length,
    filenames: images.map((image) => image.name),
    mimetypes: images.map((image) => image.type),
    totalSize: images.reduce((total, image) => total + image.size, 0),
  });

  const results = await Promise.all(images.map((image) => processImageFile(image)));
  const totalProcessingTimeMs = results.reduce((total, result) => total + result.processingTimeMs, 0);
  const response: BatchProcessResponse = {
    results,
    totalProcessingTimeMs,
  };

  return NextResponse.json(response);
}
