"""
Blender 3D Mike — body clips (Mikeanim.glb) + procedural facial animation.
Works on the existing Tripo mesh even when it has almost no shape keys.

What the face does:
  - Periodic natural blinks
  - Jaw / mouth open during "speech" windows (teaching sections)
  - Subtle brow / head micro-motion
  - Slight smile bias so he doesn't look angry

Usage (GitHub Action / local):
  blender -b -noaudio -P scripts/blender_mike3d_facial.py -- \
    --out assets/blender/mike_teaching.mp4 \
    --glb assets/mike/Mikeanim.glb \
    --seconds 12 --width 720 --height 1280

Falls back gracefully if the mesh has no shape keys or jaw bone.
"""
from __future__ import annotations

import math
import random
import subprocess
import sys
import tempfile
from pathlib import Path

import bpy

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------
def parse_args(argv):
    args = {
        "out": "assets/blender/mike_facial.mp4",
        "fps": 24,
        "seconds": 12.0,
        "width": 720,
        "height": 1280,
        "glb": "assets/mike/Mikeanim.glb",
    }
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    i = 0
    while i < len(argv):
        if argv[i].startswith("--") and i + 1 < len(argv):
            key = argv[i][2:]
            val = argv[i + 1]
            if key == "seconds":
                args[key] = float(val)
            elif key in ("width", "height", "fps"):
                args[key] = int(val)
            else:
                args[key] = val
            i += 2
        else:
            i += 1
    return args


# ---------------------------------------------------------------------------
# Scene helpers
# ---------------------------------------------------------------------------
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras,
                 bpy.data.lights, bpy.data.armatures, bpy.data.actions):
        for block in list(coll):
            try:
                coll.remove(block)
            except Exception:
                pass


def mat(name, color, emit=0.0):
    m = bpy.data.materials.new(name=name)
    try:
        m.use_nodes = False
    except Exception:
        pass
    r, g, b = color
    if emit > 0:
        r = min(1.0, r + emit * 0.25)
        g = min(1.0, g + emit * 0.25)
        b = min(1.0, b + emit * 0.30)
    m.diffuse_color = (r, g, b, 1.0)
    return m


def mesh(op, **kw):
    getattr(bpy.ops.mesh, op)(**kw)
    obj = bpy.context.active_object
    try:
        bpy.ops.object.shade_smooth()
    except Exception:
        pass
    return obj


def build_bright_studio():
    """Neutral bright cyclorama so Mike's colours stay clean."""
    # Floor
    floor = mesh("primitive_plane_add", size=20, location=(0, 0, 0))
    floor.data.materials.append(mat("Floor", (0.55, 0.55, 0.58)))

    # Back wall (cyclorama style)
    wall = mesh("primitive_cube_add", size=1, location=(0, 4.5, 2.8))
    wall.scale = (12, 0.12, 3.2)
    wall.data.materials.append(mat("Wall", (0.78, 0.80, 0.84)))

    # Soft side walls
    for x in (-6.5, 6.5):
        sw = mesh("primitive_cube_add", size=1, location=(x, 1.0, 2.5))
        sw.scale = (0.1, 6.0, 2.8)
        sw.data.materials.append(mat("Side", (0.72, 0.74, 0.78)))

    # Ceiling
    ceil = mesh("primitive_plane_add", size=20, location=(0, 1.0, 5.2))
    ceil.rotation_euler = (math.radians(180), 0, 0)
    ceil.data.materials.append(mat("Ceil", (0.90, 0.91, 0.93)))

    # Key light
    bpy.ops.object.light_add(type="AREA", location=(2.5, -3.5, 4.0))
    key = bpy.context.active_object
    key.data.energy = 180
    key.data.size = 4.5
    key.rotation_euler = (math.radians(55), math.radians(15), 0)

    # Fill
    bpy.ops.object.light_add(type="AREA", location=(-3.0, -1.5, 3.2))
    fill = bpy.context.active_object
    fill.data.energy = 90
    fill.data.size = 5.0

    # Rim / back
    bpy.ops.object.light_add(type="AREA", location=(0, 3.5, 3.5))
    rim = bpy.context.active_object
    rim.data.energy = 70
    rim.data.size = 3.5

    # Camera — full body-ish, slight low angle
    bpy.ops.object.camera_add(location=(0, -3.8, 1.45))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(84), 0, 0)
    cam.data.lens = 38
    bpy.context.scene.camera = cam

    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    try:
        world.use_nodes = False
    except Exception:
        pass
    world.color = (0.62, 0.68, 0.75)


