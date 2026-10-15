# Assemble the soundtrack: CC0 music + CC0 recorded sound effects placed on the picture's cue list.
import json, sys, os, subprocess
import numpy as np, librosa, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 60.8
LIB = sys.argv[1]           # cc0 sfx library root
MUSIC = sys.argv[2]
BIRDS = sys.argv[3]
OUT = sys.argv[4]
cues = json.load(open(sys.argv[5]))
rs = np.random.RandomState(4)
mix = np.zeros((2, int(SR * DUR)))
_cache = {}

def load(rel):
    p = rel if os.path.isabs(rel) else os.path.join(LIB, rel)
    if p not in _cache:
        y, _ = librosa.load(p, sr=SR, mono=False)
        if y.ndim == 1: y = np.stack([y, y])
        _cache[p] = y / (np.abs(y).max() + 1e-9)
    return _cache[p]

def filt(y, kind, f):
    sos = butter(2, f, btype=kind, fs=SR, output='sos')
    return sosfilt(sos, y, axis=-1)

def add(rel, t, db=0.0, semis=0.0, pan=0.0, lp=None, hp=None, fade_in=0.0, fade_out=0.0, start=0.0, length=None, rev=False):
    y = load(rel)
    if start or length:
        a = int(start * SR); b = a + int(length * SR) if length else y.shape[1]
        y = y[:, a:b]
    if rev: y = y[:, ::-1]
    if semis:
        rate = 2 ** (semis / 12)
        idx = np.arange(0, y.shape[1] - 1, rate)
        y = np.stack([np.interp(idx, np.arange(y.shape[1]), ch) for ch in y])
    if lp: y = filt(y, 'lowpass', lp)
    if hp: y = filt(y, 'highpass', hp)
    y = y.copy()
    n = y.shape[1]
    if fade_in: k = min(n, int(fade_in * SR)); y[:, :k] *= np.linspace(0, 1, k)
    if fade_out: k = min(n, int(fade_out * SR)); y[:, -k:] *= np.linspace(1, 0, k)
    g = 10 ** (db / 20)
    y[0] *= g * min(1, 1 - pan); y[1] *= g * min(1, 1 + pan)
    i = int(t * SR)
    if i >= mix.shape[1]: return
    m = min(n, mix.shape[1] - i)
    if i < 0: y = y[:, -i:]; m = min(y.shape[1], mix.shape[1]); i = 0
    mix[:, i:i + m] += y[:, :m]

KB = "bb - Keyboard Sounds (Mar 2021)/"
RC = "bb - Rubik's Cube (Feb 2021)/"
WO = "Micro Pack - Organic Wooshes/"
PL = "bb - Bottle Plops (Apr 2021)/"
IM = "kenney_impactsounds/Audio/"
WS = "40-cc0-water-splash-slime-sfx/"
SF = "50-cc0-sci-fi-sfx/"
pick = lambda arr: arr[rs.randint(len(arr))]

# ---- music: Novus Initium (Alexander Nakarada, CC0). Picture is cut to its timeline.
mus, _ = librosa.load(MUSIC, sr=SR, mono=False, duration=60)
mus = mus / np.abs(mus).max()
env = np.ones(mus.shape[1]); tt = np.arange(mus.shape[1]) / SR
env *= np.clip(1 - (tt - 56.55) / 0.85, 0, 1)            # fade into the dive / darkness
env *= np.where(tt < 51.3, 1.0, 1.0)
mus *= env * 10 ** (-3 / 20)
mix[:, :mus.shape[1]] += mus

