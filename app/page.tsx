"use client";

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";

import { ACCEPTED_UPLOAD_TYPES } from "@/lib/image-formats";

type ImageMetadata = {
  width: number | null;
  height: number | null;
  format: string | null;
  size: number;
  mimetype: string;
};

type ProcessResponse = {
  original: ImageMetadata;
  processed: ImageMetadata & {
    base64: string;
  };
  processingTimeMs: number;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function metadataRows(metadata: ImageMetadata): Array<[string, string]> {
  return [
    ["Format", metadata.format ?? "unknown"],
    ["Dimensions", metadata.width && metadata.height ? `${metadata.width} x ${metadata.height}` : "unknown"],
    ["MIME type", metadata.mimetype],
    ["Size", formatBytes(metadata.size)],
  ];
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewDataUrl = useMemo(() => {
    if (!result) {
      return null;
    }

    return `data:image/webp;base64,${result.processed.base64}`;
  }, [result]);

  function handleFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files.item(0) ?? undefined);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    handleFile(event.target.files?.item(0) ?? undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose an image before processing.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Image processing failed.";

        setError(message);
        return;
      }

      setResult(payload as ProcessResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Image processing failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-10 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-2xl shadow-black/30 sm:p-10">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Sentry demo</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Asset Processor</h1>
            <p className="mt-3 text-base text-slate-600">
              Upload a JPEG, PNG, WebP, or TIFF to resize and convert it. HEIC still triggers the intentional
              unsupported path for the Sentry demo.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                isDragging
                  ? "border-sky-500 bg-sky-50 text-sky-800"
                  : "border-slate-300 bg-slate-50 text-slate-600 hover:border-sky-400 hover:bg-sky-50"
              }`}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="text-lg font-semibold text-slate-900">Drop an image here or click to browse</span>
              <span className="mt-2 text-sm">Visually accepts JPG, PNG, WebP, TIFF, and HEIC</span>
              <input
                type="file"
                name="image"
                accept={ACCEPTED_UPLOAD_TYPES.join(",")}
                className="sr-only"
                onChange={handleInputChange}
              />
            </label>

            {selectedFile ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Selected file</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-500">Name</dt>
                    <dd className="mt-1 break-all font-semibold text-slate-950">{selectedFile.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Size</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{formatBytes(selectedFile.size)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">MIME type</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{selectedFile.type || "unknown"}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!selectedFile || isProcessing}
              className="w-full rounded-2xl bg-sky-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isProcessing ? "Processing..." : "Process Image"}
            </button>
          </form>

          {error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
              <h2 className="text-lg font-bold">Processing failed</h2>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : null}

          {result && previewDataUrl ? (
            <div className="mt-8 grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1fr_280px]">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-950">Processing result</h2>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    {result.processingTimeMs} ms
                  </span>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <MetadataPanel title="Original" rows={metadataRows(result.original)} />
                  <MetadataPanel title="WebP output" rows={metadataRows(result.processed)} />
                </div>

                <a
                  href={previewDataUrl}
                  download="processed-image.webp"
                  className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Download WebP
                </a>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewDataUrl} alt="Processed WebP preview" className="h-full w-full object-contain" />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MetadataPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-xl bg-white p-4">
      <h3 className="font-bold text-slate-950">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
