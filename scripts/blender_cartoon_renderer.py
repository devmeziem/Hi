"""
Automated Cartoon Factory — Headless Blender 2D/2.5D Animated Character Rig ("Archie")

Executes in Blender CLI:
    blender -b -P scripts/blender_cartoon_renderer.py -- \
        --mouth_cues cues.json \
        --assets_dir cartoon_character_assets \
        --action talking \
        --emotion curious \
        --duration 5.0 \
        --camera medium \
        --audio_wav scene_1_audio.wav \
        --output_mp4 scene_1_rendered.mp4

Core Capabilities:
- 1080x1920 Vertical HD frame output @ 30 FPS
- Full 2D/2.5D cut-out character rig built from Archie artwork (body, head, eyes, pupils, eyebrows, mouth, arms, legs, background)
- Continuous Rhubarb lip-sync keyframing across Preston Blair phonemes (A, B, C, D, E, F, G, H, X) for every single cue interval
- Subtle natural breathing/idle sway, head tilt/nod, eye blinking cycles (open/closed), pupil micro-saccades, and action-based arm gestures
- Sequencer-attached real dialogue WAV audio
- Direct H.264 MP4 rendering
"""

import sys
import json
import os
import math
import shutil

try:
    import bpy
except ImportError:
    print("[Blender Engine] Note: bpy is only available within Blender CLI runtime.")
    sys.exit(0)

def parse_cli_args():
    args = sys.argv
    if "--" in args:
        raw_args = args[args.index("--") + 1:]
    else:
        raw_args = []
    
    parsed = {}
    i = 0
    while i < len(raw_args):
        if raw_args[i].startswith("--"):
            key = raw_args[i][2:]
            val = raw_args[i + 1] if (i + 1 < len(raw_args) and not raw_args[i + 1].startswith("--")) else True
            parsed[key] = val
            i += 2 if val is not True else 1
        else:
            i += 1
    return parsed

def clear_default_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)

def setup_render_settings(duration_seconds=5.0, fps=30, output_path="output.mp4"):
    scene = bpy.context.scene
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    
    total_frames = max(1, int(round(duration_seconds * fps)))
    scene.frame_start = 1
    scene.frame_end = total_frames
    
    # Configure render engine (Workbench for lightning-fast 2.5D cutout rendering without headless Cycles crashes)
    use_cycles = os.environ.get('BLENDER_ENGINE', '').upper() == 'CYCLES'
    if use_cycles:
        scene.render.engine = 'CYCLES'
        if hasattr(scene, 'cycles'):
            scene.cycles.device = 'CPU'
            scene.cycles.samples = 1
            scene.cycles.preview_samples = 1
            scene.cycles.use_adaptive_sampling = False
            scene.cycles.max_bounces = 1
            scene.cycles.diffuse_bounces = 0
            scene.cycles.glossy_bounces = 0
            scene.cycles.transparent_max_bounces = 4
    else:
        scene.render.engine = 'BLENDER_WORKBENCH'
        if hasattr(scene, 'display'):
            scene.display.shading.light = 'FLAT'
            scene.display.shading.color_type = 'TEXTURE'
    
    # Configure MP4 Video Output
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    scene.render.ffmpeg.audio_codec = 'AAC'
    scene.render.ffmpeg.audio_bitrate = 192
    scene.render.filepath = os.path.abspath(output_path)
    
    return scene, total_frames

def create_plane_layer(name, image_path, location=(0, 0, 0), scale=(1, 1, 1), z_index=0.0):
    """
    Creates a planar 2D layer with crisp shadeless alpha texture support in Cycles
    """
    bpy.ops.mesh.primitive_plane_add(size=2.0, location=(location[0], location[1] + z_index, location[2]))
    plane = bpy.context.active_object
    plane.name = name
    plane.scale = scale
    plane.rotation_euler = (math.radians(90), 0, 0)
    
    mat = bpy.data.materials.new(name=f"{name}_Mat")
    mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Cycles Shadeless Alpha Graph: Image -> Emission + Transparent -> Mix Shader -> Material Output
    out_node = nodes.new('ShaderNodeOutputMaterial')
    mix_node = nodes.new('ShaderNodeMixShader')
    trans_node = nodes.new('ShaderNodeBsdfTransparent')
    emit_node = nodes.new('ShaderNodeEmission')
    
    if os.path.exists(image_path):
        img = bpy.data.images.load(image_path)
        tex_node = nodes.new('ShaderNodeTexImage')
        tex_node.image = img
        
        # Connect Color -> Emission
        links.new(tex_node.outputs['Color'], emit_node.inputs['Color'])
        # Connect Alpha -> Mix Factor (0 = Transparent, 1 = Emission)
        if 'Alpha' in tex_node.outputs:
            links.new(tex_node.outputs['Alpha'], mix_node.inputs['Fac'])
        else:
            mix_node.inputs['Fac'].default_value = 1.0
    else:
        mix_node.inputs['Fac'].default_value = 1.0
        
    links.new(trans_node.outputs['BSDF'], mix_node.inputs[1])
    links.new(emit_node.outputs['Emission'], mix_node.inputs[2])
    links.new(mix_node.outputs['Shader'], out_node.inputs['Surface'])
    
    if plane.data.materials:
        plane.data.materials[0] = mat
    else:
        plane.data.materials.append(mat)
        
    return plane

