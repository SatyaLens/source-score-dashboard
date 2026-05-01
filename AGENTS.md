# AGENTS.md

Purpose
-------
This repository is a small static dashboard that lists "sources", their "claims", and "proofs" by calling the Source Score API. The frontend is implemented with plain HTML + inline JavaScript in these files:

- index.html
- claims.html
- proofs.html

This document tells automated agents (and human contributors) how to make safe, targeted changes, how to run and test the site locally, and which best practices to follow.

What This Repo Does
--------------------
- Loads the list of sources from `https://source-score.onrender.com/api/v1/sources`.
- When the user selects a source the UI navigates to `claims.html?source={digest}` and calls `/api/v1/source/{sourceUriDigest}/claims`.
- When a claim is selected the UI navigates to `proofs.html?claim={digest}` and calls `/api/v1/claim/{claimUriDigest}/proofs`.

Agent Responsibilities / Conventions
----------------------------------
- Keep changes small and focused. Prefer a single intent per commit/PR.
- Use `apply_patch` to edit files. Avoid wholesale refactors unless requested.
- Update this file and the TODO list (`manage_todo_list`) when you change behavior or add pages.
- When modifying API calls, ensure path components that contain digests are URL-encoded with `encodeURIComponent(digest)`.
- Always escape user-facing data before inserting into the DOM (the codebase uses an `escapeHtml()` helper pattern).
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

3. Example curl commands (for debugging the API directly):

```bash
curl -H "X-API-Key: demo-api-key" "https://source-score.onrender.com/api/v1/sources"
# compute a digest for a URI in the shell (Linux):
printf 'https://example.com/path' | sha256sum | cut -d' ' -f1
curl -H "X-API-Key: demo-api-key" "https://source-score.onrender.com/api/v1/source/<digest>/claims"
curl -H "X-API-Key: demo-api-key" "https://source-score.onrender.com/api/v1/claim/<digest>/proofs"
```

API Summary
-----------
- Base: `https://source-score.onrender.com/api/v1`
- Endpoints used by this UI:
  - `GET /sources`
  - `GET /source/{sourceUriDigest}/claims`
  - `GET /claim/{claimUriDigest}/proofs`
- Header: `X-API-Key: <key>` (the code uses a `demo-api-key` placeholder).

Error Handling and Resilience
----------------------------
- Show friendly messages when the API is unreachable or returns non-OK HTTP statuses.
- Avoid breaking the entire page when one fetch fails; show placeholder rows or a clear error message in the table.
- Consider adding a lightweight in-browser cache or exponential backoff if the API is rate-limited.

Coding & Style Notes
--------------------
- Keep JavaScript minimal and readable. This repo prefers small helper functions (e.g. `escapeHtml`, `sha256hex`) over heavy frameworks.
- Use `encodeURIComponent()` for URL path segments that may contain special characters.
- Prefer `crypto.subtle.digest('SHA-256', ...)` in browser code for digest generation; for shell-based tools use `sha256sum`.

Testing Guidance
----------------
- Manual smoke test described in "Run & Test Locally" is sufficient for most changes in this small static UI.
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
3. Run the local server and confirm index → claims → proofs flow works.
4. Add or update tests / fixtures if you introduced network-dependent behavior.
5. Update `AGENTS.md` and the TODO list if you changed the repo behavior.
6. Open a PR with testing/repro steps and screenshots.

When You Are Blocked
--------------------
- If the remote API returns 5xx or is offline, add mocked responses and document the failure in the PR.
- If the digest scheme or API contract changes, stop and request clarification from the repo owner before attempting a fix.

Notes
-----
This repo is intentionally small and straightforward. Agent edits should respect the existing simple architecture and avoid introducing heavyweight build tooling unless the change explicitly requires it.

---
Last updated: 2026-05-01
