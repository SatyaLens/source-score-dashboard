# Source Score Dashboard

A small static dashboard that lists "sources", their "claims", and "proofs" by calling the Source Score API.

The app is intentionally lightweight: plain HTML, a shared browser auth helper, and a small Node-based test script for the auth helper.

## Pages

- `index.html` — Sources: fetches `GET /sources` and shows each source's name, score, URL, and tags. Click a source to open `claims.html?source={digest}`. The selected source name is saved to `sessionStorage` as `sourceName`.
- `claims.html` — Claims: reads `?source=<digest>`, fetches `GET /source/{sourceUriDigest}/claims`, and lists claim titles, URLs, checked status, and validity. Clicking a claim opens `proofs.html?claim={digest}` and stores `claimName` in `sessionStorage` for the header.
- `proofs.html` — Proofs: reads `?claim=<digest>`, fetches `GET /claim/{claimUriDigest}/proofs`, and shows whether the proof supports the claim, the proof URL, and who reviewed it.
- `auth.js` — Shared helper exposed as `window.SourceScoreAuth` in the browser. It fetches, caches, expires, and applies JWT auth headers.
- `tests/run.js` — Node smoke tests for JWT payload parsing and token expiry parsing.

## Navigation

- Use the table links to move from `index.html` → `claims.html` → `proofs.html`.
- Each link passes a SHA-256 hex digest as a query parameter (e.g. `?source=<digest>` or `?claim=<digest>`). The UI uses `encodeURIComponent()` when building these URLs.
- A Back button on `claims.html` and `proofs.html` calls `history.back()` to return to the previous page.
- `claims.html` and `proofs.html` show placeholder rows when required query parameters are missing.

## Backend API

- Base URL: `https://source-score.onrender.com/api/v1`
- Auth URL: `https://source-score.onrender.com/auth/token`
- Endpoints used by this UI:
  - `GET /sources`
  - `GET /source/{sourceUriDigest}/claims`
  - `GET /claim/{claimUriDigest}/proofs`
- Headers:
  - `Client-ID: web-dashboard`
  - `Authorization: Bearer <jwt>`
- The UI fetches a JWT with `POST /auth/token`, caches it in `localStorage` under `sourceScoreJwtToken`, and invalidates it when the decoded token expiry time is reached.
- `auth.js` accepts common expiry payload fields (`exp`, `ExpiresAt`, `expiresAt`, and `expires_at`) as numeric seconds, numeric milliseconds, numeric strings, or parseable date strings.
- The token request uses `AbortSignal.timeout(90000)` so auth calls do not hang indefinitely in supported browsers.

## Run Locally

Start a static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

Do not rely on opening the HTML files directly from disk; the shared `auth.js` script and remote API calls are best exercised through a local server.

## Test

Run the auth helper tests with:

```bash
npm test
```

Manual smoke test:

1. Open `http://localhost:8000/`.
2. Confirm sources load.
3. Click a source to open claims.
4. Click a claim to open proofs.

## Developer notes

- All user-facing data is escaped with an `escapeHtml()` helper to reduce XSS risk.
- Shared Source Score auth code lives in `auth.js` and is exposed as `window.SourceScoreAuth`.
- `auth.js` also exports `parseJwtPayload` and `getTokenExpiresAt` under CommonJS for the Node test runner.
- Path components that contain digests are URL-encoded with `encodeURIComponent()`.
- The UI uses a short refresh interval (`REFRESH_MS = 5000`) to poll the API for updates.
