# THE RISE public website

Open `index.html` directly for the public website. For the complete demo staff session use Node.js: `node preview-server.cjs`, then open http://127.0.0.1:4173/ . No installation or build is required.

## Included

- Public homepage, responsive course showcases, search, course-detail dialogs, FAQ, desktop hover navigation, mobile menu, scroll scaling, reduced-motion support.
- Staff entry → local demo login → Manager dashboard. The display name persists within the browser tab session; manager goals, task states and notes persist in local browser storage. Student search and tabs filter six sample records. Logout clears the demo navigation session. Direct dashboard visits without a demo session return to staff entry.
- Independent HTML/CSS/JavaScript and three original AI-generated illustrative photographs. No Toki source code, fonts or production assets were copied. The manager dashboard uses the supplied THE RISE logo.
- Dashboard details and demo limitations in `MANAGER-DASHBOARD.md`.

## Connect the real THE RISE OS

Set `staffLoginUrl` in `config.js` to the existing production staff-login URL when available. Public staff links will hand off to that flow without collecting credentials or changing its authentication. Set `accountUrl` to the real student account-creation entrypoint. Course browsing is public; the enrollment flow starts with account creation before course selection.

The demo has **no production authentication, database, enrollment, payment, DAN, AI, or PSD automation**. Session storage is a demo navigation aid, not an access-control mechanism. Real security belongs in the OS backend. Do not insert a static password or private data into this project.

## Content

Confirmed from the referenced conversation: machinery operator courses (loader, excavator, dump), manicure, eyelash; practical training; certificate + ID; slogan “Таны өсөлт бидний зорилго”; blue/purple/pink accents; the staff flow and six-stage lead pipeline. Prices, course lengths, start dates, phone numbers, address, graduate counts and partner claims were not supplied, so they are not invented. Online enrollment shows an honest unavailable state until configured.

The generated scenes depict fictional illustrative trainees and environments, not actual school documentary photographs. Credential cards are website illustrations, not official templates. Replace them with approved brand assets and real photographs when provided.

## Reference and visual limits

Live reference https://www.toki.mn/ observed 2026-10-09. Desktop research used 1440 × 900; mobile used 390 × 844. Matched the viewport-led section rhythm, 1200px desktop frame, hero glass panel, 80/60/64px title hierarchy, dark showcases, pale editorial section, rounded cards and scroll-driven scaling. System fonts replace Toki’s proprietary font. Content lengths, artwork and THE RISE colors intentionally differ; this is not a claim of pixel identity. Local visual-study screenshots are excluded from GitHub.

