# GivePulse — Blood Donation Platform

A bilingual (EN/BN) blood donation platform for Bangladesh: donor discovery,
blood bank inventories, blood requests, an AI-style compatibility & safety
checker, messaging, test report uploads, donation history, and an admin
dashboard with charts.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Demo logins

- **User:** miraz@example.com / password
- **Admin:** admin@givepulse.bd / admin123

## Notes

- All data is stored in the browser's `localStorage` (no backend yet) —
  seeded from `src/lib/db.js` on first load. Use `db.reset()` in the
  browser console to restore the seed data.
- The Compatibility Checker's "AI Safety Assessment" runs entirely
  client-side using rule-based logic (`src/lib/safetyAssessment.js`) —
  no API key required. To wire it to a real LLM later, add a small
  Node/Express proxy that holds the API key server-side and calls it
  from this page instead.
- Toggle language with the pill button in the top bar / nav.

## About the `npm audit` warning

`npm audit` will flag 2 "high severity" issues in `react-router`. These
only affect React Router's **RSC / server-action mode** (a server-rendered
framework feature). GivePulse is a plain client-side SPA using
`BrowserRouter`, `Routes`, `Link`, and `useNavigate` — none of the
vulnerable code paths are ever used. No version of `react-router-dom`
currently resolves this cleanly (`npm audit fix --force` just trades it
for older, worse CVEs), so it's safe to leave as-is here.

## Build for production

```bash
npm run build
```

Output goes to `dist/`.
