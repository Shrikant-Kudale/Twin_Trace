# Architecture
Static front end (`public/`) plus Vercel serverless functions (`api/`). No build step.

| Layer | Files | Job |
|---|---|---|
| Shell | `index.html`, `js/main.js`, `css/layout.css` | Sidebar, hash routing, AI status pill |
| Engine | `js/engine.js` | Tokens, four signals, identifier match, spec/colour/variant conflicts |
| Twin Finder | `js/finder.js` | Name, link, photo, CSV input; scoring; AI check; downloads |
| Catalogue Lab | `js/catalogue.js` | Blocking, clusters, genetic algorithm, accuracy, history |
| API client | `js/api.js`, `js/ocr.js` | Calls `/api/*`; free on-device OCR |
| Decisions | `js/insight.js`, `js/scan.js` | Market stats, anomaly test, playbooks, batch scan |
| API libs | `api/_lib/*` | Safe fetch, HTML/JSON-LD parsing, web sources, AI router |
