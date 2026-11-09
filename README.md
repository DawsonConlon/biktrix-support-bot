# Biktrix Customer Support RAG Bot
---
A Retrieval-Augmented Generation (RAG) customer-support bot for **Biktrix** (an eBike company).
It answers customer questions using content scraped from the Biktrix help center and returns
accurate answers **plus a direct link to the source help article**.
---

# Business Problem
I worked on the CX team at an ebike company, helping customers remotely troubleshoot and repair their bikes across the entire customer base. Our team handled upwards of 470 tickets a week.

One of our key resources was an internal knowledge base hosted on Stonly, containing help articles covering everything from general assembly to brake sensor replacement. When it worked, it worked well but most customers never used it.

The problem: a large share of our ticket volume was for issues our knowledge base already solved — things like "how do I assemble my bike." Customers either didn't know the database existed or found it too intimidating to navigate. So instead of self-serving in two minutes, they called in, and we ran the full support loop just to hand them a link:

Customer calls → we identify the issue → we open a ticket → we send the relevant article → we follow up to confirm resolution

That's five steps and real agent time spent on a problem the customer could have solved themselves, if they'd been able to find the right article. Multiply that across a fraction of 470 tickets/week, and easy, low-value tickets were consistently crowding out capacity needed for customers with serious, safety-relevant issues.

The resource to solve these tickets already existed. The real gap was getting the right article in front of the customer at the moment they needed it — without requiring them to navigate the database themselves.

That gap is what led me to build the Biktrix Support RAG Bot: instead of searching a database, a customer describes their issue in plain language and gets routed directly to the relevant article.

---


<img width="3056" height="2064" alt="image" src="https://github.com/user-attachments/assets/ecde604a-5a02-4476-abd7-53588026b426" />


> **Status:**  Live & working. Knowledge base ingested (1,694 chunks), and three delivery
> channels are running: a webhook API, a browser chat page, and a Slack bot.
> **Latest (2026-07-16):** model-specific guide lookup — customers can get every guide for
> their exact bike model with one click (see below).

---

## How it works

```
Biktrix Help Center (Stonly)
        │  scrape + chunk
        ▼
  OpenAI embeddings  ──►  Qdrant Cloud (vector DB, collection "biktrix_kb")
        ▲                          │
        │ embed question           │ top-k similar chunks
        │                          ▼
   Customer  ──►  Retrieve relevant docs  ──►  GPT-4o-mini  ──►  Answer + source URL
```

- **Not trained** on the data — it does live retrieval every question ("open-book"). Update the
  help center → re-run ingestion → the bot is current. No retraining ever.
- **Cost:** ~$0.0006 per question (≈10,000 questions per $6).

**Tech stack:** n8n (orchestration) · Qdrant Cloud (vector store) · OpenAI `text-embedding-3-small`
(embeddings) + `gpt-4o-mini` (answers).

---

## Repository layout

| Folder | What's in it |
|---|---|
| [`docs/`](docs/) | Full project brief — architecture, decisions, costs, next steps |
| [`workflows/`](workflows/) | The three n8n workflows (exported JSON) — the actual automation |
| [`chat-ui/`](chat-ui/) | Browser chat front-ends (plain + animated) |

See each folder's own `README.md` for details and version notes.

---

## The three workflows (in `workflows/`)

| Workflow | Purpose |
|---|---|
| `knowledge-base-ingestion.json` | One-time/refresh: scrape all 261 help guides → chunk → embed → load into Qdrant |
| `customer-support-bot.json` | Webhook API: question in → retrieve → answer out. Powers the chat pages |
| `slack-bot.json` | Slack: `@RAG-Assistant <question>` → threaded reply in the channel |

These are reference exports. Credentials are referenced by ID only (no secrets in this repo).

---

## Model-specific guides (iteration 5 + 6)

**Problem:** customers wanted to access the guides for their specific bike model seamlessly —
"give me everything for my RogueHawk" — but the bot's top-k semantic search can't guarantee a
*complete* list, and the vector DB has no model metadata (most help articles are model-agnostic).

**Solution (two parts):**

1. **Backend (v2 bot, `workflows/customer-support-bot-v2.json` + `ai_prompts/prompt_i5.js`):**
   a curated model registry lives inside the Build Prompt node — 7 universal onboarding guides
   (assembly, first ride, batteries, display, maintenance, registration) plus every
   model-specific guide for each family (Swift, Stunner, Juggernaut, Kutty, Monte Capro,
   RogueHawk, BTX Moto, SkyTrike, Challenger). Guide requests are detected **in code** (guide
   word + fuzzy model name), and the complete answer is pre-built in JS — the LLM only relays
   it, so lists are always complete and URLs are never invented. All other questions flow
   through the unchanged semantic pipeline. Deployed as a **separate v2 workflow** on
   `/webhook/biktrix-support-v2`; the original v1 bot keeps running untouched.

2. **Frontend (`chat-ui/biktrix_chat_animated_p6.html`):** a "Guides for a specific model"
   button above the chat input reveals a chip for each model — one click sends the request
   through the normal chat flow. No typing needed; typing and problem-solving still work
   exactly as before.

---

## Using the bot

**Browser chat:** open `chat-ui/biktrix_chat.html` (double-click) and type a question.

**API (POST):**
```bash
curl -X POST https://n8n.biktrix.com/webhook/biktrix-support \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I charge my battery?"}'
```

---

## Security note
No API keys or secrets are stored in this repository. All credentials live in the n8n instance and
are referenced only by their internal IDs. OS-junk files are git-ignored.
