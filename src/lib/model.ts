import { z } from "zod";
export const statuses = [
  "Draft",
  "Pending Review",
  "Approved",
  "Rejected",
] as const;
export const trades = [
  "Drywall",
  "Electrical",
  "Mechanical",
  "Concrete",
  "Materials",
  "Other",
] as const;
export const project = {
  id: "harbourview",
  name: "Harbourview Towers",
  location: "Toronto, ON",
  contractor: "Northline Construction Ltd.",
  description: "A two-tower residential high-rise development.",
  subcontractors: [
    "Lakefront Interiors Ltd.",
    "Beacon Electrical Ltd.",
    "Westhaven Mechanical Ltd.",
    "Keystone Concrete Ltd.",
    "Maple Envelope Ltd.",
  ],
};
export const recordSchema = z.object({
  id: z.string(),
  number: z.string(),
  projectId: z.literal("harbourview"),
  title: z.string().min(1).max(180),
  trade: z.enum(trades),
  subcontractor: z.string().max(300),
  description: z.string().max(20000),
  reason: z.string().max(5000),
  originalScope: z.string().max(5000),
  revisedScope: z.string().max(5000),
  cost: z.number().finite().min(-1e9).max(1e9).nullable(),
  costNote: z.string().max(5000),
  schedule: z.string().max(5000),
  documentation: z.string().max(5000),
  missing: z.string().max(5000),
  status: z.enum(statuses),
  source: z.string().max(20000),
  mode: z.enum(["demo", "ai", "manual"]),
  isDemo: z.boolean(),
  updatedAt: z.string(),
  createdAt: z.string(),
});
export type ChangeOrder = z.infer<typeof recordSchema>;
export const money = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
export const nextNumber = (records: ChangeOrder[]) =>
  `CO-${String(Math.max(0, ...records.map((r) => Number(r.number.replace("CO-", "")) || 0)) + 1).padStart(3, "0")}`;