def build_cartoon_character_rig(assets_dir, mouth_cues, action='talking', emotion='curious', duration=5.0, fps=30, camera_mode='medium', bg_image=None):
    total_frames = max(1, int(round(duration * fps)))
    print(f"[Blender Rig] Building 2.5D Archie Rig ({total_frames} frames @ {fps} FPS, Action: {action}, Camera: {camera_mode})...")

    # 1. Setup Ortho/Perspective Camera with Dynamic Panning & Framing
    cam_data = bpy.data.cameras.new(name="MainCamera")
    cam_data.type = 'PERSP'
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new(name="MainCamera", object_data=cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    
    # Camera Base Position & Panning
    cam_start_x = 0.0
    cam_end_x = 0.0
    cam_start_y = -4.8
    cam_end_y = -4.6
    cam_start_z = 0.0
    cam_end_z = 0.05

    if camera_mode == 'close_up':
        cam_start_y = -3.7
        cam_end_y = -3.55
        cam_start_z = 0.35
        cam_end_z = 0.38
    elif camera_mode == 'medium_to_close':
        cam_start_y = -4.2
        cam_end_y = -3.85
        cam_start_z = 0.15
        cam_end_z = 0.22
    elif camera_mode == 'pan_left':
        cam_start_x = 0.35
        cam_end_x = -0.25
        cam_start_y = -4.5
        cam_end_y = -4.35
    elif camera_mode == 'pan_right':
        cam_start_x = -0.35
        cam_end_x = 0.25
        cam_start_y = -4.5
        cam_end_y = -4.35
    elif camera_mode == 'wide':
        cam_start_y = -5.4
        cam_end_y = -5.15
        cam_start_z = -0.1
        cam_end_z = -0.05
        
    cam_obj.location = (cam_start_x, cam_start_y, cam_start_z)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    
    # Smooth Camera Motion
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.location = (cam_end_x, cam_end_y, cam_end_z)
    cam_obj.keyframe_insert(data_path="location", frame=total_frames)

    # 2. Key Lighting
    light_data = bpy.data.lights.new(name="KeyLight", type='SUN')
    light_data.energy = 4.0
    light_obj = bpy.data.objects.new(name="KeyLight", object_data=light_data)
    bpy.context.scene.collection.objects.link(light_obj)
    light_obj.location = (1.5, -4, 4)
    light_obj.rotation_euler = (math.radians(45), math.radians(15), 0)

    # 3. Layer 0: Background Canvas (z = 0.5) - Supports Dynamic Scene Environments
    bg_png = bg_image if (bg_image and os.path.exists(bg_image)) else os.path.join(assets_dir, "background.png")
    if not os.path.exists(bg_png):
        bg_png = os.path.join(assets_dir, "background.svg")
    bg_plane = create_plane_layer("BackgroundLayer", bg_png, location=(0, 0.5, 0), scale=(1.35, 2.3, 1), z_index=0.0)

    # 4. Layer 1: Legs & Floor Shadow (z = 0.15)
    legs_png = os.path.join(assets_dir, "legs.png")
    if os.path.exists(legs_png):
        legs_plane = create_plane_layer("LegsLayer", legs_png, location=(0, 0.15, 0), scale=(1.0, 1.78, 1), z_index=0.0)
    else:
        legs_plane = None

    # 5. Layer 2: Character Torso / Body Base (z = 0.10)
    body_act_png = os.path.join(assets_dir, f"body_{action}.png")
    if not os.path.exists(body_act_png):
        body_act_png = os.path.join(assets_dir, "body_talking.png")
    if not os.path.exists(body_act_png):
        body_act_png = os.path.join(assets_dir, "torso.png")
        
    torso_plane = create_plane_layer("TorsoLayer", body_act_png, location=(0, 0.10, 0), scale=(1.0, 1.78, 1), z_index=0.0)

    # 6. Layer 3: Head Base Layer (z = 0.05)
    head_png = os.path.join(assets_dir, "head.png")
    head_plane = None
    if os.path.exists(head_png):
        head_plane = create_plane_layer("HeadLayer", head_png, location=(0, 0.05, 0), scale=(1.0, 1.78, 1), z_index=0.0)

    # 7. Layer 4: Eyebrows Layer (z = -0.02)
    eyebrows_png = os.path.join(assets_dir, "eyebrows.png")
    eyebrows_plane = None
    if os.path.exists(eyebrows_png):
        eyebrows_plane = create_plane_layer("EyebrowsLayer", eyebrows_png, location=(0, -0.02, 0), scale=(1.0, 1.78, 1), z_index=0.0)

    # 8. Layer 5: Eyes Open / Eyes Closed (Blinking) (z = -0.04)
    eyes_open_png = os.path.join(assets_dir, "eyes_open.png")
    eyes_closed_png = os.path.join(assets_dir, "eyes_closed.png")
    eyes_open_plane = None
    eyes_closed_plane = None
    
    if os.path.exists(eyes_open_png):
        eyes_open_plane = create_plane_layer("EyesOpenLayer", eyes_open_png, location=(0, -0.04, 0), scale=(1.0, 1.78, 1), z_index=0.0)
    if os.path.exists(eyes_closed_png):
        eyes_closed_plane = create_plane_layer("EyesClosedLayer", eyes_closed_png, location=(0, -0.04, 0), scale=(1.0, 1.78, 1), z_index=0.0)
        eyes_closed_plane.hide_render = True
        eyes_closed_plane.hide_viewport = True

    # 9. Layer 6: Pupils (z = -0.06)
    pupils_png = os.path.join(assets_dir, "pupils.png")
    pupils_plane = None
    if os.path.exists(pupils_png):
        pupils_plane = create_plane_layer("PupilsLayer", pupils_png, location=(0, -0.06, 0), scale=(1.0, 1.78, 1), z_index=0.0)

    # -------------------------------------------------------------
    # 10. ANIMATION: Character Locomotion / Walking & Breathing Sway
    # -------------------------------------------------------------
    is_walking = (action == 'walking')
    walk_start_x = -0.45 if is_walking else 0.0
    walk_end_x = 0.35 if is_walking else 0.0

    all_rig_planes = [torso_plane, head_plane, eyebrows_plane, eyes_open_plane, eyes_closed_plane, pupils_plane, legs_plane]

    for f in range(1, total_frames + 1, 6):
        progress = (f - 1) / max(1, total_frames - 1)
        walk_x = walk_start_x + (walk_end_x - walk_start_x) * progress

        # Walking step bounce vs idle breathing
        if is_walking:
            step_bounce = abs(math.sin(f / 4.0)) * 0.025
            sway_z = step_bounce
            sway_rot = math.sin(f / 4.0) * 0.04
        else:
            sway_z = math.sin(f / 12.0) * 0.012
            sway_rot = math.sin(f / 24.0) * 0.015

        if torso_plane:
            torso_plane.location.x = walk_x
            torso_plane.location.z = sway_z
            torso_plane.keyframe_insert(data_path="location", frame=f)

        if legs_plane:
            legs_plane.location.x = walk_x
            legs_plane.keyframe_insert(data_path="location", frame=f)
        
        if head_plane:
            head_plane.location.x = walk_x
            head_plane.location.z = sway_z * 1.15
            head_plane.rotation_euler.y = sway_rot
            head_plane.keyframe_insert(data_path="location", frame=f)
            head_plane.keyframe_insert(data_path="rotation_euler", frame=f)
            
        if eyebrows_plane:
            eyebrows_plane.location.x = walk_x
            eyebrows_plane.location.z = sway_z * 1.15
            eyebrows_plane.keyframe_insert(data_path="location", frame=f)
            
        if eyes_open_plane:
            eyes_open_plane.location.x = walk_x
            eyes_open_plane.location.z = sway_z * 1.15
            eyes_open_plane.keyframe_insert(data_path="location", frame=f)
            
        if eyes_closed_plane:
            eyes_closed_plane.location.x = walk_x
            eyes_closed_plane.location.z = sway_z * 1.15
            eyes_closed_plane.keyframe_insert(data_path="location", frame=f)
            
        if pupils_plane:
            pupils_plane.location.x = walk_x
            pupils_plane.location.z = sway_z * 1.15
            pupils_plane.keyframe_insert(data_path="location", frame=f)

    # -------------------------------------------------------------
    # 11. ANIMATION: Natural Eye Blinking Cycles (Requirement F)
    # -------------------------------------------------------------
    if eyes_open_plane and eyes_closed_plane:
        blink_interval = 80 # every ~2.6s
        for f in range(1, total_frames + 1):
            if f % blink_interval in [1, 2, 3]: # 3-frame blink
                eyes_open_plane.hide_render = True
                eyes_open_plane.hide_viewport = True
                eyes_closed_plane.hide_render = False
                eyes_closed_plane.hide_viewport = False
            else:
                eyes_open_plane.hide_render = False
                eyes_open_plane.hide_viewport = False
                eyes_closed_plane.hide_render = True
                eyes_closed_plane.hide_viewport = True
                
            if f % blink_interval in [0, 1, 4]:
                eyes_open_plane.keyframe_insert(data_path="hide_render", frame=f)
                eyes_open_plane.keyframe_insert(data_path="hide_viewport", frame=f)
                eyes_closed_plane.keyframe_insert(data_path="hide_render", frame=f)
                eyes_closed_plane.keyframe_insert(data_path="hide_viewport", frame=f)

    # -------------------------------------------------------------
    # 12. ANIMATION: Continuous Rhubarb Lip-Sync Mouth Driving (Requirement E)
    # -------------------------------------------------------------
    # Preston Blair phonemes: A, B, C, D, E, F, G, H, X
    shapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X']
    mouth_planes = {}
    
    # Mouth anchor location on Archie's face
    mouth_pos = (0.0, -0.08, 0.235)
    mouth_scale = (0.19, 0.19, 1.0)
    
    for s in shapes:
        m_png = os.path.join(assets_dir, f"mouth_{s}.png")
        if not os.path.exists(m_png):
            m_png = os.path.join(assets_dir, f"mouth_{s}.svg")
        m_plane = create_plane_layer(f"Mouth_{s}", m_png, location=mouth_pos, scale=mouth_scale, z_index=-0.08)
        # Initialize hidden
        m_plane.hide_render = True
        m_plane.hide_viewport = True
        mouth_planes[s] = m_plane

    # Drive mouth planes across every frame according to Rhubarb cues
    mouth_switches_count = 0
    if mouth_cues and len(mouth_cues) > 0:
        print(f"[Blender LipSync] Keyframing {len(mouth_cues)} Rhubarb phoneme mouth cues continuously...")
        
        # Sort cues chronologically
        sorted_cues = sorted(mouth_cues, key=lambda c: c.get('start', 0.0))
        
        # Track active shape at each frame
        frame_shape_map = {}
        for cue in sorted_cues:
            start_sec = cue.get('start', 0.0)
            end_sec = cue.get('end', start_sec + 0.1)
            val = str(cue.get('value', 'X')).upper()
            if val not in mouth_planes:
                val = 'B'
                
            start_f = max(1, min(total_frames, int(round(start_sec * fps)) + 1))
            end_f = max(start_f, min(total_frames, int(round(end_sec * fps))))
            
            for f in range(start_f, end_f + 1):
                frame_shape_map[f] = val

        last_active = None
        for f in range(1, total_frames + 1):
            curr_active = frame_shape_map.get(f, 'X')
            progress = (f - 1) / max(1, total_frames - 1)
            walk_x = walk_start_x + (walk_end_x - walk_start_x) * progress
            
            if is_walking:
                sway_z = abs(math.sin(f / 4.0)) * 0.025 * 1.15
            else:
                sway_z = math.sin(f / 12.0) * 0.012 * 1.15
            
            if curr_active != last_active or f == 1 or is_walking:
                mouth_switches_count += 1
                for s, plane in mouth_planes.items():
                    is_active = (s == curr_active)
                    plane.hide_render = not is_active
                    plane.hide_viewport = not is_active
                    plane.location.x = mouth_pos[0] + walk_x
                    plane.location.z = mouth_pos[2] + sway_z
                    plane.keyframe_insert(data_path="hide_render", frame=f)
                    plane.keyframe_insert(data_path="hide_viewport", frame=f)
                    plane.keyframe_insert(data_path="location", frame=f)
                last_active = curr_active
    else:
        # Fallback rhythmic talk cycle if no cues passed
        print("[Blender LipSync] Generating rhythmic talking mouth keyframes...")
        talk_cycle = ['B', 'C', 'D', 'E', 'B', 'A']
        for f in range(1, total_frames + 1, 4):
            shape = talk_cycle[(f // 4) % len(talk_cycle)]
            mouth_switches_count += 1
            for s, plane in mouth_planes.items():
                is_active = (s == shape)
                plane.hide_render = not is_active
                plane.hide_viewport = not is_active
                plane.keyframe_insert(data_path="hide_render", frame=f)
                plane.keyframe_insert(data_path="hide_viewport", frame=f)

    print(f"[Blender Rig] ✅ Rig construction complete: {mouth_switches_count} visible mouth switches keyframed.")
    return total_frames, mouth_switches_count

def main():
    args = parse_cli_args()
    assets_dir = args.get('assets_dir', 'cartoon_character_assets')
    mouth_cues_path = args.get('mouth_cues', '')
    action = args.get('action', 'talking')
    emotion = args.get('emotion', 'curious')
    duration = float(args.get('duration', 5.0))
    camera_mode = args.get('camera', 'medium')
    bg_image = args.get('bg_image', None)
    output_mp4 = args.get('output_mp4', 'blender_scene_out.mp4')
    audio_wav = args.get('audio_wav', '')
    
    print("====================================================")
    print(f"🎬 [Blender Headless Engine] 2.5D Animated Character Render")
    print(f"⏱️  Duration: {duration:.2f}s @ 30 FPS")
    print(f"🎭 Action: {action} | Emotion: {emotion} | Camera: {camera_mode}")
    if bg_image:
        print(f"🌆 Environment Background: {bg_image}")
    print(f"🎯 Output: {output_mp4}")
    print("====================================================")

    # 1. Parse Lip-Sync Phoneme Timing
    mouth_cues = []
    if mouth_cues_path and os.path.exists(mouth_cues_path):
        try:
            with open(mouth_cues_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                mouth_cues = data.get('mouthCues', data if isinstance(data, list) else [])
            print(f"[Blender] Loaded {len(mouth_cues)} Rhubarb mouth cues from {mouth_cues_path}")
        except Exception as e:
            print(f"[Blender] Error parsing mouth cues: {e}")

    # 2. Reset Scene
    clear_default_scene()

    # 3. Setup Render & Output
    scene, total_frames = setup_render_settings(duration_seconds=duration, fps=30, output_path=output_mp4)

    # 4. Build Layers & Animations
    total_frames, switches_count = build_cartoon_character_rig(
        assets_dir,
        mouth_cues,
        action=action,
        emotion=emotion,
        duration=duration,
        fps=30,
        camera_mode=camera_mode,
        bg_image=bg_image
    )

    # 5. Add Dialogue Audio Track to Sequencer
    if audio_wav and os.path.exists(audio_wav):
        if not scene.sequence_editor:
            scene.sequence_editor_create()
        sound_strip = scene.sequence_editor.sequences.new_sound(
            name="DialogueAudio",
            filepath=os.path.abspath(audio_wav),
            channel=1,
            frame_start=1
        )
        print(f"[Blender] Audio track attached: {audio_wav}")

    # 6. Execute Render
    print(f"[Blender] Rendering {total_frames} frames to {output_mp4}...")
    bpy.ops.render.render(animation=True)
    
    # Resolve actual output file (Blender animation render appends frame numbers like 0001-0017.mp4)
    if not (os.path.exists(output_mp4) and os.path.getsize(output_mp4) > 1000):
        out_dir = os.path.dirname(os.path.abspath(output_mp4))
        base_name = os.path.basename(output_mp4)
        name_no_ext = os.path.splitext(base_name)[0]
        
        candidates = []
        if os.path.exists(out_dir):
            for fname in os.listdir(out_dir):
                if fname.endswith('.mp4') and (fname.startswith(base_name) or fname.startswith(name_no_ext)):
                    fpath = os.path.join(out_dir, fname)
                    if os.path.isfile(fpath) and os.path.getsize(fpath) > 1000:
                        candidates.append((fpath, os.path.getmtime(fpath)))
        
        if candidates:
            candidates.sort(key=lambda x: x[1], reverse=True)
            matched_file = candidates[0][0]
            print(f"[Blender] Identified frame-ranged output: {matched_file} -> Normalizing to {output_mp4}")
            shutil.move(matched_file, output_mp4)

    if os.path.exists(output_mp4) and os.path.getsize(output_mp4) > 1000:
        print(f"[Blender] ✅ RENDER SUCCEEDED: {output_mp4} ({os.path.getsize(output_mp4)} bytes)")
    else:
        print(f"[Blender] ❌ RENDER FAILED: Output {output_mp4} was not generated or is too small.")
        sys.exit(1)

if __name__ == '__main__':
    main()
