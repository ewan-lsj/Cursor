"use client";

import { useEffect, useState, useCallback } from "react";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase";
import type { LearningPhase, LearningItem } from "@/lib/types";

export default function LearnPage() {
  const [phases, setPhases] = useState<LearningPhase[]>([]);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [phasesRes, itemsRes] = await Promise.all([
      supabase.from("learning_phases").select("*").order("phase_number"),
      supabase.from("learning_items").select("*").order("sort_order"),
    ]);
    setPhases(phasesRes.data ?? []);
    setItems(itemsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function seedData() {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    await load();
    setSeeding(false);
  }

  async function toggleComplete(item: LearningItem) {
    const supabase = createClient();
    const newCompleted = !item.completed;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, completed: newCompleted } : i))
    );
    await supabase
      .from("learning_items")
      .update({ completed: newCompleted, updated_at: new Date().toISOString() })
      .eq("id", item.id);
  }

  async function saveNotes(itemId: string, notes: string) {
    setSaving(itemId);
    const supabase = createClient();
    await supabase
      .from("learning_items")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", itemId);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, notes } : i))
    );
    setSaving(null);
  }

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                Sales Learning Path
              </h1>
              <p className="mt-1 text-slate-600">
                Work through each phase. Click any item to expand and add your notes.
              </p>
            </div>
            {phases.length === 0 && !loading && (
              <button
                onClick={seedData}
                disabled={seeding}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {seeding ? "Loading..." : "Load Curriculum"}
              </button>
            )}
          </div>

          {totalItems > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Overall Progress: {completedItems} / {totalItems}
                </span>
                <span className="font-semibold text-indigo-700">{progressPct}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="mt-12 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : phases.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-slate-500">
                No curriculum loaded yet. Click &ldquo;Load Curriculum&rdquo; to get started.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {phases.map((phase) => {
                const phaseItems = items.filter((i) => i.phase_id === phase.id);
                const phaseCompleted = phaseItems.filter((i) => i.completed).length;
                const phasePct =
                  phaseItems.length > 0
                    ? Math.round((phaseCompleted / phaseItems.length) * 100)
                    : 0;

                return (
                  <div
                    key={phase.id}
                    className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                          {phase.phase_number}
                        </span>
                        <div className="flex-1">
                          <h2 className="text-lg font-semibold text-slate-950">
                            Phase {phase.phase_number} — {phase.title}
                          </h2>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {phase.description}
                          </p>
                        </div>
                        <span className="hidden sm:inline-flex shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {phaseCompleted}/{phaseItems.length} · {phasePct}%
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${phasePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {phaseItems.map((item) => {
                        const isExpanded = expandedItem === item.id;
                        return (
                          <div key={item.id}>
                            <div
                              className="flex cursor-pointer items-start gap-3 px-5 py-3.5 sm:px-6 hover:bg-slate-50 transition"
                              onClick={() =>
                                setExpandedItem(isExpanded ? null : item.id)
                              }
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleComplete(item);
                                }}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                                  item.completed
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : "border-slate-300 hover:border-indigo-400"
                                }`}
                              >
                                {item.completed && (
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    item.completed
                                      ? "text-slate-400 line-through"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.notes && !isExpanded && (
                                  <p className="mt-0.5 text-xs text-slate-400 truncate">
                                    Notes: {item.notes.slice(0, 80)}
                                    {item.notes.length > 80 ? "..." : ""}
                                  </p>
                                )}
                              </div>
                              <svg
                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform mt-0.5 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                            {isExpanded && (
                              <NotesEditor
                                item={item}
                                onSave={saveNotes}
                                saving={saving === item.id}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NotesEditor({
  item,
  onSave,
  saving,
}: {
  item: LearningItem;
  onSave: (id: string, notes: string) => Promise<void>;
  saving: boolean;
}) {
  const [notes, setNotes] = useState(item.notes || "");
  const isDirty = notes !== (item.notes || "");

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Your Learning Notes
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write what you learned, key takeaways, questions, examples..."
        rows={5}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => onSave(item.id, notes)}
          disabled={!isDirty || saving}
          className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
        {!isDirty && item.notes && (
          <span className="text-xs text-emerald-600">Saved</span>
        )}
      </div>
    </div>
  );
}