# ---------------------------------------------------------------------------
# Import + find face parts
# ---------------------------------------------------------------------------
def import_mike(glb_path: Path):
    if not glb_path.exists():
        raise SystemExit(f"Missing GLB: {glb_path}")

    before = set(bpy.data.objects.keys())
    bpy.ops.import_scene.gltf(filepath=str(glb_path))
    after = [o for o in bpy.data.objects if o.name not in before]
    if not after:
        raise SystemExit("GLB import produced no objects")

    # Root empty
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0.9, 0))
    root = bpy.context.active_object
    root.name = "MikeRoot"

    meshes = [o for o in after if o.type == "MESH"]
    armatures = [o for o in after if o.type == "ARMATURE"]

    # Bounds + scale to ~1.75 m
    min_c = [1e9, 1e9, 1e9]
    max_c = [-1e9, -1e9, -1e9]
    for o in meshes:
        for corner in o.bound_box:
            w = o.matrix_world @ __import__("mathutils").Vector(corner)
            for i in range(3):
                min_c[i] = min(min_c[i], w[i])
                max_c[i] = max(max_c[i], w[i])

    height = max(0.01, max_c[2] - min_c[2])
    scale = 1.75 / height

    for o in after:
        o.parent = root

    root.scale = (scale, scale, scale)
    root.location = (0, 0.95, -min_c[2] * scale)
    root.rotation_euler = (0, 0, 0)

    # Find best mesh (largest)
    main_mesh = max(meshes, key=lambda o: len(o.data.vertices)) if meshes else None

    # Find jaw / head / eye bones if present
    jaw_bone = None
    head_bone = None
    eye_l = None
    eye_r = None
    arm = armatures[0] if armatures else None
    if arm and arm.pose:
        for pb in arm.pose.bones:
            n = pb.name.lower()
            if "jaw" in n:
                jaw_bone = pb
            elif n in ("head", "head_end", "mixamorig:head") or n.endswith("head"):
                head_bone = pb
            elif "lefteye" in n or "eye_l" in n or "left_eye" in n:
                eye_l = pb
            elif "righteye" in n or "eye_r" in n or "right_eye" in n:
                eye_r = pb

    print("MIKE_IMPORT", glb_path.name,
          "meshes", len(meshes),
          "armatures", len(armatures),
          "height", round(height, 3),
          "scale", round(scale, 3),
          "jaw", bool(jaw_bone),
          "head_bone", bool(head_bone),
          "shape_keys", bool(main_mesh and main_mesh.data.shape_keys))

    return root, main_mesh, arm, jaw_bone, head_bone, eye_l, eye_r


# ---------------------------------------------------------------------------
# Shape-key helpers (create simple ones if missing)
# ---------------------------------------------------------------------------
def ensure_shape_keys(mesh_obj):
    """Create basic mouth_open + blink shape keys if the mesh has none.
    These are crude vertex pushes — better than a frozen face.
    """
    if mesh_obj is None:
        return {}

    me = mesh_obj.data
    if me.shape_keys is None:
        mesh_obj.shape_key_add(name="Basis", from_mix=False)

    keys = {}
    sk = me.shape_keys
    existing = {kb.name.lower(): kb for kb in sk.key_blocks}

    # mouth_open — push lower vertices slightly down + forward
    if "mouth_open" not in existing and "mouthopen" not in existing:
        kb = mesh_obj.shape_key_add(name="mouth_open", from_mix=False)
        # Crude: move vertices in lower half of the head region
        # (works better on some Tripo meshes than others)
        for i, v in enumerate(me.vertices):
            # Only affect a band around mouth height (heuristic)
            if 0.55 < v.co.z < 0.85 and abs(v.co.x) < 0.18:
                kb.data[i].co.z -= 0.012
                kb.data[i].co.y += 0.008
        keys["mouth_open"] = kb
    else:
        keys["mouth_open"] = existing.get("mouth_open") or existing.get("mouthopen")

    # blink — scale / push eyelid region (very approximate)
    if "blink" not in existing and "eyeblink" not in existing:
        kb = mesh_obj.shape_key_add(name="blink", from_mix=False)
        for i, v in enumerate(me.vertices):
            if 0.95 < v.co.z < 1.15 and abs(v.co.x) < 0.22:
                kb.data[i].co.z -= 0.006
        keys["blink"] = kb
    else:
        keys["blink"] = existing.get("blink") or existing.get("eyeblink")

    return keys


