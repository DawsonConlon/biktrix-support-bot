# Biktrix Customer Support RAG Bot — Project Brief

## Project Goal
Build a RAG (Retrieval-Augmented Generation) customer support bot for **Biktrix** (an eBike company) that answers customer questions using content from their help center, returning answers + direct links to the source article.

---

## Help Center
- **URL:** https://biktrix.stonly.com/kb/en
- **Platform:** Stonly (no premium API access)
- **Total guides:** 261 guides, up to 42 steps each

### Key Finding: Scraping IS viable
Stonly renders full article content server-side inside `window.__SERVER_APP_STATE__` JSON on every page. No headless browser needed — plain HTTP GET requests work.

- **Guide list:** Embedded in homepage `__SERVER_APP_STATE__` under `initialData.helpcenterData.guides`
- **Step content:** Embedded in each guide page `__SERVER_APP_STATE__` under `initialData.loadedGuide.steps[].stepModule[].content.en.{title, content}`
- **Sitemap:** `/kb/en/sitemap.xml` returns 200 but is a React app — not usable
- **Stonly API:** All endpoints return 404/403 — no API access without premium

---

## Status:  LIVE & WORKING (both workflows tested end-to-end)

## Tech Stack (final)

| Layer | Service | Notes |
|---|---|---|
| Vector Store | **Qdrant Cloud** | Free tier, AWS us-east-1, collection `biktrix_kb` (1536-dim, Cosine), **1694 points ingested** |
| Embeddings | **OpenAI** `text-embedding-3-small` | |
| LLM | **OpenAI** `gpt-4o-mini` | Decided: OpenAI only — one key, one bill |
| Orchestration | **N8N** (cloud at n8n.biktrix.com) | |

### Architecture note (IMPORTANT — changed from original design)
The original design used the **n8n langchain Qdrant vector-store nodes** (with Embeddings + Document
sub-nodes) and a **Split In Batches loop**. This was abandoned — it was fragile (the loop wired to the
wrong SplitInBatches output, and the Qdrant insert node silently required a Document sub-node that kept
breaking). **Both workflows are now pure linear HTTP pipelines** calling the OpenAI and Qdrant REST APIs
directly. No langchain nodes, no loops. This is far more robust and was fully testable from the CLI.

---

## N8N Instance
- **URL:** https://n8n.biktrix.com
- **API Key:** stored in `~/.claude/settings.json` (n8n-mcp MCP server)
- **Existing workflows in instance:**
  - Demo: RAG in n8n (pre-existing)
  - **Biktrix - Knowledge Base Ingestion** (ID: `efHyRPQmGKkZ3NdC`)
  - **Biktrix - Customer Support Bot** (ID: `fCbwuOF6HoRA6Qyx`)

---

## Workflows (LIVE — final HTTP architecture)

### Workflow 1: Biktrix - Knowledge Base Ingestion
**Link:** https://n8n.biktrix.com/workflow/efHyRPQmGKkZ3NdC
**Trigger:** Manual ("Execute workflow"). Run once (or to refresh the KB). Inactive by default.

**Flow (linear, no loop):**
```
Manual Trigger
→ HTTP: Get Help Center Homepage (GET biktrix.stonly.com/kb/en, text)
→ Code: Extract Guide List from __SERVER_APP_STATE__ (261 guide objects)
→ HTTP: Fetch Guide Page (runs once per guide, batched 5/200ms)
→ Code: Extract and Chunk Steps (runOnceForAllItems; maps each page to its guide by index;
        strips HTML → {text, url, guideTitle, guideId, stepId, stepTitle})
→ HTTP: OpenAI Embeddings (text-embedding-3-small, per chunk, batched 20/100ms)
→ Code: Build Qdrant Point (deterministic UUID from guideId+stepId+len → upsert is idempotent)
→ HTTP: Upsert to Qdrant (PUT /collections/biktrix_kb/points?wait=true, api-key header auth)
```
Re-running is safe — point IDs are deterministic, so it overwrites rather than duplicates.

### Workflow 2: Biktrix - Customer Support Bot
**Link:** https://n8n.biktrix.com/workflow/fCbwuOF6HoRA6Qyx
**Status:** ACTIVE. **Webhook:** `POST https://n8n.biktrix.com/webhook/biktrix-support`

**Flow (linear, no AI Agent / no langchain):**
```
Webhook POST /biktrix-support  (body: {"question": "..."} — also accepts chatInput/query/message)
→ Code: Parse Question
→ HTTP: Embed Question (OpenAI text-embedding-3-small)
→ HTTP: Search Qdrant (top 5, with_payload)
→ Code: Build Prompt (system rules + retrieved docs as context)
→ HTTP: Generate Answer (OpenAI gpt-4o-mini, temp 0.2)
→ Code: Format Response → {answer, success}
→ Respond to Webhook (JSON)
```

