// Every number on the site lives here. Write each value exactly as it should read, units included: "12", "40+", "99.5%", "30K".
// A null value shows up in previews as a highlighted gap, `npm run build` lists it, and `npm run check` fails until it is filled.
export type Metric = { v: string | null; what: string };

export const M = {
  // Palo Alto Networks: credit platform
  creditProducts: { v: null, what: "# cybersecurity products" },
  creditCurrencies: { v: null, what: "# credit currencies" },
  creditOfferings: { v: null, what: "# offerings, e.g. 40+" },
  creditCustomers: { v: null, what: "# customers, e.g. 500+" },
  activationReliability: { v: null, what: "activation reliability %" },
  // Usage metering
  meteringEventTypes: { v: null, what: "# activation event types, e.g. 20+" },
  billingAccuracy: { v: null, what: "billing accuracy %" },
  // LLM support feature
  mttrDaysSaved: { v: null, what: "# days" },
  manualCasesCut: { v: null, what: "% fewer manual cases" },
  // Launches
  launches: { v: null, what: "# launches" },
  teams: { v: null, what: "# teams" },
  // Product-led growth trial
  trialApprovalWeeks: { v: null, what: "# weeks" },
  // Onboarding redesign
  ticketsBefore: { v: null, what: "ticket share before %" },
  ticketsAfter: { v: null, what: "ticket share after %" },
  onboardingProducts: { v: null, what: "# products" },
  inputsBefore: { v: null, what: "# inputs before" },
  inputsAfter: { v: null, what: "# inputs after" },
  // Discovery
  interviews: { v: null, what: "# interviews, e.g. 30+" },
  roadmapFeatures: { v: null, what: "# roadmap features" },
  // Walmart
  wmtMetrics: { v: null, what: "# metrics" },
  wmtYears: { v: null, what: "# years" },
  wmtCampaigns: { v: null, what: "# campaigns, e.g. 50+" },
  // American Express
  amexWorkflows: { v: null, what: "# workflows" },
  amexHoursSaved: { v: null, what: "# hours" },
  amexToolUsers: { v: null, what: "# employees, e.g. 200+" },
  amexSprintWeeks: { v: null, what: "# weeks" },
} satisfies Record<string, Metric>;

export type MetricKey = keyof typeof M;
export const missing: string[] = Object.entries(M as Record<string, Metric>).filter(([, m]) => m.v === null).map(([k]) => k);

// Splits "across {launches} launches" into text and number pieces; an unknown key is a typo and fails the build.
export function fill(s: string): { t: string; todo: boolean }[] {
  return s.split(/\{(\w+)\}/g).map((part, i) => {
    if (i % 2 === 0) return { t: part, todo: false };
    const m = (M as Record<string, Metric>)[part];
    if (!m) throw new Error(`Unknown metric {${part}} in: ${s}`);
    return m.v === null ? { t: `[${m.what}]`, todo: true } : { t: m.v, todo: false };
  });
}
