# CHANNEL MAP + CONTENT SYSTEM

## YouTube

| Slot | Channel | Engine rules |
|------|---------|--------------|
| CH1 Fin | Fin Blueprint | Live Wikiquote quotes only; income teaching; BGM ~0.28 under VO |
| CH2 Stoic | Stoic Architect | Public Stoic sources; Andrew **-12% / -25Hz**; BGM 0.25 |
| CH3 Archie | Archie Explains | Wikipedia + everyday science; simple puppet path; BGM 0.28 |
| CH4 Cinema | Cinema Vanguard | Documented stories; BGM 0.30; Buffer TikTok = driftreel only |
| CH5 Teen | Apex / bonesceo | Situation hooks NOT listicles; **Motivation Andrew -5% / -15Hz**; BGM 0.32 |

## Shared modules

- `scripts/content_system_shared.cjs` — volumes, voices, dedup
- `scripts/prompts_library.cjs` — AI prompts per channel
- `scripts/public_sources.cjs` — Wikiquote / Wikipedia / seeds
- `scripts/apply_all_content_system.cjs` — raise quiet BGM across scripts

## Buffer

- API 1: Archie FB/IG only — never TikTok
- API 2: Teen TikTok + Cinema TikTok only (never cross-post)

## Dedup

- Exact normalized text + word overlap ≥28% rejected
- Author window 6 for quotes
- No full-catalog fallback when live sources empty
