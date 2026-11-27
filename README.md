<div align="center">

# TwinTrace
**Product identity workbench. One product, many names.**

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/new)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=fff)](https://nodejs.org)
[![xAI Grok](https://img.shields.io/badge/xAI-Grok-000)](https://console.x.ai)
[![Pollinations](https://img.shields.io/badge/Pollinations-AI-ff69b4)](https://enter.pollinations.ai)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=googlegemini&logoColor=fff)](https://aistudio.google.com)
[![Qwen](https://img.shields.io/badge/Qwen-VL-6f42c1)](https://huggingface.co/Qwen)
[![Ollama](https://img.shields.io/badge/Ollama-local-000?logo=ollama)](https://ollama.com)
[![Open Food Facts](https://img.shields.io/badge/Open%20Food%20Facts-data-ff8200)](https://world.openfoodfacts.org)
[![Mermaid](https://img.shields.io/badge/Docs-Mermaid-FF3670?logo=mermaid&logoColor=fff)](https://mermaid.js.org)

</div>

One app, real workflows. **Twin Finder** takes a name, link, photo (upload, paste or camera) or your CSV and runs a goal-specific playbook:

| Playbook | Real-world question | Method |
|---|---|---|
| Price check | Where does my price sit in the market? | median, range, cheapest seller, your gap |
| Counterfeit radar | Which listings look fake or grey-market? | robust outlier test (modified z-score, median/MAD) |
| Catalogue gap check | Does this SKU already exist in my catalogue? | twin match against your CSV |
| Listing audit | What do competitors say that my title does not? | term frequency across twin titles |
| Identify from photo | What is this product, and who sells it? | AI vision, or free on-device OCR fallback |

Also: **Batch Scan** (up to 25 products to a market table), **Catalogue Lab** (bulk clusters, genetic rule learning, accuracy vs baseline, history), **Head to head**, **Guide**. Light and dark themes. Downloads for every result.

## Architecture
```mermaid
flowchart LR
  UI[Browser app] --> ENG[Engine: signals + conflicts]
  UI -->|/api/resolve| R[Resolve: text, link, photo]
  UI -->|/api/search| S[Search: DuckDuckGo, Bing, Open Food Facts]
  UI -->|/api/verify| V[Verify borderline pairs]
  R --> AI[AI router]
  V --> AI
  AI --> PF[Pollinations free] --> P[Pollinations key] --> GR[Groq] --> OR[OpenRouter] --> GM[Gemini] --> G[xAI Grok] --> Q[Qwen VL] --> O[Ollama]
  S --> E[Enrich: Open Graph + schema.org MPN/GTIN/price]
```
## Workflow
```mermaid
flowchart TD
  A[Name / link / photo / CSV] --> B[Resolve to product name] --> C[Multi-query web search] --> D[Drop junk domains, enrich pages]
  D --> E[Score: words, characters, model, price] --> F{Identifier match?}
  F -- yes --> T[Twin] 
  F -- no --> G[Spec, colour, variant penalties] --> H{70%+ / 50-70% / below}
  H --> I[AI verifies the borderline band] --> J[Report download]
```
## Accuracy features
IDF-weighted scoring (model numbers outweigh common words), spelling-variant model numbers (WH1000XM5 = WH-1000XM5), spec conflicts (128GB vs 256GB), colour and variant (Pro, Max) penalties, schema.org MPN/GTIN identifier match, junk-domain filter, four-query web search, AI check on borderline cases only.

## Run and test
```bash
npm i && npm test          # engine, API and full UI flow tests
npx vercel dev             # run locally
```
Deploy: see [docs/DEPLOY.md](docs/DEPLOY.md). Keys: [.env.example](.env.example). Details: [architecture](docs/ARCHITECTURE.md), [API](docs/API.md), [use cases](docs/USE_CASES.md).

## Environment variables (all optional)
Free routes are tried first, keyed routes are the fallback. Recommended: `POLLINATIONS_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`. Extra: `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HF_TOKEN`, `OLLAMA_URL`. Better search: `BRAVE_API_KEY` or `GOOGLE_CSE_KEY` + `GOOGLE_CSE_CX`. See `.env.example`. Guide > "Test all AI routes" shows each route's exact status.

## Limits
Web search scrapes public result pages and may be rate-limited; failed sources are shown. Prices come from snippets and page metadata. Free AI tiers should not receive private data. Check the licence of any corpus you load.
