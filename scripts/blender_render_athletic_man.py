#!/usr/bin/env python3
"""Headless Blender: import Athletic_man.fbx, studio light, render 5 stills. Hardened for Actions."""
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
RES_X = int(os.environ.get("FIN_RES_X", "1080"))
RES_Y = int(os.environ.get("FIN_RES_Y", "1920"))

os.makedirs(OUT_DIR, exist_ok=True)

def log(*a):
    print(*a, flush=True)

def hard_exit(code, msg):
    print(msg, file=sys.stderr, flush=True)
    sys.exit(code)

try:
    # Reset to empty factory-like scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
except Exception:
    try:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.delete(use_global=False)
    except Exception:
        pass

if not os.path.isfile(FBX):
    hard_exit(2, f"MISSING FBX: {FBX}")

log("Importing", FBX, "size", os.path.getsize(FBX))
try:
    # Avoid automatic_bone_orientation — crashes some FBX 7400 exports headless
    bpy.ops.import_scene.fbx(
        filepath=FBX,
        use_image_search=False,
        ignore_leaf_bones=True,
        automatic_bone_orientation=False,
    )
except Exception as e:
    traceback.print_exc()
    hard_exit(3, f"FBX import failed: {e}")

log("Objects after import:", [o.name for o in bpy.context.scene.objects][:40])

# Separate meshes vs armature
all_objs = list(bpy.context.scene.objects)
meshes = [o for o in all_objs if o.type == "MESH"]
armatures = [o for o in all_objs if o.type == "ARMATURE"]
log("meshes", len(meshes), "armatures", len(armatures))

if not meshes:
    hard_exit(4, "No mesh after FBX import")

# World
scene = bpy.context.scene
if scene.world is None:
    scene.world = bpy.data.worlds.new("StudioWorld")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes.get("Background")
if bg:
    bg.inputs[0].default_value = (0.02, 0.025, 0.04, 1.0)
    bg.inputs[1].default_value = 0.35

# Floor
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "FloorDark"
mat = bpy.data.materials.new(name="FloorDarkMat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.03, 0.035, 0.045, 1)
    bsdf.inputs["Roughness"].default_value = 0.9
floor.data.materials.append(mat)

# Bounds + scale character (meshes only)
min_c = mathutils.Vector((1e9, 1e9, 1e9))
max_c = mathutils.Vector((-1e9, -1e9, -1e9))
for o in meshes:
    try:
        for corner in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(corner)
            min_c.x, min_c.y, min_c.z = min(min_c.x, w.x), min(min_c.y, w.y), min(min_c.z, w.z)
            max_c.x, max_c.y, max_c.z = max(max_c.x, w.x), max(max_c.y, w.y), max(max_c.z, w.z)
    except Exception as e:
        log("bound skip", o.name, e)

height = max(0.05, max_c.z - min_c.z)
scale = 1.65 / height
log("bounds height", height, "scale", scale)

# Scale roots preferred: armature if present else each mesh
roots = armatures if armatures else meshes
for o in roots:
    o.scale = (o.scale.x * scale, o.scale.y * scale, o.scale.z * scale)
bpy.context.view_layer.update()

# Recompute z after scale
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

# Camera
bpy.ops.object.camera_add(location=(0.0, -3.2, 1.55), rotation=(math.radians(82), 0, 0))
cam = bpy.context.object
cam.name = "PilotCam"
scene.camera = cam

# Lights
bpy.ops.object.light_add(type="AREA", location=(1.8, -1.5, 2.6))
key = bpy.context.object
key.data.energy = 250
key.data.size = 2.0

bpy.ops.object.light_add(type="AREA", location=(-2.2, 0.8, 2.0))
fill = bpy.context.object
fill.data.energy = 80
fill.data.size = 3.0

bpy.ops.object.light_add(type="AREA", location=(0.0, 2.5, 2.2))
rim = bpy.context.object
rim.data.energy = 60
rim.data.size = 2.5

# Render settings — WORKBENCH is safest headless on CPU Actions
try:
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
except Exception as e:
    log("workbench fail, try EEVEE", e)
    try:
        scene.render.engine = "BLENDER_EEVEE"
    except Exception:
        scene.render.engine = "CYCLES"
        scene.cycles.device = "CPU"
        scene.cycles.samples = 32

scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.filepath = os.path.join(OUT_DIR, "pose_")

poses = [
    ("front", (0.0, -3.1, 1.5), (math.radians(85), 0, 0)),
    ("three_quarter", (1.3, -2.8, 1.55), (math.radians(84), 0, math.radians(16))),
    ("side", (2.5, -1.3, 1.5), (math.radians(88), 0, math.radians(52))),
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
    # Absolute last resort: solid frame so pipeline can continue testing VO path
    fallback = os.path.join(OUT_DIR, "pose_front.png")
    try:
        scene.render.filepath = fallback
        bpy.ops.render.render(write_still=True)
    except Exception:
        traceback.print_exc()
    if not (os.path.isfile(fallback) and os.path.getsize(fallback) > 1000):
        hard_exit(5, "Not enough rendered poses")
    paths = [fallback]

log("RENDER_OK", len(paths))
for p in paths:
    log(p)
