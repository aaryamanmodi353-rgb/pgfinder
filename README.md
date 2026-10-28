# PG Finder Ops Console

A synthetic-data companion workspace for the CallKaro AI FDE assignment. It includes a Next.js operations console and an Express API for PG Finder visitor context, metadata previews, call evidence, webhook results, and scenario readiness. It does not place live calls.

## Run locally

Requires Node.js 20 or newer. The default run uses in-memory storage and needs no database.

```sh
cp .env.example .env
npm install
npm run dev:all
```

The console listens on `http://localhost:3001`. The API listens on `http://localhost:3000`; visit `/api/docs` for the OpenAPI UI and `/api/v1/health` for a health check. Next.js proxies `/api/v1` requests to the API, so local browser requests need no separate API key or CORS setup. Data is reset when the in-memory process restarts.

For persistent storage, set `MONGO_URI` in `.env` to a MongoDB connection string. Docker Compose starts the console, API, and MongoDB:

```sh
docker compose up --build
```

Open `http://localhost:3001` for the console or `http://localhost:3000/api/docs` for the API docs. To run one process, use `npm run dev` for the API or `npm run dev:web` for the frontend.

## API outline

All application endpoints are under `/api/v1`.

- Visitors: create, list, read, patch, delete, seed 14 synthetic scenarios, and preview agent metadata.
- Call attempts: prepare an attempt from a visitor, list/read attempts, and attach a recording URL or filename with notes.
- Webhook: persist the untouched JSON payload, then map it only when a verified mapping is configured.
- Results: list/read mapped results and apply call corrections with audit entries.
- Scenarios: view 14 fixtures and record each review as not run/passed/failed with evidence. These are rehearsal records, not automatic executions.
- Acceptance checklist: inspect and update implementation acceptance evidence.
- Submission checklist: exactly three items - recordings, CallKaro account email, and exact agent name.

## CallKaro integration boundary

The available assignment material does not specify CallKaro's metadata envelope, variable syntax, webhook shape, signature scheme, or endpoint details. The integration therefore makes no live CallKaro requests and does not claim those formats are verified.

- `config/callkaro.variables.json` holds the metadata envelope key and semantic-to-provider variable-name map. It is blank by default so no provider syntax is guessed. Configure it from `docs.callkaro.ai` before using the payload with the platform.
- `config/callkaro.payload.json` is deliberately unconfigured. After verifying the webhook schema, set its JSON paths for call ID, visitor ID, and result object. Until then webhook deliveries are safely stored as `received_unmapped`.
- A shared secret is checked in `x-callkaro-secret` when `CALLKARO_WEBHOOK_SECRET` is set. No undocumented signature is assumed.
- `CallProvider` is explicitly disabled through `NotImplementedProvider`; live outbound calling requires verified documentation and separate approval.

## Implemented / Deferred

| Implemented                                                                                                                                  | Deferred                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Synthetic visitor fixtures, null-safe metadata previews, scenario evidence, readiness and submission screens                                 | Live outbound calls and any phone-number dialing integration                           |
| In-memory demo store and Mongoose-backed MongoDB store                                                                                       | Actual CallKaro webhook mapping until provider field paths are verified and configured |
| Raw webhook persistence, payload-hash idempotency, result validation, correction audit trail                                                 | CallKaro signature verification until an official signature scheme is documented       |
| Responsive Next.js console, masked phone review, local theme preference, API proxy, request IDs, logging, rate limits, Helmet, CORS, OpenAPI | Provider-specific payload configuration until verified from official documentation     |

## Assumptions to verify against docs.callkaro.ai

1. The metadata payload envelope key and accepted value types.
2. The provider variable names in `config/callkaro.variables.json` and whether omitted missing values are accepted.
3. The webhook's field paths, call ID field, visitor correlation mechanism, and the exact post-call result shape before populating `config/callkaro.payload.json`.
4. Whether CallKaro signs webhook requests and, if so, the documented signature header and verification algorithm. Until confirmed, the API uses the optional shared-secret header.
5. No CallKaro HTTP endpoints, live call behavior, undocumented field names, or provider-specific payload syntax are assumed or implemented.

## Tests and quality commands

```sh
npm test
npm run test:frontend
npm run test:e2e
npm run typecheck:web
npm run coverage
npm run build
npm run lint
npm run format:check
```

The suites cover backend workflows, key frontend components, and a Playwright browser smoke path. The coverage command enforces at least 85% lines, functions, and statements for service files (and 80% branches).

## Accessibility and responsive review

- Navigation landmarks and form controls have accessible names; keyboard focus is visible.
- Dialogs use Radix focus management, and reduced-motion preferences are respected.
- Phone values stay masked until the reviewer chooses to reveal them.
- Tables scroll horizontally on narrow screens, and the primary navigation changes to a bottom bar on mobile.
- Theme choice is stored locally and respects the operating-system preference on first visit.

## Safety and data handling

All bundled fixtures are synthetic. Visitor source is always `synthetic`. Missing strings such as blank, `NA`, `N/A`, `null`, `none`, and `-` are treated as missing; no demographic preference is inferred. Callback requests are never marked scheduled. A result can be completed only when the qualification fields are captured or explicitly unknown/declined, and unsuccessful call outcomes cannot be completed. Summary phone-number sequences are redacted before storage, and request logging does not include request bodies.
