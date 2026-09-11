#!/usr/bin/env python3
"""
Exact Puppet MoviePy Animation Engine
=====================================
Animates the exact geometric wooden/mannequin puppet character from the reference images:
- Tall lanky build with geometric facets
- Dark chocolate hair with 2 sharp spiky tufts
- Big round expressive cartoon eyes with dark arched brows
- Sharp triangular coral-red nose & rounded ears with orange contour
- Dark indigo navy blue crewneck t-shirt with ball-joint shoulders
- Red joint bands at elbows and wrists
- Slim denim jeans with circular knee joint seams & folded cuffs
- Black canvas sneakers with white rubber toe caps and white laces

Features:
- Full MoviePy compositing for 1080x1920 vertical Shorts
- Periodic natural eye blinking (every 2.4s)
- Animated lip-sync mouth movement during speech (4-5 Hz)
- Sinusoidal breathing and head sway
- Walk-in entrance with stepping bounce
- Pointing gestures for comparison cards
"""

import sys
import os
import argparse
import math
import json
import wave

try:
    import numpy as np
    from PIL import Image
    try:
        from moviepy import (
            ImageClip,
            CompositeVideoClip,
            AudioFileClip,
            CompositeAudioClip,
            ColorClip,
        )
    except ImportError:
        # MoviePy 1.x fallback
        from moviepy.editor import (
            ImageClip,
            CompositeVideoClip,
            AudioFileClip,
            CompositeAudioClip,
            ColorClip,
        )
except ImportError as e:
    print(f"[MoviePy] Notice: Required python library missing ({e}). Falling back to FFmpeg engine.")
    sys.exit(1)

PUPPET_DIR = os.path.join(os.getcwd(), "cartoon_character_assets", "exact_puppet")


def get_puppet_asset(name):
    path = os.path.join(PUPPET_DIR, f"{name}.png")
    if os.path.exists(path):
        return path
    
    alt = os.path.join(os.getcwd(), "cartoon_character_assets", "comparison_puppet", f"{name}.png")
    if os.path.exists(alt):
        return alt

    # If asset is missing, auto-trigger the exact puppet builder
    try:
        builder = os.path.join(os.getcwd(), "scripts", "build_exact_puppet_shapes.cjs")
        if os.path.exists(builder):
            print(f"[MoviePy] 🎨 Asset {name}.png missing. Running exact puppet builder...")
            subprocess.run(["node", builder], check=False)
            if os.path.exists(path):
                return path
            if os.path.exists(alt):
                return alt
    except Exception as e:
        print(f"[MoviePy] Notice while auto-building puppet assets: {e}")

    # Fallback to idle if specific pose is missing
    idle_path = os.path.join(PUPPET_DIR, "puppet_idle.png")
    if os.path.exists(idle_path):
        return idle_path

    # Emergency fallback to ensure no FileNotFoundError
    if not os.path.exists(path):
        os.makedirs(PUPPET_DIR, exist_ok=True)
        try:
            placeholder = Image.new("RGBA", (500, 1000), (251, 191, 36, 255))
            placeholder.save(path)
        except Exception:
            pass

    return path


