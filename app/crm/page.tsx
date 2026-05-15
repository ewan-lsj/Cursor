"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase";
import type { CrmCompany, CrmStage } from "@/lib/types";
import { STAGE_CONFIG, STAGES_ORDER } from "@/lib/types";

export default function CrmPage() {
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState<CrmStage | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("crm_companies")
      .select("*")
      .order("created_at", { ascending: false });
    setCompanies(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveToStage(companyId: string, newStage: CrmStage) {
    const supabase = createClient();
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, stage: newStage, updated_at: new Date().toISOString() }
          : c
      )
    );
    await supabase
      .from("crm_companies")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", companyId);
  }

  async function addCompany(formData: FormData) {
    const supabase = createClient();
    const name = formData.get("name") as string;
    const website = formData.get("website") as string;

    if (!name.trim()) return;

    const { data } = await supabase
      .from("crm_companies")
      .insert({
        name: name.trim(),
        website: website.trim(),
        stage: "research",
      })
      .select()
      .single();

    if (data) {
      setCompanies((prev) => [data, ...prev]);
      setShowForm(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-[90rem]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                CRM Pipeline
              </h1>
              <p className="mt-1 text-slate-600">
                Drag companies between stages. Click a card for full details.
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              + Add Company
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <form
                action={addCompany}
                className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
              >
                <h2 className="text-lg font-semibold text-slate-950">
                  Add Company
                </h2>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Company Name *
                    </label>
                    <input
                      name="name"
                      required
                      autoFocus
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="e.g. Salesforce"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Website
                    </label>
                    <input
                      name="website"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      placeholder="e.g. salesforce.com"
                    />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="mt-12 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {STAGES_ORDER.map((stage) => {
                const stageCompanies = companies.filter(
                  (c) => c.stage === stage
                );
                const cfg = STAGE_CONFIG[stage];
                const isOver = dragOver === stage;

                return (
                  <div
                    key={stage}
                    className={`w-72 shrink-0 rounded-2xl border-2 transition ${
                      isOver
                        ? "border-indigo-400 bg-indigo-50/50"
                        : "border-slate-200 bg-slate-100/50"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(stage);
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("companyId");
                      if (id) moveToStage(id, stage);
                      setDragOver(null);
                    }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${cfg.bgColor} ${cfg.color}`}
                      >
                        {stageCompanies.length}
                      </span>
                      <h3
                        className={`text-sm font-semibold ${cfg.color}`}
                      >
                        {cfg.label}
                      </h3>
                    </div>

                    <div className="space-y-2 px-3 pb-3 min-h-[4rem]">
                      {stageCompanies.map((company) => (
                        <Link
                          key={company.id}
                          href={`/crm/${company.id}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("companyId", company.id);
                          }}
                          className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-grab active:cursor-grabbing"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {company.name}
                          </p>
                          {company.website && (
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {company.website}
                            </p>
                          )}
                          {company.personalised_opener && (
                            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                              {company.personalised_opener}
                            </p>
                          )}
                        </Link>
                      ))}
                      {stageCompanies.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-400">
                          Drop here
                        </p>
                      )}
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
