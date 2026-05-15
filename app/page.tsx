"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase";
import type { LearningItem, CrmCompany } from "@/lib/types";
import { STAGE_CONFIG, STAGES_ORDER } from "@/lib/types";

export default function Dashboard() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [itemsRes, companiesRes] = await Promise.all([
        supabase.from("learning_items").select("*"),
        supabase.from("crm_companies").select("*"),
      ]);
      setItems(itemsRes.data ?? []);
      setCompanies(companiesRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const totalCompanies = companies.length;

  const stageCounts = STAGES_ORDER.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = companies.filter((c) => c.stage === stage).length;
    return acc;
  }, {});

  const recentActivities = companies
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            Your sales learning journey and job search at a glance.
          </p>

          {loading ? (
            <div className="mt-12 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Learning Progress"
                  value={`${progressPct}%`}
                  sub={`${completedItems} / ${totalItems} items`}
                  color="indigo"
                />
                <StatCard
                  label="Companies Tracked"
                  value={String(totalCompanies)}
                  sub="in your pipeline"
                  color="violet"
                />
                <StatCard
                  label="In Interview"
                  value={String(stageCounts.interview || 0)}
                  sub="active interviews"
                  color="purple"
                />
                <StatCard
                  label="Offers"
                  value={String(stageCounts.offer || 0)}
                  sub="received"
                  color="emerald"
                />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-950">
                      Learning Progress
                    </h2>
                    <Link
                      href="/learn"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Continue learning &rarr;
                    </Link>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {completedItems} of {totalItems} completed
                      </span>
                      <span className="font-semibold text-indigo-700">
                        {progressPct}%
                      </span>
                    </div>
                    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-950">
                      Pipeline Overview
                    </h2>
                    <Link
                      href="/crm"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Open CRM &rarr;
                    </Link>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {STAGES_ORDER.map((stage) => {
                      const cfg = STAGE_CONFIG[stage];
                      return (
                        <div
                          key={stage}
                          className={`rounded-lg ${cfg.bgColor} p-3 text-center`}
                        >
                          <span className={`text-xl font-bold ${cfg.color}`}>
                            {stageCounts[stage] || 0}
                          </span>
                          <p className={`mt-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {recentActivities.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Recently Updated Companies
                  </h2>
                  <div className="mt-4 divide-y divide-slate-100">
                    {recentActivities.map((c) => (
                      <Link
                        key={c.id}
                        href={`/crm/${c.id}`}
                        className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-3 px-3 rounded-lg transition"
                      >
                        <div>
                          <p className="font-medium text-slate-950">{c.name}</p>
                          <p className="text-sm text-slate-500">{c.website}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_CONFIG[c.stage].bgColor} ${STAGE_CONFIG[c.stage].color}`}
                        >
                          {STAGE_CONFIG[c.stage].label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500 to-indigo-600",
    violet: "from-violet-500 to-violet-600",
    purple: "from-purple-500 to-purple-600",
    emerald: "from-emerald-500 to-emerald-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold bg-gradient-to-r ${colorMap[color] || colorMap.indigo} bg-clip-text text-transparent`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