# ---------------------------------------------------------------------------
# Facial + body animation
# ---------------------------------------------------------------------------
def animate_face_and_body(root, mesh_obj, arm, jaw_bone, head_bone,
                          eye_l, eye_r, fps, total_frames):
    """Drive everything with keyframes. Speech windows get stronger mouth."""
    random.seed(42)  # reproducible

    # Ensure shape keys exist
    sk_map = ensure_shape_keys(mesh_obj) if mesh_obj else {}

    # Speech windows (approximate teaching sections) — seconds
    speech_windows = [
        (0.8, 3.5),
        (4.2, 7.0),
        (8.0, 11.2),
    ]

    def in_speech(t):
        for a, b in speech_windows:
            if a <= t <= b:
                return True
        return False

    # Blink schedule (every 2.5–4.5 s)
    blink_times = []
    t = 1.2
    while t < (total_frames / fps) - 0.4:
        blink_times.append(t)
        t += random.uniform(2.4, 4.2)

    for f in range(1, total_frames + 1):
        t = f / float(fps)

        # ---- Body root sway (gentle) ----
        root.rotation_euler = (
            0,
            0,
            math.radians(2.5 * math.sin(t * 1.15)),
        )
        root.keyframe_insert(data_path="rotation_euler", frame=f)
        base_z = root.location.z
        root.location.z = base_z + 0.008 * math.sin(t * 2.1)
        root.keyframe_insert(data_path="location", frame=f, index=2)

        # ---- Head micro-motion ----
        if head_bone is not None:
            try:
                head_bone.rotation_euler = (
                    math.radians(1.8 * math.sin(t * 0.9)),
                    math.radians(1.2 * math.sin(t * 1.3)),
                    math.radians(2.5 * math.sin(t * 1.1)),
                )
                head_bone.keyframe_insert(data_path="rotation_euler", frame=f)
            except Exception:
                pass

        # ---- Jaw / mouth ----
        mouth_amt = 0.0
        if in_speech(t):
            # Oscillate while speaking (phoneme-ish)
            mouth_amt = 0.35 + 0.45 * abs(math.sin(t * 9.5))
            mouth_amt *= 0.7 + 0.3 * abs(math.sin(t * 3.2))  # vary intensity
        else:
            mouth_amt = 0.04 * abs(math.sin(t * 1.8))  # tiny rest movement

        # Drive shape key if present
        if "mouth_open" in sk_map and sk_map["mouth_open"] is not None:
            try:
                sk_map["mouth_open"].value = mouth_amt
                sk_map["mouth_open"].keyframe_insert(data_path="value", frame=f)
            except Exception:
                pass

        # Drive jaw bone if present
        if jaw_bone is not None:
            try:
                # Most Mixamo-style jaws rotate on X
                jaw_bone.rotation_euler = (
                    math.radians(12.0 * mouth_amt),
                    0,
                    0,
                )
                jaw_bone.keyframe_insert(data_path="rotation_euler", frame=f)
            except Exception:
                pass

        # ---- Blinks ----
        blink_val = 0.0
        for bt in blink_times:
            # 3-frame blink
            if abs(t - bt) < 0.06:
                blink_val = 1.0
            elif abs(t - bt) < 0.12:
                blink_val = 0.4

        if "blink" in sk_map and sk_map["blink"] is not None:
            try:
                sk_map["blink"].value = blink_val
                sk_map["blink"].keyframe_insert(data_path="value", frame=f)
            except Exception:
                pass

        # Eye bones (tiny look-around)
        if eye_l is not None:
            try:
                eye_l.rotation_euler = (
                    math.radians(2.0 * math.sin(t * 0.7)),
                    math.radians(3.0 * math.sin(t * 0.55)),
                    0,
                )
                eye_l.keyframe_insert(data_path="rotation_euler", frame=f)
            except Exception:
                pass
        if eye_r is not None:
            try:
                eye_r.rotation_euler = (
                    math.radians(2.0 * math.sin(t * 0.7 + 0.3)),
                    math.radians(3.0 * math.sin(t * 0.55 + 0.2)),
                    0,
                )
                eye_r.keyframe_insert(data_path="rotation_euler", frame=f)
            except Exception:
                pass


