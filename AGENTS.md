# AGENTS.md

Purpose
-------
This repository is a small static dashboard that lists "sources", their "claims", and "proofs" by calling the Source Score API. The frontend is plain HTML + JavaScript, with a small Node test script for shared auth helpers.

Primary files:

- index.html
- claims.html
- proofs.html
- auth.js
- tests/run.js
- package.json

This document tells automated agents (and human contributors) how to make safe, targeted changes, how to run and test the site locally, and which best practices to follow.

What This Repo Does
--------------------
- Loads the list of sources from `https://source-score.onrender.com/api/v1/sources`.
- When the user selects a source the UI navigates to `claims.html?source={digest}` and calls `/api/v1/source/{sourceUriDigest}/claims`.
- When a claim is selected the UI navigates to `proofs.html?claim={digest}` and calls `/api/v1/claim/{claimUriDigest}/proofs`.
- Before API calls, `auth.js` fetches a JWT from `https://source-score.onrender.com/auth/token`, caches it in `localStorage`, and adds `Client-ID` plus bearer auth headers.

Agent Responsibilities / Conventions
----------------------------------
- Keep changes small and focused. Prefer a single intent per commit/PR.
- Use `apply_patch` to edit files. Avoid wholesale refactors unless requested.
- Update this file and `README.md` when you change behavior, auth, testing, or add pages.
- When modifying API calls, ensure path components that contain digests are URL-encoded with `encodeURIComponent(digest)`.
- Always escape user-facing data before inserting into the DOM (the codebase uses an `escapeHtml()` helper pattern).
- Keep shared API authentication logic in `auth.js` and call it through `window.SourceScoreAuth`.
- Keep Node-testable auth parsing helpers exported from `auth.js` via CommonJS when changing token parsing.
- When adding pages, place them alongside the existing HTML files and add a visible navigation path from an existing page.
- Keep the UI simple and minimalistic.

Run & Test Locally (quick)
--------------------------
1. From the repository root, start a static server (Python example):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

2. Manual flow to verify:

- Open `index.html` in a browser served by the local server.
- Click a source's "View claims" button to open `claims.html` for that source.
- Click a claim's "View proofs" button to open `proofs.html` for that claim.

3. Run the auth helper tests:

```bash
npm test
```

4. Example curl commands (for debugging the API directly):

```bash
TOKEN=$(curl -s -X POST -H "Client-ID: web-dashboard" "https://source-score.onrender.com/auth/token" | jq -r .token)
curl -H "Client-ID: web-dashboard" -H "Authorization: Bearer $TOKEN" "https://source-score.onrender.com/api/v1/sources"
# compute a digest for a URI in the shell (Linux):
printf 'https://example.com/path' | sha256sum | cut -d' ' -f1
curl -H "Client-ID: web-dashboard" -H "Authorization: Bearer $TOKEN" "https://source-score.onrender.com/api/v1/source/<digest>/claims"
curl -H "Client-ID: web-dashboard" -H "Authorization: Bearer $TOKEN" "https://source-score.onrender.com/api/v1/claim/<digest>/proofs"
```

API Summary
-----------
- Base: `https://source-score.onrender.com/api/v1`
- Endpoints used by this UI:
  - `GET /sources`
  - `GET /source/{sourceUriDigest}/claims`
  - `GET /claim/{claimUriDigest}/proofs`
- Auth endpoint: `POST https://source-score.onrender.com/auth/token`
- Headers:
  - `Client-ID: web-dashboard`
  - `Authorization: Bearer <jwt>` for API endpoints after fetching the token.
- Token cache key: `sourceScoreJwtToken` in `localStorage`.
- Token expiry is decoded in `auth.js`; current parsing accepts `exp`, `ExpiresAt`, `expiresAt`, and `expires_at` as seconds, milliseconds, numeric strings, or parseable date strings.
- Auth token fetches use `AbortSignal.timeout(90000)`.

Error Handling and Resilience
----------------------------
- Show friendly messages when the API is unreachable or returns non-OK HTTP statuses.
- Avoid breaking the entire page when one fetch fails; show placeholder rows or a clear error message in the table.
- Current pages show explicit placeholder rows for missing query params and authentication failure.
- Consider adding exponential backoff if the API is rate-limited.

Coding & Style Notes
--------------------
- Keep JavaScript minimal and readable. This repo prefers small helper functions (e.g. `escapeHtml`, `sha256hex`) over heavy frameworks.
- Use `encodeURIComponent()` for URL path segments that may contain special characters.
- Prefer `crypto.subtle.digest('SHA-256', ...)` in browser code for digest generation; for shell-based tools use `sha256sum`.
- Keep `auth.js` usable in both browser and Node contexts; avoid browser-only top-level assumptions outside the guarded browser branch.

Testing Guidance
----------------
- Run `npm test` after changes to `auth.js` or token parsing.
- Manual smoke test described in "Run & Test Locally" is sufficient for small UI-only changes.
- If the API is flaky, add JSON fixtures under `/mocks/` and toggle the UI to load mocks for CI or demo purposes.

Commit / PR Practices
---------------------
- Branch: use `feat/summary` or `fix/summary` style names.
- Commit messages: follow conventional style: `feat:`, `fix:`, `chore:`.
- PR description: include how to run locally, a short summary of changes, and a screenshot (when UI changes).

Agent Workflow Checklist (short)
--------------------------------
1. Create a focused branch.
2. Use `apply_patch` to make the smallest working change.
3. Run `npm test` when auth or shared JavaScript changes.
4. Run the local server and confirm index → claims → proofs flow works.
5. Add or update tests / fixtures if you introduced network-dependent behavior.
6. Update `AGENTS.md` and `README.md` if you changed repo behavior.
7. Open a PR with testing/repro steps and screenshots.

When You Are Blocked
--------------------
- If the remote API returns 5xx or is offline, add mocked responses and document the failure in the PR.
- If the digest scheme or API contract changes, stop and request clarification from the repo owner before attempting a fix.

Notes
-----
This repo is intentionally small and straightforward. Agent edits should respect the existing simple architecture and avoid introducing heavyweight build tooling unless the change explicitly requires it.

---
Last updated: 2026-05-30