**Test command:**
```bash
curl -X POST https://n8n.biktrix.com/webhook/biktrix-support \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I charge my battery?"}'
```

**Bot behavior rules (in system prompt):**
- Answer ONLY from retrieved docs — no hallucinations
- If no match: "I don't have information on that in our help center. Please contact our support team." (no URL appended)
- Real answers end with: "For more details including videos, visit: [most relevant article URL]"
- Friendly, concise tone for non-technical customers

### Retrieval tuning (applied)
- **Search Qdrant** node: `limit: 8`, `score_threshold: 0.35` (was `limit: 5`, no threshold).
- Why: real matches score ~0.45+, off-topic junk scores ≤0.26, so 0.35 cleanly separates them.
- Result: "warranty"-type questions that used to wrongly refuse now answer correctly, while
  off-topic questions ("meaning of life") still refuse cleanly.

### Which node controls what (cheat-sheet for editing behavior)
| Node | Controls | Edit it when… |
|---|---|---|
| **Build Prompt** (Code) ⭐ | The **system prompt** = personality + rules + refusal message | You want to change tone, add rules, change how it answers |
| **Generate Answer** (HTTP) | The **model** (`gpt-4o-mini`) and **temperature** (0.2) | You want a smarter model or more/less creativity |
| **Search Qdrant** (HTTP) | **What facts the bot sees** (`limit`, `score_threshold`) | Bot misses answers (raise limit/lower threshold) or answers junk (raise threshold) |

## How customers use the bot
1. **Chat web page** (recommended): `biktrix_chat.html` in the project dir — double-click to open a
   clean chat UI. Calls the webhook via POST, shows answers as chat bubbles with clickable source links.
2. **Browser URL** (quick test): `https://n8n.biktrix.com/webhook/biktrix-support?question=YOUR QUESTION`
   (GET listener added so it works from the address bar).
3. **POST request** (for app/website integration):
   `curl -X POST .../webhook/biktrix-support -d '{"question":"..."}'`

## Cost model (how it works + estimate)
- The bot is **NOT trained** on the data — it does live retrieval ("open-book") every question.
  Update Stonly → re-run ingestion → bot is current. No retraining ever needed.
- Per question: question embedding (~free) + gpt-4o-mini answer (~$0.0006).
- **≈ 1,600 questions per $1 → ~10,000 questions on $6.**
- Failure mode: if OpenAI balance hits $0, answers fail until topped up (no mid-use cutoff surprise).
- One-time ingestion of all 1694 chunks cost only a few cents.

## N8N Credentials (created)
- `OpenAI - Biktrix` (`openAiApi`, id `qaKpkBgUXxzNV4dk`) — used as predefined cred on OpenAI HTTP nodes
- `Qdrant Header - Biktrix` (`httpHeaderAuth`, id `0H3kxYaVlt7bFRjX`, header `api-key`) — used on Qdrant HTTP nodes
- `Qdrant - Biktrix` (`qdrantApi`, id `0ZU5N5lDNNEbFXJj`) — legacy, only needed if reverting to langchain nodes

---

## What's Been Completed

- [x] Investigated Stonly scraping viability — confirmed server-side rendered, no API needed
- [x] Extracted full guide list (261 guides) from homepage
- [x] Confirmed full step content accessible via `__SERVER_APP_STATE__` (tested on "All about eBike Batteries & Chargers" — 42 steps, all content present)
- [x] Installed Node.js v26 + Homebrew on user's machine
- [x] Configured n8n-mcp MCP server in `~/.claude/settings.json`
- [x] Installed n8n-skills plugin (7 skills in `~/.claude/skills/`)
- [x] Built and pushed both N8N workflows to n8n.biktrix.com
- [x] Explained cost structure to user
- [x] **Decided LLM: OpenAI only (gpt-4o-mini)**
- [x] **Created Qdrant Cloud cluster + `biktrix_kb` collection (1536/Cosine)**
- [x] **Created all N8N credentials (OpenAI + Qdrant header auth)**
- [x] **Rebuilt both workflows as robust linear HTTP pipelines (dropped langchain + loop)**
- [x] **Ran full ingestion — 1694 points in Qdrant**
- [x] **Support Bot live & tested — accurate answers w/ source URLs, clean refusals on off-topic**
- [x] **Built `biktrix_chat.html` — clean chat UI front-end (double-click to use)**
- [x] **Added GET webhook listener (browser address-bar usable, in addition to POST)**
- [x] **Tuned retrieval: limit 8 + score_threshold 0.35 — fixed false refusals (e.g. warranty)**
- [x] **Explained token/cost model to user (~10k questions per $6)**

---

## What's Needed Next (priority list)

Core project is complete and live. The active focus areas, in priority order:

### 1. Refine the accuracy of the answers ⭐
Make the bot reliably correct across more question types.
- Done so far: retrieval bumped to limit 8 + score_threshold 0.35.
- Next levers: better chunking on re-ingest (larger overlapping chunks; some duplicate chunks were
  observed in the data), test a wider battery of real customer questions and tune threshold/limit,
  consider upgrading `gpt-4o-mini` → `gpt-4o` for harder questions.
- NOTE: chunking changes require re-running the ingestion workflow — **ask user before running it.**

### 2. Decide / document how technical this tool should be
Define the target audience & answer depth. Should answers stay simple and non-technical for everyday
customers, or include more technical detail (torque specs, BMS behavior, firmware steps) for advanced
users / dealers? This decision shapes the system prompt and possibly retrieval depth.

### 3. Refine the "personality" of the bot
Tune tone and voice in the **Build Prompt** node's system prompt — e.g. brand voice, warmth vs.
brevity, formatting (bullet points vs. prose), language, greetings/sign-offs. (Lives entirely in the
Build Prompt node — no other nodes affected.)

### 4. Make the bot give info on contacting Biktrix customer support
When the bot can't answer (or for escalation), have it surface real CU support contact details
(phone / email / hours / support page link) instead of just the generic refusal line. Update the
refusal text + add the support contact info to the system prompt in the **Build Prompt** node.

### Other backlog ideas (lower priority)
- **Conversation memory** — current bot is single-turn; add a session store for multi-turn follow-ups.
- **Scheduled re-ingestion** — Schedule Trigger on the ingestion workflow to refresh the KB weekly.
- **Source links in API response** — return top source URLs as a structured `sources` array.
- **Channel integration** — embed webhook in the website, Intercom, WhatsApp, etc.

---

## Iteration 5 — Model Guide Requests (2026-07-16)

**Feature:** a customer can ask "give me all the guides for my RogueHawk" and get a complete,
deterministic list of help articles for that model — the universal onboarding guides (assembly,
first ride, batteries, display, maintenance, registration) plus every guide specific to that
model family.

**Why not query the vector DB for this:** Qdrant points carry no model field, guide titles don't
reliably contain the model name (the flagship assembly guide is model-agnostic and branches by
series *inside* the guide), and top-k semantic search can't guarantee a *complete* list. So the
feature uses a **curated model registry** in the Build Prompt node instead.

**How it works (all inside the Build Prompt node — `ai_prompts/prompt_i5.js`):**
- A JS registry holds `UNIVERSAL` guides + `MODEL_GUIDES` per family (Swift, Stunner, Juggernaut,
  Kutty, Monte Capro, RogueHawk, BTX Moto, SkyTrike, Challenger). All URLs pulled verbatim from
  the live guide list.
- Detection is done **in code, not by the LLM**: question must contain a guide-ish word
  (guide/article/manual/resource/docs/tutorial) AND a model alias (normalized, so "rogue hawk fs"
  matches RogueHawk). When detected, the complete answer is pre-built in JS and gpt-4o-mini is
  instructed to relay it verbatim — guaranteeing complete lists and zero hallucinated URLs.
  (An earlier attempt that put the table in the system prompt and let the LLM copy it truncated
  lists on variant questions — that's why detection/formatting moved to code.)
- Everything else (general Q&A, greetings, showrooms, refusals) flows through the unchanged
  semantic path. "My RogueHawk battery won't charge" is NOT a guide request (no guide word) and
  answers normally. Unknown models get a polite refusal + the family list + contact link.

**Deployment (safe iteration):** v1 (`fCbwuOF6HoRA6Qyx`, `/webhook/biktrix-support`) is untouched
and still live. v2 is a separate workflow — **Biktrix - Customer Support Bot v2**
(ID `Gve931zbtQzgDQpk`), webhook `POST/GET https://n8n.biktrix.com/webhook/biktrix-support-v2`,
export in `workflows/customer-support-bot-v2.json`. Test UI: `chat-ui/biktrix_chat_animated_p5.html`.
Note: when creating workflows via the n8n REST API, webhook nodes need a `webhookId` field or the
webhook won't register on activation.

**Maintenance:** to add/remove guides or models, edit the `UNIVERSAL` / `MODEL_GUIDES` /
`MODEL_ALIASES` objects at the top of the Build Prompt node (or `prompt_i5.js` and re-push).

---

## Environment

| Item | Value |
|---|---|
| Machine | Dawson's MacBook Air |
| Node.js | v26.0.0 (installed via Homebrew) |
| Homebrew | `/opt/homebrew/bin/brew` (added to `~/.zprofile`) |
| Claude Code config | `~/.claude/settings.json` |
| n8n-skills | `~/.claude/skills/` (7 skills) |
| Project dir | `/Users/dawsonconlon/Coding/Claude_Code/` |
| N8N API key | In `~/.claude/settings.json` → n8n-mcp env vars |
