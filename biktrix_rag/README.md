# Biktrix Customer Support RAG Bot

A Retrieval-Augmented Generation (RAG) customer-support bot for **Biktrix** (an eBike company).
It answers customer questions using content scraped from the Biktrix help center and returns
accurate answers **plus a direct link to the source help article**.

> **Status:** ✅ Live & working. Knowledge base ingested (1,694 chunks), and three delivery
> channels are running: a webhook API, a browser chat page, and a Slack bot.

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

## Using the bot

**Browser chat:** open `chat-ui/biktrix_chat.html` (double-click) and type a question.

**API (POST):**
```bash
curl -X POST https://n8n.biktrix.com/webhook/biktrix-support \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I charge my battery?"}'
```

**Slack:** in the `#rag-assistant` channel, post `@RAG-Assistant how do I charge my battery?`

---

## Security note
No API keys or secrets are stored in this repository. All credentials live in the n8n instance and
are referenced only by their internal IDs. OS-junk files are git-ignored.
