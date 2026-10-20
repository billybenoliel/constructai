import { jsPDF } from "jspdf";
import { type ChangeOrder, project, money } from "./model";
export function buildPdf(record: ChangeOrder) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20,
    width = 170;
  let y = 24;
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\x20-\x7E\n]/g, "");
  const page = () => {
    doc.addPage();
    y = 24;
  };
  const text = (value: string, size = 10, color = [51, 65, 85]) => {
    doc.setFontSize(size);
    doc.setTextColor(...(color as [number, number, number]));
    const lines = doc.splitTextToSize(
      clean(value || "Requires confirmation"),
      width,
    ) as string[];
    for (const line of lines) {
      if (y > 267) page();
      doc.text(line, margin, y);
      y += size * 0.48;
    }
    y += 4;
  };
  const section = (label: string, value: string) => {
    if (y > 247) page();
    doc.setFont("helvetica", "bold");
    text(label.toUpperCase(), 8, [76, 96, 120]);
    doc.setFont("helvetica", "normal");
    text(value);
    y += 3;
  };
  doc.setFont("helvetica", "bold");
  text("ConstructAI", 22, [18, 36, 64]);
  text("CHANGE ORDER / " + record.number, 11);
  doc.setDrawColor(210, 219, 230);
  doc.line(20, y, 190, y);
  y += 10;
  section(
    "Project",
    `${project.name} - ${project.location}\nFictional demonstration project\nGeneral contractor: ${project.contractor}\nSubcontractor: ${record.subcontractor}\nTrade: ${record.trade}`,
  );
  section(
    "Review status",
    `${record.status}${record.status === "Approved" ? " - explicitly marked Approved in the app; not an executed contract." : " - not formally approved."}\n${record.isDemo ? "FICTIONAL DEMONSTRATION RECORD. " : ""}${record.mode === "ai" ? "AI-assisted source extraction. Human review required." : record.mode === "demo" ? "Demonstration mode. Human review required." : "Manually prepared draft."}`,
  );
  section("Description of work", `${record.title}\n${record.description}`);
  section("Reason for change", record.reason);
  section("Original scope", record.originalScope);
  section("Revised scope", record.revisedScope);
  section(
    "Cost impact",
    `${record.cost === null ? "Requires confirmation" : money(record.cost) + " CAD (reviewer estimate)"}\n${record.costNote}`,
  );
  section("Schedule impact", record.schedule);
  section("Supporting documentation", record.documentation);
  section("Outstanding information", record.missing);
  section(
    "Review and authorization",
    "Prepared by: ____________________    Date: ______________\nReviewed by: ____________________    Date: ______________\nAuthorized signature: __________________________________\nApp status is a review label. Signatures and contract authorization must be obtained separately.",
  );
  section(
    "Original source notes",
    record.source || "No source notes supplied.",
  );
  const count = doc.getNumberOfPages();
  for (let n = 1; n <= count; n++) {
    doc.setPage(n);
    doc.setFontSize(8);
    doc.setTextColor(115, 128, 145);
    doc.text("ConstructAI | Review copy | Fictional project", 20, 285);
    doc.text(`${n} / ${count}`, 190, 285, { align: "right" });
  }
  return doc;
}
export function downloadPdf(record: ChangeOrder) {
  buildPdf(record).save(`${record.number}-ConstructAI.pdf`);
}
