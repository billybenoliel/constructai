import { z } from "zod";
import type { ChangeOrder } from "./model";
const quote = z
  .string()
  .max(5000)
  .nullable()
  .describe(
    "An exact, contiguous verbatim excerpt from the source, or null if absent. Never infer or paraphrase.",
  );
export const extractionSchema = z.object({
  description: quote,
  reason: quote,
  subcontractor: quote,
  originalScope: quote,
  revisedScope: quote,
  costEvidence: quote,
  schedule: quote,
  documentation: quote,
});
export function verifiedDraft(
  raw: unknown,
  source: string,
): Partial<ChangeOrder> {
  const extracted = extractionSchema.parse(raw);
  const missing: string[] = [];
  const verified = (key: keyof typeof extracted) => {
    const value = extracted[key];
    if (!value || !source.includes(value)) {
      missing.push(key.replace(/([A-Z])/g, " $1"));
      return "Requires confirmation";
    }
    return value;
  };
  const description = verified("description");
  const reason = verified("reason");
  const subcontractor = verified("subcontractor");
  const originalScope = verified("originalScope");
  const revisedScope = verified("revisedScope");
  const costNote = verified("costEvidence");
  const schedule = verified("schedule");
  const documentation = verified("documentation");
  // Keep the numeric amount unset: even a quoted number can be a unit rate, alternate,
  // subtotal, tax, or credit. The reviewer explicitly confirms the amount in the editor.
  return {
    title: "Extracted scope change",
    description,
    reason,
    subcontractor,
    originalScope,
    revisedScope,
    cost: null,
    costNote,
    schedule,
    documentation,
    missing: `Confirm the estimated CAD amount and trade. Review all source excerpts before use.${missing.length ? ` Missing or unverified: ${missing.join(", ")}.` : ""} Confirm supporting files and authorization separately.`,
    mode: "ai",
    isDemo: false,
  };
}
