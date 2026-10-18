# CHANNEL MAP (Hard Reference — Do Not Mis-route)

This file is the single source of truth for channel identity.
Scripts and workflows must respect these mappings. Never cross-post.

## YouTube Channels

| Slot | Internal Name | Handle / Purpose | OAuth Secrets |
|------|---------------|------------------|---------------|
| **YouTube 1 / CH2** | The Stoic Architect | Stoic long-form + 5s pure quote reels | `YOUTUBE_CLIENT_ID_CH2`, `YOUTUBE_CLIENT_SECRET_CH2`, `YOUTUBE_REFRESH_TOKEN_CH2` |
| **YouTube 2 / CH1** | Fin Blueprint | Beginner wealth / cashflow | `YOUTUBE_CLIENT_ID_CH1` ... |
| **YouTube 3 / CH3** | Archie Explains / bonesceo | Science & tech cartoon + Q&A | `YOUTUBE_CLIENT_ID_CH3` ... |
| **YouTube 4 / CH4** | Cinema Vanguard | Crime / horror / mystery documentaries | `YOUTUBE_CLIENT_ID_CH4` ... |
| **YouTube 5 / CH5** | Apex Discipline / MindRush | Teen & youth motivation | `YOUTUBE_CLIENT_ID_CH5` ... |

## Buffer Accounts

| API | Secret | Allowed Use | Forbidden |
|-----|--------|-------------|-----------|
| **Buffer API 1** | `BUFFER_API_KEY` | Facebook + Instagram for Archie content only | **Never touch any TikTok on API 1** |
| **Buffer API 2** | `BUFFER_API_KEY_2` | TikTok only | — |

### Buffer API 2 TikTok Channels

| Channel | Secret / ID | Used By |
|---------|-------------|--------|
| Teen Motivation (`@bonesceo` / MindRush) | `BUFFER_TIKTOK_TEEN_CHANNEL_ID` (currently `6ab05677ea19ca0bde9c3ffb`) | `teen-motivation-pipeline` only |
| Cinema Vanguard / Driftreel | `BUFFER_TIKTOK_DRIFTREEL_CHANNEL_ID` or `BUFFER_TIKTOK_MOVIE_CHANNEL_ID` | `movie-brand-pipeline` only |

## Stoic Daily Quota (YouTube 1 / CH2)

- **3× 5-second pure quote reels** — no voice, slow background music + panning only
- **1× long-form** (45–75s+) — AndrewNeural rate -12% / pitch -25Hz + matching BGM
- One of the daily posts should be zero-AI (public-domain quote + psychology angle) when possible
- Strong deduplication: never repeat quote / visual / audio within rolling window

## Safety Rules

1. Stoic content → only CH2 YouTube secrets + never Buffer TikTok from other pipelines
2. Teen Motivation → only `BUFFER_TIKTOK_TEEN_CHANNEL_ID` + CH5 YouTube
3. Cinema Vanguard → only Driftreel/Movie TikTok ID + CH4 YouTube
4. Archie → Buffer API 1 (FB/IG) + CH3 YouTube. Never use Buffer API 2 for Archie TikTok.
5. No workflow may fall back to another channel’s secrets.
