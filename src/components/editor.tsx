"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  FileDown,
  Save,
  Trash2,
  ChevronDown,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { type ChangeOrder, project, statuses, trades } from "@/lib/model";
export default function Editor({
  record,
  onClose,
  onSave,
  onDelete,
}: {
  record: ChangeOrder;
  onClose: () => void;
  onSave: (r: ChangeOrder) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = useState(record);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [approval, setApproval] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(record);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = "";
    };
  }, []);
  const close = () => (dirty ? setDiscard(true) : onClose());
  const change = <K extends keyof ChangeOrder>(key: K, value: ChangeOrder[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const textField = (
    label: string,
    key:
      | "description"
      | "reason"
      | "originalScope"
      | "revisedScope"
      | "costNote"
      | "schedule"
      | "documentation"
      | "missing",
    rows = 3,
  ) => (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={draft[key]}
        maxLength={key === "description" ? 20000 : 5000}
        onChange={(e) => change(key, e.target.value)}
      />
    </label>
  );
  return (
    <dialog
      ref={dialog}
      className="editor-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="editor-title"
    >
      <div className="editor-header">
        <div>
          <span className="eyebrow">{record.number} / REVIEW & EDIT</span>
          <h2 id="editor-title">Change-order draft</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close editor"
          onClick={close}
        >
          <X size={21} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(draft);
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <div className="editor-body">
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          <div className="editor-context">
            <div>
              <FileText size={17} />
              <strong>{project.name}</strong>
              <span>Fictional project</span>
            </div>
            <p>
              {draft.mode === "demo"
                ? "Demonstration output — not live AI."
                : draft.mode === "ai"
                  ? "AI-assisted source excerpts — verify before use."
                  : "Manually prepared draft."}{" "}
              {draft.isDemo
                ? "This record contains fictional sample data."
                : ""}
            </p>
          </div>
          <div className="form-grid">
            <label className="field full">
              <span>Change description / title *</span>
              <input
                required
                maxLength={180}
                value={draft.title}
                onChange={(e) => change("title", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Trade</span>
              <select
                value={draft.trade}
                onChange={(e) =>
                  change("trade", e.target.value as ChangeOrder["trade"])
                }
              >
                {trades.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Approval status</span>
              <select
                value={draft.status}
                onChange={(e) =>
                  e.target.value === "Approved"
                    ? setApproval(true)
                    : change("status", e.target.value as ChangeOrder["status"])
                }
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>General contractor</span>
              <input readOnly value={project.contractor} />
            </label>
            <label className="field">
              <span>Subcontractor</span>
              <input
                maxLength={300}
                value={draft.subcontractor}
                onChange={(e) => change("subcontractor", e.target.value)}
              />
            </label>
          </div>
          {approval && (
            <div className="approval-confirm">
              <ShieldCheck size={20} />
              <div>
                <strong>Mark this change order approved?</strong>
                <p>
                  This records your explicit review decision. It does not create
                  a signature or contractual authorization.
                </p>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    change("status", "Approved");
                    setApproval(false);
                  }}
                >
                  Confirm approved status
                </button>
                <button
                  type="button"
                  className="button secondary-button"
                  onClick={() => setApproval(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <h3 className="form-section-title">Scope of work</h3>
          {textField("Description of proposed change", "description")}
          {textField("Reason for change", "reason", 2)}
          <div className="form-grid">
            {textField("Original scope", "originalScope")}
            {textField("Revised scope", "revisedScope")}
          </div>
          <h3 className="form-section-title">Cost & schedule</h3>
          <label className="field">
            <span>Estimated cost (CAD)</span>
            <input
              type="number"
              step="0.01"
              min="-1000000000"
              max="1000000000"
              placeholder="Unknown — requires confirmation"
              value={draft.cost ?? ""}
              onChange={(e) =>
                change(
                  "cost",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
            <small>
              Leave blank if unknown. Use a negative amount for a credit.
              Confirm currency and tax treatment.
            </small>
          </label>
          {textField("Cost basis / source evidence", "costNote", 2)}
          {textField("Schedule impact", "schedule", 2)}
          <h3 className="form-section-title">Review checklist</h3>
          {textField(
            "Supporting documentation / references",
            "documentation",
            2,
          )}
          <div className="missing-field">
            {textField(
              "Missing information requiring clarification",
              "missing",
            )}
          </div>
          <details className="source-details">
            <summary>
              Original source notes <ChevronDown size={16} />
            </summary>
            <pre>{draft.source || "No source notes supplied."}</pre>
          </details>
          <p className="review-disclaimer">
            <ShieldCheck size={15} />
            Review all facts before issuing. App status is not a contractual
            signature.
          </p>
          {deleting && (
            <div className="alert error">
              <strong>Delete {record.number}?</strong>
              <p>This removes the record from this browser.</p>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  try {
                    onDelete?.(record.id);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Confirm delete
              </button>
              <button
                type="button"
                className="button secondary-button"
                onClick={() => setDeleting(false)}
              >
                Cancel
              </button>
            </div>
          )}
          {discard && (
            <div className="alert">
              <strong>Discard unsaved changes?</strong>
              <p>Your last saved version will remain unchanged.</p>
              <button
                type="button"
                className="button danger-outline"
                onClick={onClose}
              >
                Discard changes
              </button>
              <button
                type="button"
                className="button secondary-button"
                onClick={() => setDiscard(false)}
              >
                Keep editing
              </button>
            </div>
          )}
        </div>
        <div className="editor-actions">
          {onDelete && (
            <button
              type="button"
              className="icon-button delete-button"
              aria-label="Delete change order"
              onClick={() => setDeleting(true)}
            >
              <Trash2 size={18} />
            </button>
          )}
          <span className="save-hint">
            {dirty ? "Unsaved changes" : "Review copy"}
          </span>
          <button
            type="button"
            className="button secondary-button"
            onClick={async () => {
              try {
                const { downloadPdf } = await import("@/lib/pdf");
                downloadPdf(draft);
              } catch {
                setError("PDF export failed. Please retry.");
              }
            }}
          >
            <FileDown size={16} />
            Export PDF
          </button>
          <button type="submit" className="button primary" disabled={approval}>
            <Save size={16} />
            Save change order
          </button>
        </div>
      </form>
    </dialog>
  );
}
