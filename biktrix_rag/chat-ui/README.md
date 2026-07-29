# Chat UI

# Design Stratigy
Design Strategy

Our customers are not fans of AI. We already have an AI receptionist in place, and it generates a steady stream of negative feedback customers find it impersonal, evasive, or frustrating to work around.

Knowing this, I deliberately designed the tool to feel as little like "AI" as possible. Under the hood it's a RAG bot, but nothing in the customer-facing experience says so: no persona, no "thinking..." no conversational small talk. Instead, it looks and behaves like a search bar you type what's wrong, and it returns the matching help article. Simple buttons, minimal UI, no ambiguity about what it does.

The whole strategy comes down to one word: simplicity. Ask a question, get an article — no more, no less. Every UI decision followed from that: fewer clicks, no unnecessary steps, nothing that reads as "AI experience" rather than "helpful search tool."

This mirrors the original business problem — customers who found our knowledge base intimidating shouldn't feel the same way about this. If the tool feels like AI, it inherits the same distrust as the receptionist. If it feels like a plain search bar, customers actually use it.


<img width="3314" height="1946" alt="image" src="https://github.com/user-attachments/assets/d55a9e0f-c1b5-433d-9a78-e3c6635f214a" />


### Buttons
<img width="3082" height="626" alt="image" src="https://github.com/user-attachments/assets/6b5dd3c4-f6df-42e0-8371-346be8cc29be" />

## Outputs

<img width="3050" height="2066" alt="image" src="https://github.com/user-attachments/assets/01d51d5b-0365-4969-8acb-d71a14fd5342" />


---
Self-contained browser front-ends for the support bot. Each is a single HTML file — double-click to
open, no install/server needed. Both POST to the live webhook
(`https://n8n.biktrix.com/webhook/biktrix-support`) and render answers as chat bubbles with
clickable source links.

| File | Version / Feature | Notes |
|---|---|---|
| `biktrix_chat.html` | **v1 — clean chat** | The stable baseline. Minimal dark-theme chat UI. Use this one for real testing. |
| `biktrix_chat_animated.html` | **v2 — animated header** | Identical chat behaviour as v1, plus a CSS/JS pixel-art sprite in the header: a cyclist rides in, the bike breaks, the rider checks their phone, the bike fixes itself, and rides off. Pure HTML/CSS/JS, no images. |
| `biktrix_chat_animated_p5.html` | **p5 — iteration-5 test page** | Same as `_p4` but points at the **v2 webhook** (`/webhook/biktrix-support-v2`) — the iteration with model-guide requests ("give me all the guides for my RogueHawk"). Use this to test v2 before cutting production over. |
| `biktrix_chat_animated_p6.html` | **p6 — model-guides button** | Same as `_p5` plus a " Guides for a specific model" button above the input: clicking it reveals chips for all 9 model families (incl. Challenger legacy); clicking a chip sends "Give me all the guides for my <model>" through the normal chat flow. Frontend-only — same v2 webhook, typing/problem-solving unchanged. |

Both call the same backend, so they always reflect whatever the n8n support-bot workflow returns —
no changes needed here when the bot's behaviour changes.
