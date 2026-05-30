# Source Score Dashboard

A small static dashboard that lists "sources", their "claims", and "proofs" by calling the Source Score API.

## Pages

- `index.html` — Sources: fetches `GET /sources` and shows each source's name, score, URL, and tags. Click a source to open `claims.html?source={digest}`. The selected source name is saved to `sessionStorage` as `sourceName`.
- `claims.html` — Claims: fetches `GET /source/{sourceUriDigest}/claims` and lists claim titles, URLs, checked status, and validity. Clicking a claim opens `proofs.html?claim={digest}` and stores `claimName` in `sessionStorage` for the header.
- `proofs.html` — Proofs: fetches `GET /claim/{claimUriDigest}/proofs` and shows whether the proof supports the claim, the proof URL, and who reviewed it.
- `auth.js` — Shared browser helper for fetching, caching, expiring, and applying the JWT auth headers.

## Navigation

- Use the table links to move from `index.html` → `claims.html` → `proofs.html`.
- Each link passes a SHA-256 hex digest as a query parameter (e.g. `?source=<digest>` or `?claim=<digest>`). The UI uses `encodeURIComponent()` when building these URLs.
- A Back button on `claims.html` and `proofs.html` calls `history.back()` to return to the previous page.

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
- The UI fetches a JWT with `POST /auth/token`, caches it in `localStorage`, and invalidates it after the token's JWT `ExpiresAt` time.

## Developer notes

- All user-facing data is escaped with an `escapeHtml()` helper to reduce XSS risk.
- Shared Source Score auth code lives in `auth.js` and is exposed as `window.SourceScoreAuth`.
- Path components that contain digests are URL-encoded with `encodeURIComponent()`.
- The UI uses a short refresh interval (`REFRESH_MS = 5000`) to poll the API for updates.
