import test from "node:test";
import assert from "node:assert/strict";
import {
  seedRecords,
  metrics,
  filterRecords,
  demoDraft,
  sampleEmail,
  nextNumber,
  recordSchema,
} from "../src/lib/model";
import { verifiedDraft } from "../src/lib/extraction";
import { buildPdf } from "../src/lib/pdf";
test("dashboard totals exclude rejected values and identify unknown amounts", () => {
  const records = seedRecords();
  assert.deepEqual(metrics(records), {
    total: 6,
    pending: 2,
    approved: 2,
    value: 38030,
    unknown: 1,
  });
  assert.deepEqual(metrics([]), {
    total: 0,
    pending: 0,
    approved: 0,
    value: 0,
    unknown: 0,
  });
  assert.equal(
    metrics(records.map((r) => ({ ...r, status: "Rejected" }))).value,
    0,
  );
});
test("search, combined filters, numeric sorting, and unique numbering", () => {
  const r = seedRecords();
  assert.equal(
    filterRecords(r, "lighting", "Pending Review", "Electrical", "cost").length,
    1,
  );
  assert.equal(
    filterRecords(r, "nothing", "All statuses", "All trades", "updated").length,
    0,
  );
  assert.equal(
    filterRecords(r, "", "All statuses", "All trades", "cost")[0].cost,
    18650,
  );
  assert.equal(nextNumber(r), "CO-007");
  assert.equal(nextNumber([...r, { ...r[0], number: "CO-100" }]), "CO-101");
});
test("demo custom input never invents commercial details", () => {
  const source = "Move wall at grid B. No price or schedule is available.";
  const d = demoDraft(source);
  assert.equal(d.description, source);
  assert.equal(d.cost, undefined);
  assert.equal(d.mode, "demo");
  assert.equal(demoDraft(sampleEmail).cost, 12480);
});
test("model output is schema validated and invented passages are discarded", () => {
  const source = "The wall must move. CAD 40 per unit.";
  const d = verifiedDraft(
    {
      description: "The wall must move.",
      reason: "Client requested 8 extra walls.",
      subcontractor: null,
      originalScope: null,
      revisedScope: null,
      costEvidence: "CAD 40 per unit.",
      schedule: "5 day delay",
      documentation: null,
    },
    source,
  );
  assert.equal(d.description, "The wall must move.");
  assert.equal(d.reason, "Requires confirmation");
  assert.equal(d.schedule, "Requires confirmation");
  assert.equal(d.cost, null);
  assert.equal(d.costNote, "CAD 40 per unit.");
  assert.throws(() => verifiedDraft({ description: 123 }, source));
});
test("stored records reject malformed costs and statuses", () => {
  const r = seedRecords()[0];
  assert.equal(recordSchema.safeParse({ ...r, cost: Infinity }).success, false);
  assert.equal(
    recordSchema.safeParse({ ...r, status: "auto-approved" }).success,
    false,
  );
  assert.equal(recordSchema.safeParse(r).success, true);
});
test("PDF exports multipage source notes with correct review status", () => {
  const r = seedRecords()[0];
  const pdf = buildPdf({
    ...r,
    source: "Long source note for review. ".repeat(2000),
  });
  assert.ok(pdf.getNumberOfPages() > 2);
  const result = pdf.output();
  assert.ok(result.startsWith("%PDF-"));
  assert.ok(result.includes("not formally approved"));
  assert.ok(result.includes("Outstanding") || result.includes("OUTSTANDING"));
  assert.ok(!result.includes("explicitly marked Approved"));
});
