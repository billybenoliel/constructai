"use client";
import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  HardHat,
  MapPin,
  Layers3,
  CircleHelp,
} from "lucide-react";
import {
  project,
  statuses,
  trades,
  money,
  metrics,
  filterRecords,
  nextNumber,
  blankRecord,
  sampleEmail,
  seedRecords,
  recordSchema,
  type ChangeOrder,
} from "@/lib/model";
import { useRecords, persistRecords, STORAGE_KEY } from "@/lib/store";
import Editor from "./editor";
type View = "overview" | "projects" | "orders" | "create" | "settings";
const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "orders", label: "Change Orders", icon: FileText },
  { id: "create", label: "Create Change Order", icon: Plus },
] as const;
export function Badge({ status }: { status: ChangeOrder["status"] }) {
  return (
    <span className={`badge badge-${status.toLowerCase().replace(" ", "-")}`}>
      <i />
      {status}
    </span>
  );
}
export default function Workspace() {
  const { records, ready, error: storageError } = useRecords();
  const [view, setView] = useState<View>("overview");
  const [mobile, setMobile] = useState(false);
  const [editing, setEditing] = useState<ChangeOrder | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [trade, setTrade] = useState("All trades");
  const [sort, setSort] = useState("updated");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"demo" | "ai" | "unknown">("unknown");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const m = metrics(records);
  useEffect(() => {
    const read = () => {
      const key = location.hash.slice(1);
      if (
        ["overview", "projects", "orders", "create", "settings"].includes(key)
      )
        setView(key as View);
    };
    read();
    window.addEventListener("hashchange", read);
    fetch("/api/generate")
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "ai" ? "ai" : "demo"))
      .catch(() => setMode("unknown"));
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(v: View) {
    setView(v);
    location.hash = v;
    setMobile(false);
    setError("");
  }
  function save(record: ChangeOrder) {
    try {
      const parsed = recordSchema.parse(record);
      const current = records.find((r) => r.id === record.id);
      const saved = {
        ...parsed,
        number: current?.number ?? nextNumber(records),
        updatedAt: new Date().toISOString(),
      };
      persistRecords(
        current
          ? records.map((r) => (r.id === saved.id ? saved : r))
          : [saved, ...records],
      );
      setEditing(null);
      setNotice(`${saved.number} saved in this browser.`);
      navigate("orders");
    } catch {
      throw new Error(
        "Could not save. Check the fields and browser storage availability.",
      );
    }
  }
  function remove(id: string) {
    try {
      persistRecords(records.filter((r) => r.id !== id));
      setEditing(null);
      setNotice("Change order deleted.");
    } catch {
      throw new Error(
        "Could not delete the record. Browser storage may be unavailable.",
      );
    }
  }
  async function generate() {
    setError("");
    setGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, source: notes }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Generation failed. Please retry.");
      const record = recordSchema.parse({
        ...blankRecord(nextNumber(records), notes),
        ...data.draft,
        status: "Draft",
        source: notes,
      });
      setEditing(record);
      setMode(data.mode);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to generate a draft. Your source notes have been preserved.",
      );
    } finally {
      setGenerating(false);
    }
  }
  const filtered = filterRecords(records, query, filter, trade, sort);
  const table = (compact = false) => (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {compact ? "Recent change orders" : "All change orders"}{" "}
            <span className="count">
              {compact ? records.length : filtered.length}
            </span>
          </h2>
          {compact && <p>Keep every scope change in sight.</p>}
        </div>
        {compact && (
          <button className="text-button" onClick={() => navigate("orders")}>
            View all orders <ArrowRight size={15} />
          </button>
        )}
      </div>
      {!compact && (
        <div className="table-toolbar">
          <label className="search">
            <Search size={17} />
            <input
              aria-label="Search change orders"
              placeholder="Search orders, trades, or descriptions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All statuses", ...statuses].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Filter trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
          >
            {["All trades", ...trades].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Sort orders"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="cost">Highest cost</option>
            <option value="number">Order number</option>
          </select>
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Change order</th>
              <th>Project / trade</th>
              <th>Estimated cost</th>
              <th>Status</th>
              <th>Last updated</th>
              <th>
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(compact
              ? filterRecords(
                  records,
                  "",
                  "All statuses",
                  "All trades",
                  "updated",
                ).slice(0, 5)
              : filtered
            ).map((r) => (
              <tr key={r.id}>
                <td>
                  <button className="order-link" onClick={() => setEditing(r)}>
                    <span className="order-ref">
                      {r.number} {r.isDemo && <small>DEMO</small>}
                    </span>
                    <strong>{r.title}</strong>
                    <span className="description-preview">{r.description}</span>
                  </button>
                </td>
                <td>
                  <span className="project-cell">Harbourview Towers</span>
                  <span className="secondary">{r.trade}</span>
                </td>
                <td className="amount">
                  {r.cost === null ? (
                    <span className="unconfirmed">To confirm</span>
                  ) : (
                    money(r.cost)
                  )}
                  <span className="secondary">CAD</span>
                </td>
                <td>
                  <Badge status={r.status} />
                </td>
                <td className="date-cell">
                  {new Date(r.updatedAt).toLocaleDateString("en-CA", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Open ${r.number}`}
                    onClick={() => setEditing(r)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(compact ? records : filtered).length === 0 && (
        <div className="empty">
          <FileText />
          <h3>No change orders found</h3>
          <p>
            {records.length
              ? "Try another search or filter."
              : "Create a draft to start documenting changes."}
          </p>
          <button
            className="button secondary-button"
            onClick={() =>
              records.length
                ? (setQuery(""),
                  setFilter("All statuses"),
                  setTrade("All trades"))
                : navigate("create")
            }
          >
            {records.length ? "Clear filters" : "Create change order"}
          </button>
        </div>
      )}
      <div className="table-footer">
        <span>
          {compact ? Math.min(5, records.length) : filtered.length} of{" "}
          {records.length} change orders
        </span>
        <span>
          All amounts in CAD <span className="dot">·</span> Estimates require
          review
        </span>
      </div>
    </section>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          aria-label="Close navigation overlay"
          className="nav-overlay"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <a
          href="#overview"
          onClick={() => navigate("overview")}
          className="brand"
        >
          <span className="brand-mark">
            <Layers3 size={23} />
          </span>
          Construct<span>AI</span>
        </a>
        <button
          className="workspace-switch"
          onClick={() => navigate("projects")}
        >
          <span className="workspace-avatar">
            <HardHat size={18} />
          </span>
          <span>
            Demo workspace<small>Construction management</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={`nav-item ${view === n.id ? "active" : ""}`}
              aria-current={view === n.id ? "page" : undefined}
            >
              <n.icon size={18} />
              {n.label}
              {n.id === "orders" && (
                <span className="nav-count">{records.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="note-icon">
              <ShieldCheck size={18} />
            </span>
            <strong>Your browser. Your workspace.</strong>
            <p>Records are saved on this device. No account required.</p>
            <button onClick={() => navigate("settings")}>
              About this demo <ArrowUpRight size={13} />
            </button>
          </div>
          <button
            className={`nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings2 size={18} />
            Settings
          </button>
          <div className="user">
            <span>PM</span>
            <div>
              Project manager<small>Demonstration workspace</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {view === "orders"
                ? "Change Orders"
                : view === "create"
                  ? "Create Change Order"
                  : view.charAt(0).toUpperCase() + view.slice(1)}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span />
              Demo workspace
            </span>
            <button
              className="icon-button"
              aria-label="Workspace information"
              onClick={() => navigate("settings")}
            >
              <CircleHelp size={18} />
            </button>
            <span className="avatar">PM</span>
          </div>
        </header>
        <main id="main-content">
          <div className="demo-banner">
            <span>
              <span className="banner-dot" />
              Fictional project. Real workflow.
            </span>
            <p>
              Explore ConstructAI with demonstration data. Records stay in this
              browser.
            </p>
          </div>
          {(error || storageError) && (
            <div role="alert" className="alert error">
              {error || storageError}
            </div>
          )}
          {!ready ? (
            <div className="empty">Loading your workspace…</div>
          ) : (
            <>
              {view === "overview" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">YOUR PROJECTS, IN FOCUS</div>
                      <h1>Project overview</h1>
                      <p>
                        A clear picture of every change. Nothing lost in the
                        details.
                      </p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => navigate("create")}
                    >
                      <Plus size={18} />
                      Create change order
                    </button>
                  </div>
                  <div className="stats">
                    <Stat
                      label="Total change orders"
                      value={String(m.total)}
                      icon={<FileText />}
                      detail="Across your demo project"
                    />
                    <Stat
                      label="Pending review"
                      value={String(m.pending)}
                      icon={<Clock3 />}
                      detail="Ready for your attention"
                      accent="amber"
                    />
                    <Stat
                      label="Approved"
                      value={String(m.approved)}
                      icon={<ShieldCheck />}
                      detail="Marked approved in workspace"
                      accent="green"
                    />
                    <Stat
                      label="Documented change value"
                      value={money(m.value)}
                      icon={<span className="dollar">$</span>}
                      detail={`CAD · excludes rejected${m.unknown ? ` · ${m.unknown} unpriced` : ""}`}
                      accent="blue"
                    />
                  </div>
                  <div className="overview-middle">
                    <section className="feature-card">
                      <div className="feature-copy">
                        <span className="feature-label">
                          <Sparkles size={15} />
                          LESS ADMIN. MORE BUILDING.
                        </span>
                        <h2>
                          From site notes
                          <br />
                          to a clear next step.
                        </h2>
                        <p>
                          Bring the email, quote, or scope change.
                          <br />
                          Leave with a draft ready to review.
                        </p>
                        <button
                          className="button light-button"
                          onClick={() => navigate("create")}
                        >
                          Draft a change order <ArrowRight size={17} />
                        </button>
                      </div>
                      <div className="document-art" aria-hidden="true">
                        <div className="art-tab">
                          <Check size={12} />
                          Ready for review
                        </div>
                        <div className="art-paper">
                          <div className="art-wordmark">
                            <Layers3 size={15} />
                            ConstructAI
                          </div>
                          <small>CHANGE ORDER</small>
                          <strong>CO-007</strong>
                          <div className="art-rule" />
                          <i />
                          <i />
                          <i />
                          <div className="art-fields">
                            <span>
                              SCOPE<em>Documented</em>
                            </span>
                            <span>
                              STATUS<em>Draft</em>
                            </span>
                          </div>
                          <div className="art-check">
                            <ShieldCheck size={13} />
                            Clarity at every step
                          </div>
                        </div>
                      </div>
                    </section>
                    <section className="panel status-card">
                      <div className="panel-heading">
                        <h2>Status breakdown</h2>
                        <span className="muted">{m.total} total</span>
                      </div>
                      <div className="status-stack">
                        {statuses.map((s) => {
                          const n = records.filter(
                            (r) => r.status === s,
                          ).length;
                          return (
                            <span
                              key={s}
                              className={`segment-${s.replace(" ", "-")}`}
                              style={{ flex: n || 0.001 }}
                              title={`${s}: ${n}`}
                            />
                          );
                        })}
                      </div>
                      <div className="status-list">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setFilter(s);
                              navigate("orders");
                            }}
                          >
                            <Badge status={s} />
                            <strong>
                              {records.filter((r) => r.status === s).length}
                            </strong>
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                  {table(true)}
                  <div className="bottom-grid">
                    <section className="panel project-summary">
                      <div className="panel-heading">
                        <h2>Active project</h2>
                        <button
                          className="text-button"
                          onClick={() => navigate("projects")}
                        >
                          View project <ArrowUpRight size={15} />
                        </button>
                      </div>
                      <div className="project-summary-content">
                        <div className="building-icon">
                          <Building2 size={30} />
                        </div>
                        <div>
                          <h3>{project.name}</h3>
                          <p>
                            <MapPin size={13} />
                            {project.location} <span>·</span> Residential
                            high-rise
                          </p>
                          <span className="tag">
                            Fictional demonstration project
                          </span>
                        </div>
                      </div>
                    </section>
                    <section className="panel activity">
                      <div className="panel-heading">
                        <h2>Recent activity</h2>
                        <Clock3 size={16} />
                      </div>
                      {filterRecords(
                        records,
                        "",
                        "All statuses",
                        "All trades",
                        "updated",
                      )
                        .slice(0, 3)
                        .map((r) => (
                          <button key={r.id} onClick={() => setEditing(r)}>
                            <span className="activity-dot" />
                            <span>
                              <strong>{r.number}</strong> · {r.status}
                              <small>{r.title}</small>
                            </span>
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      {!records.length && <p>No saved changes yet.</p>}
                    </section>
                  </div>
                </>
              )}
              {view === "orders" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">THE CHANGE REGISTER</div>
                      <h1>Change orders</h1>
                      <p>Every scope change, organized and ready for review.</p>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => navigate("create")}
                    >
                      <Plus size={18} />
                      Create change order
                    </button>
                  </div>
                  {table()}
                </>
              )}
              {view === "projects" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">YOUR PROJECT PORTFOLIO</div>
                      <h1>Projects</h1>
                      <p>A shared context for every scope change.</p>
                    </div>
                    <span className="tag">1 demonstration project</span>
                  </div>
                  <section className="project-detail panel">
                    <div className="project-visual">
                      <div className="tower tower-one" />
                      <div className="tower tower-two" />
                      <span>HARBOURVIEW / TORONTO</span>
                    </div>
                    <div className="project-info">
                      <span className="tag">
                        FICTIONAL DEMONSTRATION PROJECT
                      </span>
                      <h2>{project.name}</h2>
                      <p>
                        <MapPin size={16} />
                        {project.location}
                      </p>
                      <p>
                        {project.description} All names, estimates, scope
                        changes, and approvals in the sample records are
                        fictional.
                      </p>
                      <div className="project-facts">
                        <div>
                          <small>GENERAL CONTRACTOR</small>
                          <strong>{project.contractor}</strong>
                        </div>
                        <div>
                          <small>CHANGE ORDERS</small>
                          <strong>{m.total} documented</strong>
                        </div>
                        <div>
                          <small>DOCUMENTED VALUE</small>
                          <strong>{money(m.value)} CAD</strong>
                        </div>
                      </div>
                      <button
                        className="button primary"
                        onClick={() => {
                          setFilter("All statuses");
                          navigate("orders");
                        }}
                      >
                        View change orders <ArrowRight size={16} />
                      </button>
                    </div>
                  </section>
                </>
              )}
              {view === "create" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">FROM INFORMATION TO ACTION</div>
                      <h1>Create a change order</h1>
                      <p>
                        Start with the source. Review every detail before it
                        moves forward.
                      </p>
                    </div>
                    <span className="tag">
                      <Sparkles size={14} />
                      {mode === "ai"
                        ? "Live AI extraction"
                        : mode === "demo"
                          ? "Demonstration mode"
                          : "Checking generation mode"}
                    </span>
                  </div>
                  <div className="create-grid">
                    <section className="panel source-panel">
                      <div className="section-step">
                        <span>1</span>
                        <div>
                          <h2>Add your source information</h2>
                          <p>
                            Paste a subcontractor email, site note, or revised
                            quote.
                          </p>
                        </div>
                      </div>
                      <label className="field">
                        <span>Project</span>
                        <select defaultValue={project.id}>
                          <option value={project.id}>
                            {project.name} — Toronto (Demo)
                          </option>
                        </select>
                      </label>
                      <div className="source-label">
                        <label htmlFor="source-notes">
                          Source notes <span className="required">*</span>
                        </label>
                        <button
                          className="text-button"
                          onClick={() => setNotes(sampleEmail)}
                        >
                          <FileText size={14} />
                          Use sample email
                        </button>
                      </div>
                      <textarea
                        id="source-notes"
                        className="notes-input"
                        maxLength={20000}
                        placeholder={
                          "Hi team,\n\nFollowing the latest coordination meeting, we need to revise…\n\nPaste your source here. Include any quoted costs, drawing references, or schedule details."
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <div className="input-caption">
                        <span>
                          20–20,000 characters · Original notes are preserved
                        </span>
                        <span>{notes.length.toLocaleString()} / 20,000</span>
                      </div>
                      <div className="mode-note">
                        <Sparkles size={17} />
                        <p>
                          {mode === "demo" ? (
                            <>
                              Demo mode uses a deterministic draft for the
                              sample email. For your own notes, it preserves the
                              text and flags details for manual confirmation.{" "}
                              <strong>No AI is running.</strong>
                            </>
                          ) : mode === "ai" ? (
                            <>
                              Live AI extracts source-backed passages. Notes are
                              sent to the configured model provider. Costs
                              remain unconfirmed until you enter them.
                            </>
                          ) : (
                            <>
                              Generation mode will be shown with your draft.
                              Notes are preserved if the service is unavailable.
                            </>
                          )}
                        </p>
                      </div>
                      <div className="source-actions">
                        <button
                          className="button secondary-button"
                          disabled={generating || notes.trim().length < 20}
                          onClick={() =>
                            setEditing({
                              ...blankRecord(nextNumber(records), notes),
                              description: notes,
                            })
                          }
                        >
                          Create manually
                        </button>
                        <button
                          className="button primary"
                          disabled={generating || notes.trim().length < 20}
                          onClick={generate}
                        >
                          <Sparkles size={17} />
                          {generating
                            ? "Preparing your draft…"
                            : "Generate Change Order"}
                        </button>
                      </div>
                    </section>
                    <aside className="create-aside">
                      <div className="review-preview">
                        <div className="preview-icon">
                          <FileText size={25} />
                        </div>
                        <h3>A draft you can work with.</h3>
                        <p>
                          Your information becomes a structured review document.
                        </p>
                        {[
                          "Proposed scope and reason",
                          "Original vs. revised scope",
                          "Cost and schedule impacts",
                          "Missing information checklist",
                          "Original source for reference",
                        ].map((s) => (
                          <div key={s}>
                            <Check size={15} />
                            {s}
                          </div>
                        ))}
                      </div>
                      <div className="principle">
                        <ShieldCheck size={21} />
                        <h3>Clarity without assumptions.</h3>
                        <p>
                          Missing details stay missing. Every draft starts
                          unapproved, with uncertainties flagged for your
                          review.
                        </p>
                      </div>
                      <div className="workflow-steps">
                        <span className="current">1. Add source</span>
                        <ChevronRight size={13} />
                        <span>2. Review & edit</span>
                        <ChevronRight size={13} />
                        <span>3. Save & export</span>
                      </div>
                    </aside>
                  </div>
                </>
              )}
              {view === "settings" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">WORKSPACE PREFERENCES</div>
                      <h1>Settings</h1>
                      <p>
                        Understand your workspace and keep a copy of your work.
                      </p>
                    </div>
                  </div>
                  <section className="panel settings-panel">
                    <h2>Local browser storage</h2>
                    <p>
                      Change orders are saved only in this browser on this
                      device. They are not synced, backed up to a server, or
                      shared with other users. Clearing browser data removes
                      them.
                    </p>
                    <button
                      className="button secondary-button"
                      onClick={() => {
                        try {
                          const raw =
                            localStorage.getItem(STORAGE_KEY) ||
                            JSON.stringify(records);
                          const url = URL.createObjectURL(
                            new Blob([raw], { type: "application/json" }),
                          );
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "constructai-backup.json";
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        } catch {
                          setError(
                            "Backup could not be downloaded. Check browser storage permissions.",
                          );
                        }
                      }}
                    >
                      <ArrowDownToLine size={16} />
                      Download data backup
                    </button>
                    <hr />
                    <h2>Generation mode</h2>
                    <p>
                      {mode === "ai"
                        ? "Live AI extraction is configured. Source notes are sent to the model provider when you generate a draft."
                        : "Demonstration mode is active. Sample email outputs are deterministic; custom notes require manual review."}{" "}
                      Every draft requires human review. API credentials are
                      configured on the server, never in this browser.
                    </p>
                    <hr />
                    <h2>Demonstration data</h2>
                    <p>
                      Harbourview Towers, its contractors, and all seeded change
                      orders are fictional. Approved demo records are sample
                      statuses, not actual approvals.
                    </p>
                    {!reset ? (
                      <button
                        className="button danger-outline"
                        onClick={() => setReset(true)}
                      >
                        Reset demo workspace
                      </button>
                    ) : (
                      <div className="reset-confirm">
                        <p>
                          This replaces all saved change orders with the
                          original sample records. Download a backup first.
                        </p>
                        <button
                          className="button danger"
                          onClick={() => {
                            try {
                              persistRecords(seedRecords());
                              setReset(false);
                              setNotice("Demo workspace reset.");
                            } catch {
                              setError(
                                "Reset failed. Browser storage is unavailable.",
                              );
                            }
                          }}
                        >
                          Replace all records
                        </button>
                        <button
                          className="button secondary-button"
                          onClick={() => setReset(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
          <footer className="footer">
            <span>
              <Layers3 size={13} />
              ConstructAI <span>·</span> Change orders, made clear.
            </span>
            <span>Built for the way construction works.</span>
          </footer>
        </main>
      </div>
      {editing && (
        <Editor
          key={editing.id}
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={
            records.some((r) => r.id === editing.id) ? remove : undefined
          }
        />
      )}{" "}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
function Stat({
  label,
  value,
  detail,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <section className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${accent}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </section>
  );
}
