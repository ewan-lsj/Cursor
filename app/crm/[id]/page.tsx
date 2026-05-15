"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase";
import type {
  CrmCompany,
  CrmContact,
  CrmActivity,
  CrmStage,
  ActivityType,
} from "@/lib/types";
import {
  STAGE_CONFIG,
  STAGES_ORDER,
  ACTIVITY_TYPE_CONFIG,
} from "@/lib/types";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CrmCompany | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"research" | "contacts" | "activity">("research");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [companyRes, contactsRes, activitiesRes] = await Promise.all([
      supabase.from("crm_companies").select("*").eq("id", companyId).single(),
      supabase
        .from("crm_contacts")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_activities")
        .select("*")
        .eq("company_id", companyId)
        .order("activity_date", { ascending: false }),
    ]);
    setCompany(companyRes.data);
    setContacts(contactsRes.data ?? []);
    setActivities(activitiesRes.data ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveResearch(formData: FormData) {
    setSaving(true);
    const supabase = createClient();
    const updates = {
      name: (formData.get("name") as string) || company?.name,
      website: formData.get("website") as string,
      funding_news: formData.get("funding_news") as string,
      ceo_linkedin: formData.get("ceo_linkedin") as string,
      pyramid_top: formData.get("pyramid_top") as string,
      personalised_opener: formData.get("personalised_opener") as string,
      notes: formData.get("notes") as string,
      updated_at: new Date().toISOString(),
    };
    const { data } = await supabase
      .from("crm_companies")
      .update(updates)
      .eq("id", companyId)
      .select()
      .single();
    if (data) setCompany(data);
    setSaving(false);
  }

  async function changeStage(newStage: CrmStage) {
    const supabase = createClient();
    setCompany((prev) =>
      prev ? { ...prev, stage: newStage, updated_at: new Date().toISOString() } : prev
    );
    await supabase
      .from("crm_companies")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", companyId);
  }

  async function addContact(formData: FormData) {
    const supabase = createClient();
    const { data } = await supabase
      .from("crm_contacts")
      .insert({
        company_id: companyId,
        name: (formData.get("name") as string).trim(),
        role: (formData.get("role") as string).trim(),
        email: (formData.get("email") as string).trim(),
        phone: (formData.get("phone") as string).trim(),
        linkedin_url: (formData.get("linkedin_url") as string).trim(),
        notes: (formData.get("contact_notes") as string).trim(),
      })
      .select()
      .single();
    if (data) {
      setContacts((prev) => [data, ...prev]);
      setShowContactForm(false);
    }
  }

  async function addActivity(formData: FormData) {
    const supabase = createClient();
    const { data } = await supabase
      .from("crm_activities")
      .insert({
        company_id: companyId,
        contact_id: (formData.get("contact_id") as string) || null,
        activity_type: formData.get("activity_type") as ActivityType,
        subject: (formData.get("subject") as string).trim(),
        body: (formData.get("body") as string).trim(),
        outcome: (formData.get("outcome") as string).trim(),
        activity_date: (formData.get("activity_date") as string) || new Date().toISOString(),
      })
      .select()
      .single();
    if (data) {
      setActivities((prev) => [data, ...prev]);
      setShowActivityForm(false);
    }
  }

  async function deleteCompany() {
    if (!confirm("Are you sure you want to delete this company and all its data?")) return;
    const supabase = createClient();
    await supabase.from("crm_activities").delete().eq("company_id", companyId);
    await supabase.from("crm_contacts").delete().eq("company_id", companyId);
    await supabase.from("crm_companies").delete().eq("id", companyId);
    router.push("/crm");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Nav />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Nav />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-slate-500">Company not found.</p>
          <Link href="/crm" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Back to CRM
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "research" as const, label: "Research & Pyramid" },
    { key: "contacts" as const, label: `Contacts (${contacts.length})` },
    { key: "activity" as const, label: `Activity Log (${activities.length})` },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Nav />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/crm" className="hover:text-indigo-600 transition">
              CRM
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{company.name}</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                {company.name}
              </h1>
              {company.website && (
                <p className="mt-0.5 text-slate-500">{company.website}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={company.stage}
                onChange={(e) => changeStage(e.target.value as CrmStage)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${STAGE_CONFIG[company.stage].bgColor} ${STAGE_CONFIG[company.stage].color} border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-200`}
              >
                {STAGES_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_CONFIG[s].label}
                  </option>
                ))}
              </select>
              <button
                onClick={deleteCompany}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-1 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "research" && (
              <form
                action={saveResearch}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
              >
                <h2 className="text-lg font-semibold text-slate-950">
                  Research & Value Pyramid
                </h2>
                <p className="text-sm text-slate-500">
                  Fill in the Greylock Value Pyramid: corporate objective at the top,
                  your product&apos;s value at the foundation.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Company Name" name="name" defaultValue={company.name} />
                  <Field label="Website" name="website" defaultValue={company.website} />
                  <Field
                    label="Latest Funding / Earnings News"
                    name="funding_news"
                    defaultValue={company.funding_news}
                  />
                  <Field
                    label="CEO LinkedIn Profile"
                    name="ceo_linkedin"
                    defaultValue={company.ceo_linkedin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Top of the Pyramid (Corporate Objective)
                  </label>
                  <textarea
                    name="pyramid_top"
                    defaultValue={company.pyramid_top}
                    rows={3}
                    placeholder="What is their corporate objective? BU initiative? Capability needed? How does your product deliver it?"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Personalised Opener
                  </label>
                  <textarea
                    name="personalised_opener"
                    defaultValue={company.personalised_opener}
                    rows={2}
                    placeholder="Your custom opener anchored in research..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={company.notes}
                    rows={3}
                    placeholder="General notes about this company..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Research"}
                </button>
              </form>
            )}

            {activeTab === "contacts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-950">Contacts</h2>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    + Add Contact
                  </button>
                </div>

                {showContactForm && (
                  <form
                    action={addContact}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name *" name="name" required />
                      <Field
                        label="Role"
                        name="role"
                        placeholder="SDR Manager, Head of Sales, Talent Partner"
                      />
                      <Field label="Email" name="email" type="email" />
                      <Field label="Phone" name="phone" type="tel" />
                      <Field label="LinkedIn URL" name="linkedin_url" />
                      <Field label="Notes" name="contact_notes" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {contacts.length === 0 && !showContactForm ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-sm text-slate-500">No contacts yet.</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Add SDR Managers, Heads of Sales, or Talent Partners.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {contact.name}
                            </p>
                            {contact.role && (
                              <p className="text-sm text-slate-500">{contact.role}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                          {contact.email && (
                            <span>
                              Email: {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span>
                              Phone: {contact.phone}
                            </span>
                          )}
                          {contact.linkedin_url && (
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                        {contact.notes && (
                          <p className="mt-2 text-sm text-slate-600">{contact.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Activity Log
                  </h2>
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    + Log Activity
                  </button>
                </div>

                {showActivityForm && (
                  <form
                    action={addActivity}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Type *
                        </label>
                        <select
                          name="activity_type"
                          required
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          {(
                            Object.entries(ACTIVITY_TYPE_CONFIG) as [
                              ActivityType,
                              { label: string },
                            ][]
                          ).map(([key, { label }]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">
                          Contact
                        </label>
                        <select
                          name="contact_id"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">No specific contact</option>
                          {contacts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Field label="Subject *" name="subject" required />
                      <Field
                        label="Date"
                        name="activity_date"
                        type="datetime-local"
                        defaultValue={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Details
                      </label>
                      <textarea
                        name="body"
                        rows={3}
                        placeholder="What happened? Key points discussed..."
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
                      />
                    </div>
                    <div className="mt-3">
                      <Field
                        label="Outcome"
                        name="outcome"
                        placeholder="e.g. Left voicemail, Booked meeting, Sent follow-up"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Log Activity
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowActivityForm(false)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {activities.length === 0 && !showActivityForm ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-sm text-slate-500">No activity logged yet.</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Track calls, emails, LinkedIn touches, and more.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
                      return (
                        <div
                          key={activity.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                {config?.label || activity.activity_type}
                              </span>
                              <p className="font-medium text-slate-950 text-sm">
                                {activity.subject}
                              </p>
                            </div>
                            <time className="text-xs text-slate-400 shrink-0">
                              {new Date(activity.activity_date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </time>
                          </div>
                          {activity.body && (
                            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                              {activity.body}
                            </p>
                          )}
                          {activity.outcome && (
                            <p className="mt-2 text-xs text-indigo-600 font-medium">
                              Outcome: {activity.outcome}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  placeholder = "",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}
