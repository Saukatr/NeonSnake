"""Cut the reference videos into 1920x1080 / 24 fps shots for the Remotion master.

Each vertical (or square) reference shot becomes a sharp centre panel with feathered
edges over a blurred, enlarged copy of itself. Watermarks/logos are cropped away.
Slowed shots are motion-interpolated to 24 fps. Usage: python3 tools/prep_shots.py <uploads dir>
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

UP = Path(sys.argv[1])
REF = {
    "r1": (next(UP.glob("*Reference_video_Mahalaya_dont_take_audio.mp4")), "472:714:0:0"),    # drop handle + avatar
    "r2": (next(UP.glob("*Reference_video_Mahalaya_2_dont_take_audio.mp4")), "472:816:0:36"),  # drop logo
    "r3": (next(UP.glob("*Reference_video_Mahalaya_3_dont_take_audio.mp4")), "608:622:56:0"),  # drop side bars
}
HANDLE = 0.25  # seconds of extra footage before/after each cut for dissolves
SHOTS = json.load(open("src/shots.json"))

def mask(w, feather=90):
    x = np.arange(w)
    a = np.clip(np.minimum(x, w - 1 - x) / feather, 0, 1)
    a = a * a * (3 - 2 * a)
    img = np.repeat((a * 255).astype(np.uint8)[None, :], 1080, 0)
    p = Path(f"work/masks/m{w}.png"); Image.fromarray(img, "L").save(p); return p

ONLY = {int(x) for x in sys.argv[2:]}
for i, s in enumerate(SHOTS):
    if ONLY and i + 1 not in ONLY: continue
    src, crop = REF[s["ref"]]
    cw, ch = map(int, crop.split(":")[:2])
    fw = round(cw * 1080 / ch / 2) * 2
    out_dur = s["end"] - s["start"] + 2 * HANDLE
    rate = s["rate"]
    ss = max(0.0, s["srcIn"] - HANDLE * rate)
    span = out_dur * rate + 0.2
    retime = f"setpts=(PTS-STARTPTS)/{rate}," + (
        "minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" if rate < 0.98 else "fps=24")
    fc = (
        f"[0:v]crop={crop},{retime},split[a][b];"
        f"[a]scale=1920:-2:flags=bicubic,crop=1920:1080,boxblur=36:2,eq=brightness=-0.09:saturation=1.15[bg];"
        f"[b]scale={fw}:1080:flags=lanczos,unsharp=5:5:0.5,format=rgba[f0];[1:v]format=gray[m];[f0][m]alphamerge[fg];"
        f"[bg][fg]overlay=(W-w)/2:0:format=auto,format=yuv420p"
    )
    out = f"public/shots/s{i + 1:02d}.mp4"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.3f}", "-t", f"{span:.3f}", "-i", str(src),
           "-loop", "1", "-i", str(mask(fw)), "-filter_complex", fc, "-t", f"{out_dur:.3f}", "-an",
           "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-r", "24", out]
    subprocess.run(cmd, check=True)
    print(out, s["ref"], s["srcIn"], rate, f"{out_dur:.2f}s")
