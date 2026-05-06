import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { processImageFile } from "@/lib/image-processing";

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return NextResponse.json({ message: "Upload an image file in the image field." }, { status: 400 });
  }

  Sentry.setContext("upload", {
    filename: image.name,
    mimetype: image.type,
    size: image.size,
  });

  const response = await processImageFile(image);
  return NextResponse.json(response);
}
