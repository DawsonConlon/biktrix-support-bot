# Workflows

n8n workflow exports (JSON). These are the **current live versions** running on the Biktrix n8n
instance. Credentials appear as ID references only — no secrets.

| File | Workflow | n8n ID | Trigger | Notes |
|---|---|---|---|---|
| `knowledge-base-ingestion.json` | Knowledge Base Ingestion | `efHyRPQmGKkZ3NdC` | Manual | Linear HTTP pipeline (no loop). Scrape → chunk → embed → upsert to Qdrant. Re-runnable (deterministic point IDs). |
| `customer-support-bot.json` | Customer Support Bot | `fCbwuOF6HoRA6Qyx` | Webhook (POST + GET) | Question → embed → search Qdrant (top 8, score ≥ 0.35) → GPT-4o-mini → JSON answer. |
| `slack-bot.json` | Biktrix CSB Slack | `tOLxcEIsNPQxU14K` | Slack `app_mention` | Same RAG core as the support bot; replies in a Slack thread under the user's message. |

## Architecture history (why these look the way they do)
- **v1 (abandoned):** used n8n langchain Qdrant vector-store nodes + a Split-In-Batches loop. Fragile —
  the loop wired to the wrong output and the Qdrant node silently required a Document sub-node.
- **v2 (current):** rebuilt as **linear HTTP pipelines** calling the OpenAI and Qdrant REST APIs
  directly. No langchain nodes, no loops — far more robust and fully testable.

## Retrieval tuning (current)
`limit: 8`, `score_threshold: 0.35` — real matches score ~0.45+, off-topic junk ≤0.26, so 0.35
cleanly separates them (fixed false refusals like "warranty" while keeping clean refusals on
off-topic questions).

## To re-import a workflow
In n8n: **Workflows → Import from File →** pick the JSON, then reattach credentials
(OpenAI, Qdrant header-auth, Slack) in the relevant nodes before activating.