export function metrics(records: ChangeOrder[]) {
  return {
    total: records.length,
    pending: records.filter((r) => r.status === "Pending Review").length,
    approved: records.filter((r) => r.status === "Approved").length,
    value: records
      .filter((r) => r.status !== "Rejected")
      .reduce((s, r) => s + (r.cost ?? 0), 0),
    unknown: records.filter((r) => r.status !== "Rejected" && r.cost === null)
      .length,
  };
}
export function filterRecords(
  records: ChangeOrder[],
  query: string,
  status: string,
  trade: string,
  sort: string,
) {
  return records
    .filter(
      (r) =>
        (status === "All statuses" || r.status === status) &&
        (trade === "All trades" || r.trade === trade) &&
        `${r.number} ${r.title} ${r.description} ${project.name} ${r.trade} ${r.subcontractor}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "cost"
        ? (b.cost ?? -Infinity) - (a.cost ?? -Infinity)
        : sort === "number"
          ? b.number.localeCompare(a.number, undefined, { numeric: true })
          : Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
    );
}
export const sampleEmail = `From: Alex Morgan, Lakefront Interiors Ltd.
Subject: Harbourview Towers — Tower A, Level 08 partition revision

Hi team,
The revised architectural layout moves the corridor partition at suites 807–810. Our original scope followed drawing A-208 Rev 2. Please revise the partition layout to drawing A-208 Rev 3 and include the associated drywall finishing.
The reason for the change is the revised architectural layout.
Our revised quotation is CAD 12,480, excluding tax.
Schedule impact is not yet confirmed; we need the updated access dates.
Supporting document: quotation LI-042 (referenced, not attached).
Please confirm the revised drawing approval and access dates before we proceed.
Thanks,
Alex`;
export function blankRecord(number: string, source = ""): ChangeOrder {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    number,
    projectId: "harbourview",
    title: "Proposed scope change",
    trade: "Other",
    subcontractor: "Requires confirmation",
    description: "",
    reason: "Requires confirmation",
    originalScope: "Requires confirmation",
    revisedScope: "Requires confirmation",
    cost: null,
    costNote: "Requires confirmation",
    schedule: "Requires confirmation",
    documentation: "No supporting files uploaded",
    missing:
      "Confirm scope, cost, schedule, and authorization before proceeding.",
    status: "Draft",
    source,
    mode: "manual",
    isDemo: false,
    updatedAt: now,
    createdAt: now,
  };
}
export function demoDraft(source: string): Partial<ChangeOrder> {
  if (source.trim() === sampleEmail.trim())
    return {
      title: "Level 08 corridor partition revisions",
      trade: "Drywall",
      subcontractor: "Lakefront Interiors Ltd.",
      description:
        "Revise the corridor partition at suites 807–810 in Tower A, Level 08, including associated drywall finishing.",
      reason: "Revised architectural layout.",
      originalScope: "Drawing A-208 Rev 2.",
      revisedScope: "Drawing A-208 Rev 3; associated drywall finishing.",
      cost: 12480,
      costNote:
        "Quoted CAD 12,480, excluding tax. Requires review; not an approved amount.",
      schedule: "Not yet confirmed; updated access dates are required.",
      documentation:
        "Quotation LI-042 is referenced in the email, not attached.",
      missing:
        "Confirm revised drawing approval, access dates, schedule impact, and quotation LI-042.",
      mode: "demo",
      isDemo: true,
    };
  return {
    title: "Source notes — review required",
    description: source,
    missing:
      "Demo mode preserves your notes but does not interpret them. Confirm the trade, subcontractor, scope, reason, cost, schedule, and supporting documentation.",
    mode: "demo",
    isDemo: false,
  };
}
export function seedRecords(): ChangeOrder[] {
  const rows: [
    string,
    ChangeOrder["trade"],
    number | null,
    ChangeOrder["status"],
    string,
  ][] = [
    [
      "Level 08 corridor partition revisions",
      "Drywall",
      12480,
      "Pending Review",
      "Revised architectural layout changes suite entry partitions.",
    ],
    [
      "Tower B lighting layout modifications",
      "Electrical",
      18650,
      "Pending Review",
      "Relocate corridor lighting to coordinate with the revised reflected ceiling plan.",
    ],
    [
      "Level 12 ductwork coordination",
      "Mechanical",
      null,
      "Draft",
      "Review duct routing at the transfer beam; cost and schedule require confirmation.",
    ],
    [
      "Podium equipment housekeeping pads",
      "Concrete",
      9200,
      "Approved",
      "Additional equipment pads shown on the coordinated mechanical layout.",
    ],
    [
      "Lobby acoustic panel substitution",
      "Materials",
      -2300,
      "Approved",
      "Proposed equivalent panel finish with a documented cost credit.",
    ],
    [
      "Temporary electrical rerouting",
      "Electrical",
      6800,
      "Rejected",
      "Alternative temporary routing reviewed and declined in this fictional scenario.",
    ],
  ];
  return rows.map(([title, trade, cost, status, description], i) => ({
    ...blankRecord(`CO-${String(i + 1).padStart(3, "0")}`),
    id: `demo-${i + 1}`,
    title,
    trade,
    cost,
    status,
    description,
    subcontractor:
      project.subcontractors[
        trade === "Electrical"
          ? 1
          : trade === "Mechanical"
            ? 2
            : trade === "Concrete"
              ? 3
              : trade === "Materials"
                ? 4
                : 0
      ],
    reason: "Fictional design coordination change for product demonstration.",
    costNote:
      cost === null
        ? "Requires confirmation"
        : "Fictional estimate in CAD, excluding tax.",
    schedule: "Requires confirmation",
    missing:
      "Confirm schedule and supporting drawings. All information in this record is fictional.",
    source: `FICTIONAL DEMONSTRATION RECORD\n${description}\n${cost === null ? "No cost supplied." : `Demo estimate: CAD ${cost}, excluding tax.`}`,
    mode: "demo",
    isDemo: true,
    createdAt: `2026-10-${String(16 - i).padStart(2, "0")}T14:00:00.000Z`,
    updatedAt: `2026-10-${String(16 - i).padStart(2, "0")}T14:00:00.000Z`,
  }));
}