for c in cues:
    t, ty = c['t'], c['type']
    if ty == 'cursor': add(KB + pick(["Keyboard - Key 1.wav", "Keyboard - Key 2.wav", "Keyboard - Key 3.wav"]), t, -20, -2, lp=6000)
    elif ty == 'burst':
        add(WO + "Combo 1.wav", t - 0.05, -6); add(SF + "teleport_01.ogg", t, -16, -3, lp=5000); add(IM + "impactGlass_light_002.ogg", t, -12, 3)
    elif ty == 'click': add(RC + f"Small Cube - Twist {1 + c['i'] % 14}.wav", t, -15 + rs.rand() * 4, rs.uniform(-1, 3), pan=rs.uniform(-.4, .4))
    elif ty == 'swap': add(RC + "Big Cube - Click 1.wav", t, -6); add(IM + "impactBell_heavy_001.ogg", t, -20, 5, lp=7000)
    elif ty == 'eyes': add(PL + "Plop - Airy 1.wav", t, -6, 3)
    elif ty == 'wake':
        add(SF + "terminal_02.ogg", t, -18); add(KB + "Keyboard - Typing 1.wav", t + 0.05, -14, 0, fade_out=0.4, length=2.4)
    elif ty == 'key': pass
    elif ty == 'stairUp': add(WO + f"Twirl Smol {1 + rs.randint(6)}.wav", t, -13, rs.uniform(-1, 2), pan=rs.uniform(-.3, .3))
    elif ty == 'stairLock': add(KB + f"Model D - Switch {1 + rs.randint(7)}.wav", t, -10, rs.uniform(-2, 0))
    elif ty == 'hop': add(WO + f"Swish {1 + rs.randint(6)}.wav", t, -16, 3)
    elif ty == 'land': add(RC + f"Small Cube - Drop {1 + c.get('i', 0) % 3}.wav", t, -8, -2 + c.get('i', 0) * 0.5)
    elif ty == 'leap': add(WO + "Whistle 2.wav", t, -12)
    elif ty == 'fallWhoosh':
        add(WO + "Classic Swish 2.wav", t - 0.05, -6, -5); add("bb - Fans and Drones (Jul 2021)/Air Vent.wav", t, -10, 0, hp=300, fade_in=0.3, fade_out=0.5, length=1.9)
    elif ty == 'fallWhoosh2': add(WO + "Combo 3.wav", t, -8, -3)
    elif ty == 'impact':
        add(IM + "impactSoft_heavy_001.ogg", t, -2, -3); add(WO + "Thunk 1.wav", t, -4, -4); add(IM + "impactPunch_heavy_002.ogg", t, -10, -6, lp=2500)
        add(BIRDS, t + 0.2, -15, 0, fade_in=2.0, length=25.0, fade_out=2.5)
    elif ty == 'treeGrow':
        add(PL + f"Plop - Airy {1 + rs.randint(4)}.wav", t, -9, rs.uniform(2, 6)); add(f"100-CC0-SFX/bell_0{1 + rs.randint(3)}.ogg", t + 0.05, -24, 7, hp=1500)
    elif ty == 'steps':
        n = int(c['dur'] / 0.13)
        for k in range(n): add(IM + f"footstep_grass_00{k % 5}.ogg", t + k * 0.13, -20, 5, pan=0.2 * (-1) ** k)
    elif ty == 'sit': add(RC + "Small Cube - Squeeze 1.wav", t + 0.2, -12)
    elif ty == 'drip': add(WS + "bubble_02.ogg", t, -10, 4)
    elif ty == 'blinkTwin': add(IM + "impactGlass_light_001.ogg", t, -14, 7, hp=2000); add(IM + "impactGlass_light_003.ogg", t + 0.12, -18, 12, hp=2000)
    elif ty == 'startle': add(WO + "Whistle 4.wav", t, -12, 2); add(PL + "Plop - Sputter 1.wav", t, -12, 4)
    elif ty == 'splash': add(WS + "splash_03.ogg", t, -4); add(WS + "splash_07.ogg", t + 0.1, -10, 3)
    elif ty == 'split':
        g = c['g']; n = min(1 << (g - 1), 10)
        for k in range(n): add(PL + f"Plop - Airy {1 + rs.randint(4)}.wav", t + rs.uniform(0, 0.12) * (k > 0), -9 - 1.5 * np.log2(n + 1), 2 + g * 0.8 + rs.uniform(-1, 1), pan=rs.uniform(-.6, .6))
    elif ty == 'crowdHop':
        for k in range(14): add(IM + f"impactGeneric_light_00{rs.randint(5)}.ogg", t + 0.2 + rs.uniform(-0.06, 0.12), -20, rs.uniform(-3, 3), pan=rs.uniform(-.8, .8))
    elif ty == 'stampede':
        for k in range(60): add(IM + f"footstep_grass_00{rs.randint(5)}.ogg", t + rs.uniform(0, 1.7), -24, rs.uniform(0, 7), pan=rs.uniform(-.9, .9))
        add(WO + "Combo 2.wav", t + 1.2, -8, -2)
    elif ty == 'rush':
        add(WO + "Combo 4.wav", t, -6, -4); add("bb - Fans and Drones (Jul 2021)/Air Vent.wav", t, -12, -2, hp=200, fade_in=0.5, fade_out=1.0, length=4.4)
    elif ty == 'stack': add(RC + f"Big Cube - Twist {1 + c['i'] % 14}.wav", t, -15 + c['i'] * 0.15, -3, pan=rs.uniform(-.5, .5))
    elif ty == 'giantLand':
        add(IM + "impactPunch_heavy_004.ogg", t, 0, -9); add("Micro Pack - Chairmat/Fake Thunder 1.wav", t, -4, -3, lp=1800)
        add("100-cc0-sfx-2/sfx100v2_thunder_01.ogg", t + 0.05, -8, -2, lp=3000, fade_out=1.5)
    elif ty == 'giantBlink': add(RC + "Big Cube - Click 2.wav", t, -6, -7); add(RC + "Big Cube - Click 1.wav", t + 0.25, -8, -6)
    elif ty == 'giantWave': add(WO + "Twirl 2.wav", t, -10, -5); add(WO + "Twirl 3.wav", t + 0.75, -11, -5)
    elif ty == 'dive':
        add("100-cc0-sfx-2/sfx100v2_thunder_01.ogg", t, -10, 0, rev=True, hp=150, length=None)
        add(WO + "Combo 4.wav", t + 1.1, -6, 2)
    elif ty == 'black':
        for k, tb in enumerate([t, t + 1.06]): add(KB + "Keyboard - Key 2.wav", tb + 0.02, -18, -2, lp=6000)
    elif ty == 'cursorWake': add(KB + "Model D - Switch 3.wav", t, -8); add(PL + "Plop - Airy 3.wav", t + 0.1, -10, 5)
    elif ty == 'cursorEyes': add(PL + "Plop - Airy 4.wav", t, -8, 7)
    elif ty == 'wink': add("100-CC0-SFX/bell_02.ogg", t, -14, 5, hp=800); add(IM + "impactGlass_light_000.ogg", t, -16, 10)
    elif ty == 'off': add(KB + "Button - Push 1.wav", t, -8)

# gentle air on the terminal-in-the-sky reveal
add("bb - Fans and Drones (Jul 2021)/Outside.wav", 13.5, -24, 0, hp=250, fade_in=3, fade_out=1.5, length=6.4)
# pond water bed
add(WS + "loop_water_01.ogg", 28.4, -24, 0, fade_in=1.5, fade_out=1.5, length=10)

# master: soft clip + normalise
peak = np.abs(mix).max()
mix = np.tanh(mix / peak * 1.3) / np.tanh(1.3) * 0.9
sf.write(OUT, mix.T, SR, subtype='PCM_24')
print('wrote', OUT, mix.shape[1] / SR)
