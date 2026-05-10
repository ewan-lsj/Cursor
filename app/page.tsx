"use client";

import { ChangeEvent, DragEvent, FormEvent, useMemo, useState } from "react";

import {
  ACCEPTED_UPLOAD_TYPES,
  isUploadOverMaxBytes,
  MAX_UPLOAD_BYTES,
  uploadFileTooLargeUserMessage,
} from "@/lib/image-formats";

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

// Map raw API/exception strings to a short, user-actionable message so the
// banner never leaks internal copy or stack-trace text to the end user.
function toUserFacingError(message: string | null | undefined): string {
  const fallback = "We couldn't process that image. Please try a different file.";

  if (!message) {
    return fallback;
  }

  const lower = message.toLowerCase();

  if (lower.includes("unsupported file type") || lower.includes("only jpeg")) {
    return fallback;
  }

  if (lower.includes("upload an image")) {
    return "Please choose an image to upload.";
  }

  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  const tooLarge = uploadFileTooLargeUserMessage();
  if (message === tooLarge) {
    return tooLarge;
  }

  return fallback;
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
      setError(toUserFacingError("upload an image"));
      return;
    }

    if (isUploadOverMaxBytes(selectedFile.size)) {
      setError(uploadFileTooLargeUserMessage());
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

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        let rawMessage =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : null;

        if (rawMessage === null && response.status === 413) {
          rawMessage = uploadFileTooLargeUserMessage();
        }

        setError(toUserFacingError(rawMessage));
        return;
      }

      setResult(payload as ProcessResponse);
    } catch (requestError) {
      setError(toUserFacingError(requestError instanceof Error ? requestError.message : null));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-950">Asset Processor</span>
          </a>
          <span className="hidden text-xs font-medium text-slate-500 sm:inline">
            Resize and convert to optimized WebP
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <section className="mx-auto w-full max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Optimize images for the web
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">
              Upload a JPEG, PNG, WebP, or TIFF and we&apos;ll resize it to a sensible width and re-encode it
              as WebP, ready to ship.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                  isDragging
                    ? "border-slate-900 bg-slate-50 text-slate-900"
                    : "border-slate-300 bg-slate-50/60 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                }`}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-3 h-9 w-9 text-slate-400"
                  aria-hidden="true"
                >
                  <path d="M12 16V4" />
                  <path d="m6 10 6-6 6 6" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                <span className="text-base font-semibold text-slate-900">
                  Drag an image here, or click to browse
                </span>
                <span className="mt-1.5 text-sm text-slate-500">
                  JPG, PNG, WebP, or TIFF — max {formatBytes(MAX_UPLOAD_BYTES)} per file
                </span>
                <input
                  type="file"
                  name="image"
                  accept={ACCEPTED_UPLOAD_TYPES.join(",")}
                  className="sr-only"
                  onChange={handleInputChange}
                />
              </label>

              {selectedFile ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Selected file
                  </h2>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Name</dt>
                      <dd className="mt-1 break-all font-medium text-slate-950">{selectedFile.name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Size</dt>
                      <dd className="mt-1 font-medium text-slate-950">{formatBytes(selectedFile.size)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Type</dt>
                      <dd className="mt-1 font-medium text-slate-950">{selectedFile.type || "unknown"}</dd>
                    </div>
                  </dl>
                  {isUploadOverMaxBytes(selectedFile.size) ? (
                    <p className="mt-3 text-sm font-medium text-amber-800" role="status">
                      {uploadFileTooLargeUserMessage()}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!selectedFile || isProcessing || isUploadOverMaxBytes(selectedFile.size)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {isProcessing ? "Processing..." : "Process image"}
              </button>
            </form>

            {error ? (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 h-5 w-5 flex-none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-sm leading-6">{error}</p>
              </div>
            ) : null}

            {result && previewDataUrl ? (
              <div className="mt-8 grid gap-6 rounded-xl border border-slate-200 bg-white p-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">Result</h2>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Processed in {result.processingTimeMs} ms
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <MetadataPanel title="Original" rows={metadataRows(result.original)} />
                    <MetadataPanel title="WebP output" rows={metadataRows(result.processed)} />
                  </div>

                  <a
                    href={previewDataUrl}
                    download="processed-image.webp"
                    className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    Download WebP
                  </a>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDataUrl}
                    alt="Processed WebP preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-xs text-slate-500">
          <span>Asset Processor</span>
          <span>Images are processed in-memory and never stored.</span>
        </div>
      </footer>
    </div>
  );
}

function MetadataPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
