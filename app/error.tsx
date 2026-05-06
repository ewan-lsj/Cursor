"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172a] px-6 py-10 text-slate-900">
      <section className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">Application error</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Something went wrong</h1>
        <p className="mt-3 text-base text-slate-600">
          The error has been reported to Sentry. You can try again or refresh the page.
        </p>
        <button
          type="button"
          className="mt-6 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-500"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
