# Archie on Kaggle — same character every time

**Yes, understood:** not a random new face.

- Base look = **existing Archie puppet frames** (face, colors, outfit).
- Kaggle GPU clips should look **3D / slightly dimensional** but **always the same Archie**.
- Consistency method: fixed reference stills from `assets` / puppet export + prompts that lock outfit + face.
- Pipeline still: GH job.json → Kaggle 5s clips → GH stitch + **male Edge TTS only** (no Google) + captions.

Do not invent a second mascot.