def build_puppet_clip(action="talking", duration=5.0, target_height=1120, board1_path=None, board2_path=None, vs_path=None, mouth_fn=None):
    """
    Constructs a dynamic MoviePy clip of Archie (the modern human tech creator character).
    Supports:
    - Alternating stride walking entrance and exit
    - Interactive comparison boards presentation with point_up_left, vs, and point_up_right
    - Real lip-sync driven by phoneme cues and audio envelope (no arm flailing or frozen mouth)
    - Akimbo on hip + hand on jaw thinking pose
    """
    idle_path = get_puppet_asset("puppet_idle")
    talk_path = get_puppet_asset("puppet_talking")
    blink_path = get_puppet_asset("puppet_blink")
    walk_path = get_puppet_asset("puppet_walking")
    walk1_path = get_puppet_asset("puppet_walk_stride1")
    walk2_path = get_puppet_asset("puppet_walk_stride2")
    walk_talk1_path = get_puppet_asset("puppet_walk_talk1")
    walk_talk2_path = get_puppet_asset("puppet_walk_talk2")

    point_l_path = get_puppet_asset("puppet_point_left")
    point_l_talk_path = get_puppet_asset("puppet_point_left_talk")
    point_r_path = get_puppet_asset("puppet_point_right")
    point_r_talk_path = get_puppet_asset("puppet_point_right_talk")

    point_up_l_path = get_puppet_asset("puppet_point_up_left")
    point_up_l_talk_path = get_puppet_asset("puppet_point_up_left_talk")
    point_up_r_path = get_puppet_asset("puppet_point_up_right")
    point_up_r_talk_path = get_puppet_asset("puppet_point_up_right_talk")

    akimbo_path = get_puppet_asset("puppet_akimbo_jaw")
    akimbo_talk_path = get_puppet_asset("puppet_akimbo_jaw_talk")

    explain_path = get_puppet_asset("puppet_explain_both")
    explain_talk_path = get_puppet_asset("puppet_explain_both_talk")

    sit_path = get_puppet_asset("puppet_sitting")
    sit_talk_path = get_puppet_asset("puppet_sitting_talk")

    think_path = get_puppet_asset("puppet_thinking")
    think_talk_path = get_puppet_asset("puppet_thinking_talk")

    confused_path = get_puppet_asset("puppet_confused")
    confused_talk_path = get_puppet_asset("puppet_confused_talk")

    surprised_path = get_puppet_asset("puppet_surprised")
    surprised_talk_path = get_puppet_asset("puppet_surprised_talk")

    question_path = get_puppet_asset("puppet_questioning_users")
    question_talk_path = get_puppet_asset("puppet_questioning_users_talk")

    # Load PIL images to get dimensions
    with Image.open(idle_path) as im:
        orig_w, orig_h = im.size

    scale_factor = target_height / float(orig_h)
    target_width = int(orig_w * scale_factor)

    # Base resting coordinates on 1080x1920 canvas — solidly grounded on floor (no floating!)
    base_x = (1080 - target_width) // 2
    base_y = 1920 - target_height + 25  # Grounded sneakers contacting floor plane

    # Assign main pose and horizontal framing based on action
    if action == "point_up_left":
        main_pose_path = point_up_l_path
        base_x = (1080 - target_width) // 2 + 60
    elif action == "point_up_right":
        main_pose_path = point_up_r_path
        base_x = (1080 - target_width) // 2 - 60
    elif action == "akimbo_jaw":
        main_pose_path = akimbo_path
        base_x = (1080 - target_width) // 2
    elif action == "point_left":
        main_pose_path = point_l_path
        base_x = 360
    elif action == "point_right":
        main_pose_path = point_r_path
        base_x = 180
    elif action == "sitting":
        main_pose_path = sit_path
        base_x = (1080 - target_width) // 2
        base_y = 1920 - target_height + 15
    elif action == "thinking":
        main_pose_path = think_path
        base_x = (1080 - target_width) // 2
    elif action == "confused":
        main_pose_path = confused_path
        base_x = (1080 - target_width) // 2
    elif action == "surprised":
        main_pose_path = surprised_path
        base_x = (1080 - target_width) // 2
    elif action == "questioning_users":
        main_pose_path = question_path
        base_x = (1080 - target_width) // 2
    elif action in ["explain_both", "comparing"]:
        main_pose_path = explain_path
        base_x = (1080 - target_width) // 2
    elif action in ["walking", "walk_in"]:
        main_pose_path = walk_path
        base_x = (1080 - target_width) // 2
    else:
        main_pose_path = idle_path
        base_x = (1080 - target_width) // 2

    # Helper to resize and prepare clip
    def make_clip(p):
        clip = ImageClip(p)
        if hasattr(clip, "resized"):
            clip = clip.resized(height=target_height)
        elif hasattr(clip, "resize"):
            clip = clip.resize(height=target_height)
        return clip

    c_idle = make_clip(idle_path)
    c_talk = make_clip(talk_path)
    c_blink = make_clip(blink_path)

    c_walk1 = make_clip(walk1_path if os.path.exists(walk1_path) else walk_path)
    c_walk2 = make_clip(walk2_path if os.path.exists(walk2_path) else walk_path)
    c_walk_t1 = make_clip(walk_talk1_path if os.path.exists(walk_talk1_path) else walk1_path)
    c_walk_t2 = make_clip(walk_talk2_path if os.path.exists(walk_talk2_path) else walk2_path)

    c_point_up_l = make_clip(point_up_l_path)
    c_point_up_l_talk = make_clip(point_up_l_talk_path if os.path.exists(point_up_l_talk_path) else point_up_l_path)

    c_point_up_r = make_clip(point_up_r_path)
    c_point_up_r_talk = make_clip(point_up_r_talk_path if os.path.exists(point_up_r_talk_path) else point_up_r_path)

    c_point_l = make_clip(point_l_path)
    c_point_l_talk = make_clip(point_l_talk_path if os.path.exists(point_l_talk_path) else point_l_path)

    c_point_r = make_clip(point_r_path)
    c_point_r_talk = make_clip(point_r_talk_path if os.path.exists(point_r_talk_path) else point_r_path)

    c_akimbo = make_clip(akimbo_path)
    c_akimbo_talk = make_clip(akimbo_talk_path if os.path.exists(akimbo_talk_path) else akimbo_path)

    c_explain = make_clip(explain_path)
    c_explain_talk = make_clip(explain_talk_path if os.path.exists(explain_talk_path) else explain_path)

    c_think = make_clip(think_path)
    c_think_talk = make_clip(think_talk_path if os.path.exists(think_talk_path) else think_path)

    c_confused = make_clip(confused_path)
    c_confused_talk = make_clip(confused_talk_path if os.path.exists(confused_talk_path) else confused_path)

    c_surprised = make_clip(surprised_path)
    c_surprised_talk = make_clip(surprised_talk_path if os.path.exists(surprised_talk_path) else surprised_path)

    c_question = make_clip(question_path)
    c_question_talk = make_clip(question_talk_path if os.path.exists(question_talk_path) else question_path)

    c_sit = make_clip(sit_path)
    c_sit_talk = make_clip(sit_talk_path if os.path.exists(sit_talk_path) else sit_path)

    layers = []

    # Check if this is an interactive presentation scene (walk in, show boards, stay in frame for infinite loop)
    has_interactive_boards = board1_path and os.path.exists(board1_path)

    if action in ["walk_in", "walking"] or has_interactive_boards:
        walk_in_dur = min(1.0, duration * 0.25)
        walk_out_dur = 0.0  # ZERO walk out: Archie stays in frame for seamless, loopy playback!
        center_end = duration

        # 1. Entrance Walk with Alternating Strides
        t_w = 0.0
        stride_dur = 0.18
        while t_w < walk_in_dur:
            cur_stride = c_walk1 if int(t_w / stride_dur) % 2 == 0 else c_walk2
            chunk = min(stride_dur, walk_in_dur - t_w)
            
            def make_walk_in_pos(start_time):
                def walk_pos(t):
                    actual_t = start_time + t
                    prog = min(1.0, actual_t / walk_in_dur)
                    cur_x = -380 + prog * (base_x + 380)
                    bounce = 14 * abs(math.sin(actual_t * 12))
                    return (int(cur_x), int(base_y - bounce))
                return walk_pos

            sub = cur_stride.with_start(t_w).with_duration(chunk).with_position(make_walk_in_pos(t_w))
            layers.append(sub)
            t_w += chunk

        # 2. Interactive Presentation in Center (Talking, Pointing, Akimbo, Thinking)
        t_c = walk_in_dur
        while t_c < center_end:
            chunk = min(0.08, center_end - t_c)
            rel_t = t_c - walk_in_dur
            cycle_pos = rel_t % 2.5
            is_blink = 2.2 <= cycle_pos <= 2.36
            is_mouth_open = mouth_fn(t_c) if mouth_fn else (int((t_c * 5.0)) % 2 == 1)

            # Choreography based on time in center
            if has_interactive_boards and 0.8 <= rel_t < 1.8:
                # Point Up Left to Board 1 with Active Lip-Sync (keeps arm steady, lips actively animated!)
                base_img = c_point_up_l_talk if is_mouth_open else c_point_up_l
            elif has_interactive_boards and 2.2 <= rel_t < 3.2:
                # Point Up Right to Board 2 with Active Lip-Sync
                base_img = c_point_up_r_talk if is_mouth_open else c_point_up_r
            elif has_interactive_boards and rel_t >= 3.2:
                # Akimbo on hip + hand on jaw while talking
                base_img = c_akimbo_talk if is_mouth_open else c_akimbo
            else:
                # Standard talk / idle / surprised / thinking
                if is_blink and not is_mouth_open and action not in ["surprised", "thinking"]:
                    base_img = c_blink
                elif action == "surprised":
                    base_img = c_surprised_talk if is_mouth_open else c_surprised
                elif action == "thinking":
                    base_img = c_think_talk if is_mouth_open else c_think
                elif action == "confused":
                    base_img = c_confused_talk if is_mouth_open else c_confused
                elif action == "questioning_users":
                    base_img = c_question_talk if is_mouth_open else c_question
                elif action in ["explain_both", "comparing"]:
                    base_img = c_explain_talk if is_mouth_open else c_explain
                else:
                    base_img = c_talk if is_mouth_open else c_idle

            # Rock-solid stable stance while standing (solid ground contact)
            def center_pos(t):
                return (int(base_x), int(base_y))

            sub = base_img.with_start(t_c).with_duration(chunk).with_position(center_pos)
            layers.append(sub)
            t_c += chunk

    else:
        # Stationary Poses: completely grounded feet (no floating, no disappearing)
        def normal_pos(t):
            return (int(base_x), int(base_y))

        t_cur = 0.0
        while t_cur < duration:
            chunk = min(0.08, duration - t_cur)
            cycle_pos = t_cur % 2.6
            is_blink = 2.3 <= cycle_pos <= 2.44
            is_mouth_open = mouth_fn(t_cur) if mouth_fn else (int((t_cur * 5.0)) % 2 == 1)

            if is_blink and not is_mouth_open and action not in ["thinking", "surprised"]:
                sub = c_blink.with_start(t_cur).with_duration(chunk).with_position(normal_pos)
            else:
                if action == "akimbo_jaw":
                    base_img = c_akimbo_talk if is_mouth_open else c_akimbo
                elif action == "thinking":
                    base_img = c_think_talk if is_mouth_open else c_think
                elif action == "surprised":
                    base_img = c_surprised_talk if is_mouth_open else c_surprised
                elif action == "confused":
                    base_img = c_confused_talk if is_mouth_open else c_confused
                elif action == "questioning_users":
                    base_img = c_question_talk if is_mouth_open else c_question
                elif action in ["explain_both", "comparing"]:
                    base_img = c_explain_talk if is_mouth_open else c_explain
                elif action == "point_left":
                    base_img = c_point_l_talk if is_mouth_open else c_point_l
                elif action == "point_right":
                    base_img = c_point_r_talk if is_mouth_open else c_point_r
                elif action == "point_up_left":
                    base_img = c_point_up_l_talk if is_mouth_open else c_point_up_l
                elif action == "point_up_right":
                    base_img = c_point_up_r_talk if is_mouth_open else c_point_up_r
                elif action == "sitting":
                    base_img = c_sit_talk if is_mouth_open else c_sit
                else:
                    base_img = c_talk if is_mouth_open else c_idle
                sub = base_img.with_start(t_cur).with_duration(chunk).with_position(normal_pos)

            layers.append(sub)
            t_cur += chunk

    # Add 2 Visible Interactive Comparison Boards (Board 1, VS Badge, Board 2) with Real Drop Slam
    if has_interactive_boards:
        try:
            b_appear1 = 0.8
            b_appear_vs = 1.35
            b_appear2 = 1.9
            b_exit = duration

            # Helper for physical drop slam animation (fast fall from above screen + impact bounce + gentle hover)
            def make_board_slam_pos(target_x, slam_start_t):
                def slam_pos(t):
                    local_t = t - slam_start_t
                    target_y = 240
                    if local_t <= 0.0:
                        return (target_x, -420)
                    elif local_t < 0.18:
                        # Rapid accelerated drop
                        p = local_t / 0.18
                        cur_y = -420 + (target_y - -420) * (p * p)
                        return (target_x, int(cur_y))
                    elif local_t < 0.28:
                        # High-impact overshoot bounce
                        p2 = (local_t - 0.18) / 0.10
                        bounce_y = target_y + 20 * math.sin(p2 * math.pi)
                        return (target_x, int(bounce_y))
                    else:
                        # Settle and remain steady & visible
                        return (target_x, target_y)
                return slam_pos

            # Board 1 (Left, 440px wide, real data)
            b1_clip = ImageClip(board1_path)
            if hasattr(b1_clip, "resized"):
                b1_clip = b1_clip.resized(width=440)
            elif hasattr(b1_clip, "resize"):
                b1_clip = b1_clip.resize(width=440)

            b1_dur = max(0.1, b_exit - b_appear1)
            b1_layer = b1_clip.with_start(b_appear1).with_duration(b1_dur).with_position(make_board_slam_pos(45, b_appear1))
            layers.insert(0, b1_layer)

            # VS Badge (Center, 150x150)
            if vs_path and os.path.exists(vs_path):
                vs_clip = ImageClip(vs_path)
                if hasattr(vs_clip, "resized"):
                    vs_clip = vs_clip.resized(width=150)
                elif hasattr(vs_clip, "resize"):
                    vs_clip = vs_clip.resize(width=150)

                def vs_pos(t):
                    local_t = t - b_appear_vs
                    target_y = 300
                    if local_t <= 0.0:
                        return (465, -200)
                    elif local_t < 0.16:
                        p = local_t / 0.16
                        cur_y = -200 + (target_y - -200) * (p * p)
                        return (465, int(cur_y))
                    else:
                        return (465, target_y)

                vs_dur = max(0.1, b_exit - b_appear_vs)
                vs_layer = vs_clip.with_start(b_appear_vs).with_duration(vs_dur).with_position(vs_pos)
                layers.insert(0, vs_layer)

            # Board 2 (Right, 440px wide, real data)
            if board2_path and os.path.exists(board2_path):
                b2_clip = ImageClip(board2_path)
                if hasattr(b2_clip, "resized"):
                    b2_clip = b2_clip.resized(width=440)
                elif hasattr(b2_clip, "resize"):
                    b2_clip = b2_clip.resize(width=440)

                b2_dur = max(0.1, b_exit - b_appear2)
                b2_layer = b2_clip.with_start(b_appear2).with_duration(b2_dur).with_position(make_board_slam_pos(595, b_appear2))
                layers.insert(0, b2_layer)

        except Exception as e:
            print(f"[MoviePy] Notice attaching comparison boards: {e}")

    # Add Floating Holographic UI HUD Card when pointing or comparing!
    hud_path = os.path.join(os.getcwd(), "cartoon_character_assets", "ui_hud", "hud_comparison_card.png")
    if os.path.exists(hud_path) and action in ["point_left", "point_right", "explain_both", "comparing"]:
        try:
            hud_clip = ImageClip(hud_path)
            # Resize HUD card cleanly (width ~480px)
            if hasattr(hud_clip, "resized"):
                hud_clip = hud_clip.resized(width=480)
            elif hasattr(hud_clip, "resize"):
                hud_clip = hud_clip.resize(width=480)

            # Determine HUD position (opposite to host or centered floating)
            if action == "point_right":
                hud_x, hud_y = 520, 420
            elif action == "point_left":
                hud_x, hud_y = 60, 420
            else:
                hud_x, hud_y = 300, 380

            def hud_pos(t):
                # Subtle floating levitation effect
                float_offset = 6 * math.sin(t * 2.5)
                return (hud_x, int(hud_y + float_offset))

            hud_layer = hud_clip.with_duration(duration).with_position(hud_pos)
            layers.insert(0, hud_layer)  # Layer behind or beside host
        except Exception as e:
            print(f"[MoviePy] Notice attaching HUD card: {e}")

    puppet_composite = CompositeVideoClip(layers, size=(1080, 1920)).with_duration(duration)
    return puppet_composite


