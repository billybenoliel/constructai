# ConstructAI

A Next.js MVP for turning construction communications into reviewable change orders. Built with TypeScript, Tailwind CSS, Lucide, Zod, the Vercel AI SDK, and jsPDF.

## Run locally

Requires Node.js 22+ (24 recommended) and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:3000. If a restricted macOS environment blocks file watchers, use `pnpm build` followed by `pnpm start` to preview the production build.

## What works

- Overview metrics computed from the same records as the change register.
- Search, status/trade filters, and updated/cost/reference sorting.
- Create → review → edit → save → reopen → PDF export.
- Draft, Pending Review, Approved, and Rejected states. Approval requires explicit confirmation.
- Cost credits, unknown amounts, original source notes, supporting-document references, and missing-information checklist.
- Schema-validated local browser persistence, JSON backup, deletion, and confirmed demo reset.
- Responsive desktop, tablet, and mobile layouts; keyboard-accessible native dialog.

Harbourview Towers, Northline Construction, subcontractors, sample costs, and seeded approvals are fictional. The project is intentionally a single-project MVP. Project creation, file uploads, signatures, authentication, payments, and server storage are not included.

## Persistence and metrics

Records live in localStorage under `constructai.records.v1`. They are not shared between browsers or devices. Clearing browser data removes them. The Settings page downloads a JSON backup (restore/import is a future enhancement). Corrupt storage is reported rather than silently overwritten.

Documented value sums all known amounts except Rejected orders, includes negative credits, and separately identifies unpriced records. It is an estimate register, not a contract total. Initial sample totals: 6 orders, 2 pending, 2 approved, CAD 38,030, and 1 unpriced record. Recent activity shows the last saved state, not a full audit history.

## Demonstration mode vs. live AI

With no `AI_GATEWAY_API_KEY`, generation is **deterministic demonstration mode**. The supplied sample email has a fixed structured result. Arbitrary notes are preserved without invented interpretation; all commercial details stay unconfirmed. The UI and PDF label this explicitly.

To enable live generation, set these server-side environment variables in the Vercel project's Settings → Environment Variables, then redeploy:

| Variable             | Purpose                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY` | Secret Vercel AI Gateway key. Its presence enables live generation.                                           |
| `AI_GATEWAY_MODEL`   | Optional provider/model ID. Defaults to `openai/gpt-5.6-luna`, verified in the catalog during implementation. |

For local testing, copy `.env.example` to `.env.local` and configure the secret there. Never use a `NEXT_PUBLIC_` prefix, commit secrets, or paste keys into source. Provider API keys are not interchangeable with a Gateway key. Automatic Vercel OIDC alone does not activate live mode; this keeps the demo from incurring model usage unexpectedly.

The server uses `generateText` with `Output.object` and a Zod schema. It asks for exact source excerpts and independently discards any passage that is not present in the submitted notes. Numerical cost stays blank even with quoted evidence, because a quoted figure can be a unit rate, alternate, subtotal, or credit. The reviewer confirms the total and trade. No AI-supplied status is accepted. Missing or malformed output returns a helpful error, never silently disguised sample output. Input length, same-origin browser requests, retries, and request timeout are bounded.

Live AI was not exercised without a configured key. Before enabling it for unrestricted public use, configure a Gateway spending budget and add durable rate limiting/access controls; the MVP deliberately has no authentication. Source notes are sent to the configured model provider only in live mode.

## PDF export

The client generates a multipage A4 review copy with project/trade details, scope, cost, schedule, references, outstanding questions, signature blanks, and original notes. The selected app status is shown, but it is explicitly not contractual authorization. Missing values stay unconfirmed. PDF text uses a normalized Latin/ASCII font path; full international font coverage is a future improvement. Export reflects the current editor contents, including unsaved edits; save separately to retain them.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
# In a second terminal:
pnpm exec playwright install chromium
pnpm test:e2e
```

Set `BASE_URL` to test a different running deployment. Optionally set `PLAYWRIGHT_CHROME_PATH` for an installed Chrome executable. Tests cover totals, filtering, unknown costs, schema rejection, source provenance, multipage PDF generation, and the complete browser workflow. GitHub CI runs checks plus Chromium end-to-end tests against the production build.

## Deployment

Vercel project: `constructai`, framework: Next.js, Node 24, repository: `billybenoliel/constructai`. Install with `pnpm install --frozen-lockfile`, build with `pnpm build`, and keep the default Next.js output settings. The production branch is `main`.

## Architecture

- `src/lib/model.ts`: data schema, sample project, metrics, filtering, deterministic drafts.
- `src/lib/extraction.ts`: strict source-evidence validation.
- `src/lib/store.ts`: versioned browser persistence and cross-tab updates.
- `src/lib/pdf.ts`: paginated review document generation.
- `src/app/api/generate/route.ts`: server-only model integration and demo fallback.
- `src/components/workspace.tsx`: dashboard, project, register, generator, settings.
- `src/components/editor.tsx`: editable review dialog and explicit approval.

## Next three improvements

1. Team accounts and shared project storage with durable backups and audit history.
2. Document/email ingestion with linked evidence, attachments, and richer extraction evaluation.
3. Multi-party approval routing, permissions, signatures, and cost/schedule reporting.
