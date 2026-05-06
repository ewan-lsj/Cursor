"use client";

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";

type ImageMetadata = {
  width: number | null;
  height: number | null;
  format: string | null;
  size: number;
  mimetype: string;
};

type ProcessResponse = {
  original: ImageMetadata & {
    filename: string;
  };
  processed: ImageMetadata & {
    base64: string;
    filename: string;
  };
  processingTimeMs: number;
};

type BatchProcessResponse = {
  results: ProcessResponse[];
  totalProcessingTimeMs: number;
};

const acceptedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/heic",
  "image/heif",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
];

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessResponse[]>([]);
  const [totalProcessingTimeMs, setTotalProcessingTimeMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resultCards = useMemo(
    () =>
      results.map((result) => ({
        ...result,
        previewDataUrl: `data:image/webp;base64,${result.processed.base64}`,
      })),
    [results],
  );

  function setFiles(files: FileList | File[] | null): void {
    if (!files) {
      return;
    }

    const normalizedFiles = Array.from(files);
    if (normalizedFiles.length === 0) {
      return;
    }

    setSelectedFiles(normalizedFiles);
    setResults([]);
    setTotalProcessingTimeMs(0);
    setError(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setIsDragging(false);
    setFiles(event.dataTransfer.files);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    setFiles(event.target.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setError("Choose one or more images before processing.");
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("images", file);
    }

    setIsProcessing(true);
    setError(null);
    setResults([]);
    setTotalProcessingTimeMs(0);

    try {
      const response = await fetch("/api/process/batch", {
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

      const parsedPayload = payload as BatchProcessResponse;
      setResults(parsedPayload.results);
      setTotalProcessingTimeMs(parsedPayload.totalProcessingTimeMs);
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
              Upload a JPEG, PNG, or WebP to resize and convert it. Upload TIFF or HEIC to trigger the
              intentional Sentry exception path.
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
              <span className="text-lg font-semibold text-slate-900">Drop images here or click to browse</span>
              <span className="mt-2 text-sm">Select up to 12 files. Visually accepts JPG, PNG, WebP, TIFF, and HEIC</span>
              <input
                type="file"
                name="images"
                accept={acceptedTypes.join(",")}
                multiple
                className="sr-only"
                onChange={handleInputChange}
              />
            </label>

            {selectedFiles.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Selected files</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="font-medium text-slate-500">Count</dt>
                    <dd className="mt-1 break-all font-semibold text-slate-950">{selectedFiles.length}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Total size</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatBytes(selectedFiles.reduce((total, file) => total + file.size, 0))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Largest file</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatBytes(Math.max(...selectedFiles.map((file) => file.size)))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Preview list</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{selectedFiles.slice(0, 2).map((file) => file.name).join(", ")}{selectedFiles.length > 2 ? "..." : ""}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isProcessing}
              className="w-full rounded-2xl bg-sky-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isProcessing ? "Processing..." : "Process Batch"}
            </button>
          </form>

          {error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
              <h2 className="text-lg font-bold">Processing failed</h2>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : null}

          {resultCards.length > 0 ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">Batch processing results</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                  {resultCards.length} images · {totalProcessingTimeMs} ms total
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resultCards.map((result, index) => (
                  <article key={`${result.processed.filename}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="aspect-video bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result.previewDataUrl} alt={`Processed preview for ${result.original.filename}`} className="h-full w-full object-contain" />
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-950">{result.original.filename}</h3>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                          {result.processingTimeMs} ms
                        </span>
                      </div>
                      <div className="grid gap-4">
                        <MetadataPanel title="Original" rows={metadataRows(result.original)} />
                        <MetadataPanel title="WebP output" rows={metadataRows(result.processed)} />
                      </div>
                      <a
                        href={result.previewDataUrl}
                        download={result.processed.filename}
                        className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        Download WebP
                      </a>
                    </div>
                  </article>
                ))}
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
    <div className="rounded-xl bg-slate-50 p-3">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <dl className="mt-2 space-y-1 text-xs">
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
