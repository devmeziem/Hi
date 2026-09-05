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
import numpy as np
from PIL import Image

try:
    from moviepy import (
        ImageClip,
        CompositeVideoClip,
        AudioFileClip,
        ColorClip,
    )
except ImportError:
    # MoviePy 1.x fallback
    from moviepy.editor import (
        ImageClip,
        CompositeVideoClip,
        AudioFileClip,
        ColorClip,
    )

PUPPET_DIR = os.path.join(os.getcwd(), "cartoon_character_assets", "exact_puppet")


def get_puppet_asset(name):
    path = os.path.join(PUPPET_DIR, f"{name}.png")
    if not os.path.exists(path):
        # Fallback to comparison_puppet if needed
        alt = os.path.join(os.getcwd(), "cartoon_character_assets", "comparison_puppet", f"{name}.png")
        if os.path.exists(alt):
            return alt
    return path


def build_puppet_clip(action="talking", duration=5.0, target_height=1100):
    """
    Constructs a dynamic MoviePy clip of the exact character puppet.
    """
    idle_path = get_puppet_asset("puppet_idle")
    talk_path = get_puppet_asset("puppet_talking")
    blink_path = get_puppet_asset("puppet_blink")
    point_l_path = get_puppet_asset("puppet_point_left")
    point_r_path = get_puppet_asset("puppet_point_right")
    explain_path = get_puppet_asset("puppet_explain_both")
    walk_path = get_puppet_asset("puppet_walking")

    # Load PIL images to get dimensions
    with Image.open(idle_path) as im:
        orig_w, orig_h = im.size

    scale_factor = target_height / float(orig_h)
    target_width = int(orig_w * scale_factor)

    # Base resting coordinates on 1080x1920 canvas
    # Character centered horizontally: x = (1080 - target_width) // 2
    base_x = (1080 - target_width) // 2
    base_y = 1920 - target_height - 60  # standing just above bottom margin

    if action == "point_left":
        main_pose_path = point_l_path
        base_x = 320
    elif action == "point_right":
        main_pose_path = point_r_path
        base_x = 220
    elif action == "explain_both":
        main_pose_path = explain_path
        base_x = (1080 - target_width) // 2
    else:
        main_pose_path = idle_path
        base_x = (1080 - target_width) // 2

    # Prepare ImageClips
    # Helper to resize and prepare clip
    def make_clip(p):
        clip = ImageClip(p)
        # Rescale
        if hasattr(clip, "resized"):
            clip = clip.resized(height=target_height)
        elif hasattr(clip, "resize"):
            clip = clip.resize(height=target_height)
        return clip

    c_idle = make_clip(main_pose_path)
    c_talk = make_clip(talk_path)
    c_blink = make_clip(blink_path)
    c_walk = make_clip(walk_path)

    # Build composite layers for blinking, speech, and movement
    layers = []

    if action == "walk_in":
        # Walk in from x = -400 to center over 1.2 seconds, then stand idle/talk
        walk_dur = min(1.2, duration * 0.4)

        def walk_pos(t):
            if t < walk_dur:
                progress = t / walk_dur
                cur_x = -400 + progress * (base_x + 400)
                # Bobbing bounce while stepping
                bounce = 14 * abs(math.sin(t * 12))
                return (int(cur_x), int(base_y - bounce))
            else:
                sway = 4 * math.sin((t - walk_dur) * 3.0)
                return (int(base_x), int(base_y + sway))

        # Walk clip for initial entrance
        walk_layer = c_walk.with_duration(walk_dur).with_start(0).with_position(walk_pos)
        layers.append(walk_layer)

        # Standing talking layer for the remainder
        rest_dur = max(0.1, duration - walk_dur)

        # Function for remainder position
        def rest_pos(t):
            sway = 4 * math.sin(t * 3.0)
            return (int(base_x), int(base_y + sway))

        # Alternate talking and blinking during rest
        t_cur = walk_dur
        while t_cur < duration:
            chunk = min(0.22, duration - t_cur)
            # Check if blink window
            cycle_pos = (t_cur - walk_dur) % 2.5
            is_blink = 2.2 <= cycle_pos <= 2.38

            if is_blink:
                sub = c_blink.with_start(t_cur).with_duration(chunk).with_position(rest_pos)
            else:
                # Alternate idle and talk
                is_mouth_open = int((t_cur * 4.5)) % 2 == 1
                base_img = c_talk if is_mouth_open else c_idle
                sub = base_img.with_start(t_cur).with_duration(chunk).with_position(rest_pos)

            layers.append(sub)
            t_cur += chunk

    else:
        # Stationary pose with breathing sway + animated mouth + periodic blinks
        def normal_pos(t):
            sway = 5 * math.sin(t * 3.0)
            # subtle horizontal breathing
            h_sway = 2 * math.cos(t * 1.5)
            return (int(base_x + h_sway), int(base_y + sway))

        t_cur = 0.0
        while t_cur < duration:
            chunk = min(0.20, duration - t_cur)
            # Periodic blink every ~2.5s for 0.16s
            cycle_pos = t_cur % 2.6
            is_blink = 2.3 <= cycle_pos <= 2.46

            if is_blink:
                sub = c_blink.with_start(t_cur).with_duration(chunk).with_position(normal_pos)
            else:
                # Talking animation (alternating mouth open/closed)
                is_mouth_open = int((t_cur * 5.0)) % 2 == 1
                base_img = c_talk if (is_mouth_open and action in ["talking", "point_left", "point_right", "explain_both"]) else c_idle
                sub = base_img.with_start(t_cur).with_duration(chunk).with_position(normal_pos)

            layers.append(sub)
            t_cur += chunk

    puppet_composite = CompositeVideoClip(layers, size=(1080, 1920)).with_duration(duration)
    return puppet_composite


def render_scene(bg_image, audio_wav, output_mp4, duration=5.0, action="talking"):
    """
    Renders the full scene using MoviePy with the exact animated puppet.
    """
    print(f"🎬 [MoviePy Engine] Rendering scene with Exact Puppet (Action: {action}, Duration: {duration}s)...")

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

    # 2. Puppet clip
    puppet = build_puppet_clip(action=action, duration=duration, target_height=1120)

    # 3. Composite scene
    final_video = CompositeVideoClip([bg, puppet], size=(1080, 1920)).with_duration(duration)

    # 4. Attach audio
    if audio_wav and os.path.exists(audio_wav):
        audio_clip = AudioFileClip(audio_wav)
        # Ensure audio matches duration
        audio_clip = audio_clip.with_duration(min(duration, audio_clip.duration))
        final_video = final_video.with_audio(audio_clip)

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
        audio_clip.close()

    print(f"✅ [MoviePy Engine] Scene rendered successfully: {output_mp4} ({os.path.getsize(output_mp4)} bytes)")
    return output_mp4


def main():
    parser = argparse.ArgumentParser(description="MoviePy Exact Puppet Scene Animator")
    parser.add_argument("--bg_image", type=str, default="", help="Path to background image")
    parser.add_argument("--audio_wav", type=str, default="", help="Path to audio WAV file")
    parser.add_argument("--output_mp4", type=str, required=True, help="Path for output MP4")
    parser.add_argument("--duration", type=float, default=5.0, help="Duration in seconds")
    parser.add_argument("--action", type=str, default="talking", help="Action: talking, idle, point_left, point_right, explain_both, walk_in")

    args = parser.parse_args()
    render_scene(
        bg_image=args.bg_image,
        audio_wav=args.audio_wav,
        output_mp4=args.output_mp4,
        duration=args.duration,
        action=args.action,
    )


if __name__ == "__main__":
    main()
