# Fin channel character assets

## Required file
Upload this exact file here (same folder):

**`Athletic_man.fbx`**

### Upload URL (browser)
https://github.com/devmeziem/Hi/upload/main/assets/characters

1. Open that link while logged into the `devmeziem` account (or an account with write access).
2. Drag `Athletic_man.fbx` into the page (or choose file).
3. Commit message: `assets: add Athletic_man.fbx for fin channel`
4. Commit directly to `main`.

After upload the path must be:

```text
assets/characters/Athletic_man.fbx
```

Raw download (works only after the file exists):
https://github.com/devmeziem/Hi/raw/main/assets/characters/Athletic_man.fbx

## Usage
Workflow: `.github/workflows/fin-character-pilot.yml`  
Script: `scripts/generate_fin_character_pilot.cjs` + `scripts/blender_render_athletic_man.py`

Renders a short educational fin video with the 3D host + Edge TTS (Andrew).
