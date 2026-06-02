# Chat UI

Self-contained browser front-ends for the support bot. Each is a single HTML file — double-click to
open, no install/server needed. Both POST to the live webhook
(`https://n8n.biktrix.com/webhook/biktrix-support`) and render answers as chat bubbles with
clickable source links.

| File | Version / Feature | Notes |
|---|---|---|
| `biktrix_chat.html` | **v1 — clean chat** | The stable baseline. Minimal dark-theme chat UI. Use this one for real testing. |
| `biktrix_chat_animated.html` | **v2 — animated header** | Identical chat behaviour as v1, plus a CSS/JS pixel-art sprite in the header: a cyclist rides in, the bike breaks, the rider checks their phone, the bike fixes itself, and rides off. Pure HTML/CSS/JS, no images. |

Both call the same backend, so they always reflect whatever the n8n support-bot workflow returns —
no changes needed here when the bot's behaviour changes.
