export type LearningPhase = {
  id: string;
  phase_number: number;
  title: string;
  description: string;
};

export type LearningItem = {
  id: string;
  phase_id: string;
  title: string;
  description: string;
  sort_order: number;
  completed: boolean;
  notes: string;
  updated_at: string;
};

export type CrmCompany = {
  id: string;
  name: string;
  website: string;
  funding_news: string;
  ceo_linkedin: string;
  pyramid_top: string;
  stage: CrmStage;
  personalised_opener: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CrmContact = {
  id: string;
  company_id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  linkedin_url: string;
  notes: string;
  created_at: string;
};

export type ActivityType = "call" | "email" | "linkedin" | "voicemail" | "application" | "interview" | "thank_you" | "other";

export type CrmActivity = {
  id: string;
  company_id: string;
  contact_id: string | null;
  activity_type: ActivityType;
  subject: string;
  body: string;
  outcome: string;
  activity_date: string;
  created_at: string;
};

export type CrmStage =
  | "research"
  | "outreach"
  | "engaged"
  | "interview"
  | "offer"
  | "closed";

export const STAGE_CONFIG: Record<CrmStage, { label: string; color: string; bgColor: string }> = {
  research: { label: "Research", color: "text-slate-700", bgColor: "bg-slate-100" },
  outreach: { label: "Outreach", color: "text-blue-700", bgColor: "bg-blue-50" },
  engaged: { label: "Engaged", color: "text-amber-700", bgColor: "bg-amber-50" },
  interview: { label: "Interview", color: "text-purple-700", bgColor: "bg-purple-50" },
  offer: { label: "Offer", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  closed: { label: "Closed", color: "text-rose-700", bgColor: "bg-rose-50" },
};

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; icon: string }> = {
  call: { label: "Call", icon: "phone" },
  email: { label: "Email", icon: "mail" },
  linkedin: { label: "LinkedIn", icon: "linkedin" },
  voicemail: { label: "Voicemail", icon: "voicemail" },
  application: { label: "Application", icon: "file-text" },
  interview: { label: "Interview", icon: "users" },
  thank_you: { label: "Thank You Note", icon: "heart" },
  other: { label: "Other", icon: "more-horizontal" },
};

export const STAGES_ORDER: CrmStage[] = [
  "research",
  "outreach",
  "engaged",
  "interview",
  "offer",
  "closed",
];