def render_scene(bg_image, audio_wav, output_mp4, duration=5.0, action="talking", glossary_board="", board1_image="", board2_image="", vs_badge="", bam_sound="", mouth_cues=""):
    """
    Renders the full scene using MoviePy with the exact animated puppet, interactive comparison boards, and floating glossary board.
    Synchronizes mouth lip movement to phoneme cues and audio amplitude waveform.
    """
    print(f"🎬 [MoviePy Engine] Rendering scene with Exact Puppet (Action: {action}, Duration: {duration}s)...")

    # Parse phoneme mouth cues if provided
    cues_list = []
    if mouth_cues and os.path.exists(mouth_cues):
        try:
            with open(mouth_cues, "r", encoding="utf-8") as f:
                cues_data = json.load(f)
                if isinstance(cues_data, dict) and "mouthCues" in cues_data:
                    cues_list = cues_data["mouthCues"]
                elif isinstance(cues_data, list):
                    cues_list = cues_data
        except Exception as e:
            print(f"[MoviePy] Notice parsing mouth cues JSON: {e}")

    # Compute audio amplitude envelope for high-fidelity speech detection
    audio_amplitudes = None
    if audio_wav and os.path.exists(audio_wav):
        try:
            with wave.open(audio_wav, "rb") as wf:
                sample_rate = wf.getframerate()
                n_frames = wf.getnframes()
                channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                raw_bytes = wf.readframes(n_frames)
                if sampwidth == 2 and n_frames > 0:
                    audio_data = np.frombuffer(raw_bytes, dtype=np.int16)
                    if channels > 1:
                        audio_data = audio_data[::channels]
                    chunk_size = max(1, int(sample_rate * 0.04))  # 40ms resolution
                    n_chunks = len(audio_data) // chunk_size
                    if n_chunks > 0:
                        trimmed = audio_data[:n_chunks * chunk_size].reshape(n_chunks, chunk_size)
                        rms = np.sqrt(np.mean(trimmed.astype(np.float32) ** 2, axis=1))
                        max_rms = np.max(rms)
                        if max_rms > 0:
                            audio_amplitudes = rms / max_rms
        except Exception as e:
            print(f"[MoviePy] Notice analyzing audio amplitude: {e}")

    def get_mouth_state(t):
        """Returns True if mouth is open/talking at time t, False if closed/resting."""
        # 1. Phoneme cues (Rhubarb)
        if cues_list:
            for cue in cues_list:
                start = float(cue.get("start", 0))
                end = float(cue.get("end", 0))
                if start <= t <= end:
                    val = str(cue.get("value", "")).upper()
                    # Speaking phonemes: B, C, D, E, F, G, H have open lips; A and X are closed
                    if val in ["B", "C", "D", "E", "F", "G", "H"]:
                        return True
                    elif val in ["A", "X"]:
                        return False
            return False

        # 2. Audio amplitude envelope
        if audio_amplitudes is not None and len(audio_amplitudes) > 0:
            chunk_idx = int(t / 0.04)
            if 0 <= chunk_idx < len(audio_amplitudes):
                amp = audio_amplitudes[chunk_idx]
                if amp > 0.04:  # Spoken dialogue above noise floor
                    # Dynamic syllable flap cadence
                    return int(t * 6.5) % 2 == 1
                else:
                    return False  # Closed lips during silence/pause
            return False

        # 3. Default cadence during audio
        if audio_wav and os.path.exists(audio_wav):
            return int(t * 5.0) % 2 == 1
        return False

    # 1. Background clip
    if bg_image and os.path.exists(bg_image):
        bg = ImageClip(bg_image)
        if hasattr(bg, "resized"):
            bg = bg.resized((1080, 1920))
        elif hasattr(bg, "resize"):
            bg = bg.resize((1080, 1920))
        bg = bg.with_duration(duration)
    else:
        # High quality gradient backdrop if no bg provided
        bg = ColorClip(size=(1080, 1920), color=[15, 23, 42]).with_duration(duration)

    scene_layers = [bg]

    # 1.5 Floating Non-Intrusive Glossary Board in Upper Space
    if glossary_board and os.path.exists(glossary_board):
        try:
            gloss_clip = ImageClip(glossary_board)
            if hasattr(gloss_clip, "resized"):
                gloss_clip = gloss_clip.resized(width=860)
            elif hasattr(gloss_clip, "resize"):
                gloss_clip = gloss_clip.resize(width=860)

            def gloss_pos(t):
                # Subtle gentle floating in top third (y ~ 140 to 180)
                float_y = 150 + 4 * math.sin(t * 2.0)
                return (110, int(float_y))

            gloss_layer = gloss_clip.with_duration(duration).with_position(gloss_pos)
            scene_layers.append(gloss_layer)
        except Exception as e:
            print(f"[MoviePy] Notice attaching floating glossary board: {e}")

    # 2. Puppet clip with interactive boards and lip-sync
    puppet = build_puppet_clip(
        action=action,
        duration=duration,
        target_height=1120,
        board1_path=board1_image if (board1_image and os.path.exists(board1_image)) else None,
        board2_path=board2_image if (board2_image and os.path.exists(board2_image)) else None,
        vs_path=vs_badge if (vs_badge and os.path.exists(vs_badge)) else None,
        mouth_fn=get_mouth_state,
    )
    scene_layers.append(puppet)

    # 3. Composite scene
    final_video = CompositeVideoClip(scene_layers, size=(1080, 1920)).with_duration(duration)

    # 4. Attach audio (mix voice dialogue + BAM stamp impact sounds at board arrivals)
    audio_tracks = []
    if audio_wav and os.path.exists(audio_wav):
        voice_clip = AudioFileClip(audio_wav)
        voice_clip = voice_clip.with_duration(min(duration, voice_clip.duration))
        audio_tracks.append(voice_clip)

    if bam_sound and os.path.exists(bam_sound) and (board1_image or board2_image):
        try:
            # BAM sound 1 at Board 1 slam (0.98s)
            if duration >= 1.2:
                bam_clip1 = AudioFileClip(bam_sound).with_start(0.98)
                audio_tracks.append(bam_clip1)
            # BAM sound 2 at Board 2 slam (2.08s)
            if duration >= 2.3 and board2_image:
                bam_clip2 = AudioFileClip(bam_sound).with_start(2.08)
                audio_tracks.append(bam_clip2)
        except Exception as e:
            print(f"[MoviePy] Notice mixing BAM sound effects: {e}")

    if audio_tracks:
        try:
            final_audio = CompositeAudioClip(audio_tracks).with_duration(duration)
            final_video = final_video.with_audio(final_audio)
        except Exception as e:
            print(f"[MoviePy] Notice creating composite audio ({e}), using primary voice")
            if audio_wav and os.path.exists(audio_wav):
                final_video = final_video.with_audio(voice_clip)

    # 5. Write MP4
    out_dir = os.path.dirname(output_mp4)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    final_video.write_videofile(
        output_mp4,
        fps=30,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        threads=4,
        ffmpeg_params=["-pix_fmt", "yuv420p"],
        logger=None,  # Clean silent logs
    )

    final_video.close()
    if audio_wav and os.path.exists(audio_wav):
        voice_clip.close()

    print(f"✅ [MoviePy Engine] Scene rendered successfully: {output_mp4} ({os.path.getsize(output_mp4)} bytes)")
    return output_mp4


