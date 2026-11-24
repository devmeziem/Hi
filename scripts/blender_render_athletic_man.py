#!/usr/bin/env python3
"""Headless Blender Athletic_man.fbx — Cycles CPU only (no EGL required)."""
import traceback
import math
import os
import sys

try:
    import bpy
    import mathutils
except Exception as e:
    print("BLENDER_IMPORT_FAIL", e, file=sys.stderr)
    sys.exit(10)

FBX = os.environ.get("FIN_FBX_PATH", "assets/characters/Athletic_man.fbx")
OUT_DIR = os.environ.get("FIN_RENDER_DIR", "test_artifacts/fin_character")
RES_X = int(os.environ.get("FIN_RES_X", "720"))
RES_Y = int(os.environ.get("FIN_RES_Y", "1280"))
SAMPLES = int(os.environ.get("FIN_SAMPLES", "24"))

os.makedirs(OUT_DIR, exist_ok=True)

def log(*a):
    print(*a, flush=True)

def hard_exit(code, msg):
    print(msg, file=sys.stderr, flush=True)
    sys.exit(code)

try:
    bpy.ops.wm.read_factory_settings(use_empty=True)
except Exception:
    try:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
    except Exception:
        pass

if not os.path.isfile(FBX):
    hard_exit(2, f"MISSING FBX: {FBX}")

log("Importing", FBX, os.path.getsize(FBX))
try:
    bpy.ops.import_scene.fbx(
        filepath=FBX,
        use_image_search=False,
        ignore_leaf_bones=True,
        automatic_bone_orientation=False,
    )
except Exception as e:
    traceback.print_exc()
    hard_exit(3, f"FBX import failed: {e}")

all_objs = list(bpy.context.scene.objects)
meshes = [o for o in all_objs if o.type == "MESH"]
armatures = [o for o in all_objs if o.type == "ARMATURE"]
log("objects", [o.name for o in all_objs][:20])
log("meshes", len(meshes), "armatures", len(armatures))
if not meshes:
    hard_exit(4, "No mesh after FBX import")

scene = bpy.context.scene
if scene.world is None:
    scene.world = bpy.data.worlds.new("StudioWorld")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.02, 0.03, 0.05, 1.0)
    bg.inputs[1].default_value = 0.4

bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "FloorDark"
mat = bpy.data.materials.new(name="FloorDarkMat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.025, 0.03, 0.04, 1)
    bsdf.inputs["Roughness"].default_value = 0.92
floor.data.materials.append(mat)

min_c = mathutils.Vector((1e9, 1e9, 1e9))
max_c = mathutils.Vector((-1e9, -1e9, -1e9))
for o in meshes:
    try:
        for corner in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(corner)
            min_c = mathutils.Vector((min(min_c.x, w.x), min(min_c.y, w.y), min(min_c.z, w.z)))
            max_c = mathutils.Vector((max(max_c.x, w.x), max(max_c.y, w.y), max(max_c.z, w.z)))
    except Exception as e:
        log("bound skip", o.name, e)

height = max(0.05, max_c.z - min_c.z)
scale = 1.65 / height
log("height", height, "scale", scale)
roots = armatures if armatures else meshes
for o in roots:
    o.scale = (o.scale.x * scale, o.scale.y * scale, o.scale.z * scale)
bpy.context.view_layer.update()

min_z = 1e9
for o in meshes:
    try:
        for corner in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(corner)
            min_z = min(min_z, w.z)
    except Exception:
        pass
for o in roots:
    o.location.z -= min_z
bpy.context.view_layer.update()

bpy.ops.object.camera_add(location=(0.0, -3.2, 1.55), rotation=(math.radians(82), 0, 0))
cam = bpy.context.object
scene.camera = cam

bpy.ops.object.light_add(type="AREA", location=(1.8, -1.5, 2.6))
key = bpy.context.object
key.data.energy = 400
key.data.size = 2.2

bpy.ops.object.light_add(type="AREA", location=(-2.2, 0.8, 2.0))
fill = bpy.context.object
fill.data.energy = 120
fill.data.size = 3.0

bpy.ops.object.light_add(type="AREA", location=(0.0, 2.5, 2.2))
rim = bpy.context.object
rim.data.energy = 90
rim.data.size = 2.5

# Cycles CPU only — avoids libEGL / GPU display on Actions
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = False
try:
    scene.cycles.preview_samples = max(8, SAMPLES // 2)
except Exception:
    pass

scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.use_persistent_data = True

poses = [
    ("front", (0.0, -3.1, 1.5), (math.radians(85), 0, 0)),
    ("three_quarter", (1.3, -2.8, 1.55), (math.radians(84), 0, math.radians(16))),
    ("side", (2.4, -1.4, 1.5), (math.radians(88), 0, math.radians(50))),
    ("close", (0.15, -2.3, 1.62), (math.radians(88), 0, math.radians(4))),
    ("low", (0.0, -2.9, 1.2), (math.radians(76), 0, 0)),
]

paths = []
for name, loc, rot in poses:
    try:
        cam.location = loc
        cam.rotation_euler = rot
        out = os.path.join(OUT_DIR, f"pose_{name}.png")
        scene.render.filepath = out
        log("Rendering", out)
        bpy.ops.render.render(write_still=True)
        if os.path.isfile(out) and os.path.getsize(out) > 2000:
            paths.append(out)
            log("OK", out, os.path.getsize(out))
        else:
            log("EMPTY", out)
    except Exception:
        traceback.print_exc()

if len(paths) < 1:
    hard_exit(5, "Not enough rendered poses")

log("RENDER_OK", len(paths))
for p in paths:
    log(p)