# ---------------------------------------------------------------------------
# NLA body clips (if the GLB already has actions)
# ---------------------------------------------------------------------------
def try_nla_body_clips(arm, fps, total_frames):
    """If Mikeanim.glb brought actions, try to sequence a couple of them."""
    if arm is None:
        return
    actions = list(bpy.data.actions)
    if not actions:
        return

    # Prefer known teaching / gesture names
    preferred = []
    for a in actions:
        n = a.name.lower()
        if any(k in n for k in ("agree", "talk", "teach", "gesture", "idle", "alert")):
            preferred.append(a)
    if not preferred:
        preferred = actions[:3]

    try:
        if not arm.animation_data:
            arm.animation_data_create()
        track = arm.animation_data.nla_tracks.new()
        track.name = "BodyClips"
        start = 1
        for a in preferred[:3]:
            # Rough length
            length = max(24, int(a.frame_range[1] - a.frame_range[0]))
            strip = track.strips.new(a.name, start, a)
            strip.frame_end = start + length
            start += length + 4
            if start > total_frames:
                break
        print("NLA_CLIPS", [a.name for a in preferred[:3]])
    except Exception as e:
        print("NLA_SKIP", str(e))


# ---------------------------------------------------------------------------
# Render
# ---------------------------------------------------------------------------
def setup_render(frame_dir: Path, fps, total_frames, width, height):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    try:
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "TEXTURE"
        scene.display.shading.show_shadows = True
    except Exception:
        pass
    try:
        scene.view_settings.exposure = 0.35
        scene.view_settings.gamma = 1.05
    except Exception:
        pass

    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = total_frames
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.filepath = str(frame_dir / "frame_")


def frames_to_mp4(frame_dir: Path, out: Path, fps: int):
    frames = sorted(frame_dir.glob("frame_*.png"))
    if not frames:
        raise SystemExit(f"No frames in {frame_dir}")
    list_file = frame_dir / "list.txt"
    list_file.write_text("".join(f"file '{f.resolve()}'\n" for f in frames), encoding="utf-8")
    subprocess.check_call([
        "ffmpeg", "-y", "-r", str(fps),
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-crf", "18", "-movflags", "+faststart",
        str(out),
    ])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    args = parse_args(sys.argv)
    fps = int(args.get("fps", 24))
    seconds = min(max(float(args["seconds"]), 2.0), 20.0)
    total_frames = max(fps, int(round(seconds * fps)))
    width = int(args.get("width", 720))
    height = int(args.get("height", 1280))
    glb = Path(args["glb"]).resolve()

    print("START", "seconds", seconds, "frames", total_frames, "glb", glb)

    clear_scene()
    build_bright_studio()
    root, main_mesh, arm, jaw, head, eye_l, eye_r = import_mike(glb)

    # Body NLA if available
    try_nla_body_clips(arm, fps, total_frames)

    # Face + body procedural
    animate_face_and_body(root, main_mesh, arm, jaw, head, eye_l, eye_r,
                          fps, total_frames)

    with tempfile.TemporaryDirectory(prefix="mike_frames_") as tmp:
        frame_dir = Path(tmp)
        setup_render(frame_dir, fps, total_frames, width, height)
        print("RENDERING", total_frames, "frames…")
        bpy.ops.render.render(animation=True)
        out = Path(args["out"]).resolve()
        out.parent.mkdir(parents=True, exist_ok=True)
        frames_to_mp4(frame_dir, out, fps)
        print("DONE", out)


if __name__ == "__main__":
    main()