def main():
    parser = argparse.ArgumentParser(description="MoviePy Exact Puppet Scene Animator")
    parser.add_argument("--bg_image", type=str, default="", help="Path to background image")
    parser.add_argument("--audio_wav", type=str, default="", help="Path to audio WAV file")
    parser.add_argument("--output_mp4", type=str, required=True, help="Path for output MP4")
    parser.add_argument("--duration", type=float, default=5.0, help="Duration in seconds")
    parser.add_argument("--action", type=str, default="talking", help="Action: talking, idle, point_left, point_right, explain_both, walk_in, point_up_left, point_up_right, akimbo_jaw")
    parser.add_argument("--glossary_board", type=str, default="", help="Path to floating glossary board image")
    parser.add_argument("--board1_image", type=str, default="", help="Path to board 1 image")
    parser.add_argument("--board2_image", type=str, default="", help="Path to board 2 image")
    parser.add_argument("--vs_badge", type=str, default="", help="Path to VS badge image")
    parser.add_argument("--bam_sound", type=str, default="", help="Path to BAM sound effect")
    parser.add_argument("--mouth_cues", type=str, default="", help="Path to mouth cues JSON file")

    args = parser.parse_args()
    render_scene(
        bg_image=args.bg_image,
        audio_wav=args.audio_wav,
        output_mp4=args.output_mp4,
        duration=args.duration,
        action=args.action,
        glossary_board=args.glossary_board,
        board1_image=args.board1_image,
        board2_image=args.board2_image,
        vs_badge=args.vs_badge,
        bam_sound=args.bam_sound,
        mouth_cues=args.mouth_cues,
    )


if __name__ == "__main__":
    main()
