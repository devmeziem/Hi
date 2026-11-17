#!/usr/bin/env python3
"""Headless Blender: import Athletic_man.fbx, simple studio light, render 5 stills + short turn."""
import bpy
import math
import os
import sys

FBX = os.environ.get("FIN_FBX_PATH", "assets/characters/Athletic_man.fbx")
OUT_DIR = os.environ.get("FIN_RENDER_DIR", "test_artifacts/fin_character")
RES_X = int(os.environ.get("FIN_RES_X", "1080"))
RES_Y = int(os.environ.get("FIN_RES_Y", "1920"))

os.makedirs(OUT_DIR, exist_ok=True)

# Clean scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

if not os.path.isfile(FBX):
    print(f"MISSING FBX: {FBX}", file=sys.stderr)
    sys.exit(2)

print(f"Importing {FBX}")
try:
    bpy.ops.import_scene.fbx(filepath=FBX, automatic_bone_orientation=True)
except Exception as e:
    print(f"FBX import failed: {e}", file=sys.stderr)
    sys.exit(3)

# Camera + light
bpy.ops.object.camera_add(location=(0.0, -3.2, 1.55), rotation=(math.radians(82), 0, 0))
cam = bpy.context.object
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type="AREA", location=(1.5, -1.2, 2.8))
key = bpy.context.object
key.data.energy = 400
key.data.size = 2.5

bpy.ops.object.light_add(type="AREA", location=(-2.0, 1.0, 2.0))
fill = bpy.context.object
fill.data.energy = 120
fill.data.size = 3.0

# Floor
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
floor = bpy.context.object
mat = bpy.data.materials.new(name="FloorDark")
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.04, 0.05, 0.07, 1)
nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
floor.data.materials.append(mat)

# World
world = bpy.data.worlds.new("Studio")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.03, 0.035, 0.05, 1)
bg.inputs[1].default_value = 0.4

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE_NEXT" if hasattr(bpy.types, "BLENDER_EEVEE_NEXT") else "BLENDER_EEVEE"
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False

# Center character roughly
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and o != floor]
if meshes:
    # mild scale if huge/tiny
    import mathutils
    min_c = mathutils.Vector((1e9, 1e9, 1e9))
    max_c = mathutils.Vector((-1e9, -1e9, -1e9))
    for o in meshes:
        for corner in o.bound_box:
            w = o.matrix_world @ mathutils.Vector(corner)
            min_c = mathutils.Vector((min(min_c.x, w.x), min(min_c.y, w.y), min(min_c.z, w.z)))
            max_c = mathutils.Vector((max(max_c.x, w.x), max(max_c.y, w.y), max(max_c.z, w.z)))
    height = max(0.01, max_c.z - min_c.z)
    scale = 1.7 / height
    for o in meshes:
        o.scale *= scale
        o.location.z -= min_c.z * scale
    bpy.context.view_layer.update()

poses = [
    ("front", (0.0, -3.0, 1.5), (math.radians(85), 0, 0)),
    ("three_quarter", (1.4, -2.7, 1.55), (math.radians(84), 0, math.radians(18))),
    ("side", (2.6, -1.2, 1.5), (math.radians(88), 0, math.radians(55))),
    ("close", (0.2, -2.2, 1.65), (math.radians(88), 0, math.radians(5))),
    ("low", (0.0, -2.8, 1.15), (math.radians(75), 0, 0)),
]

paths = []
for name, loc, rot in poses:
    cam.location = loc
    cam.rotation_euler = rot
    out = os.path.join(OUT_DIR, f"pose_{name}.png")
    scene.render.filepath = out
    print(f"Rendering {out}")
    bpy.ops.render.render(write_still=True)
    paths.append(out)

print("RENDER_OK")
for p in paths:
    print(p)
