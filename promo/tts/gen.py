# 生成旁白：本地 audio.cpp（Fish Audio S2 Pro 音色克隆 + manbo_ref.wav）→ 去首尾静音 + 峰值归一 → mp3 → base64 写进 ../js/vo.js
# 用法：python gen.py        （只重新生成改过的句子；换音色/参数会让缓存 hash 变化）
import json, hashlib, base64, subprocess, os, sys, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out"); os.makedirs(OUT, exist_ok=True)
ACPP = r"V:\software\AI\audio-cpp"
REF = os.path.join(ACPP, "manbo_ref.wav")
# manbo_ref.wav 的文字稿（必须和参考音频内容一致，换参考音频就要换）
REF_TEXT = "大家好，今天的训练也要全力以赴哦。记住，无论是跑步还是学习，保持良好的节奏最重要。让我们一起朝着梦想奔跑吧！相信只要努力，一定能创造属于自己的记录。加油！"
SEED = 42
VOICE = f"fish-s2pro-manbo-{SEED}"  # 进缓存 hash

# 去首尾静音（尾部多留 80ms）+ 峰值归一到约 -0.7dB
TRIM = ("silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.03,"
        "areverse,silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.08,areverse")

def peak_gain(wav):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", wav, "-af", TRIM + ",volumedetect", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = re.search(r"max_volume:\s*(-?[\d.]+) dB", r.stderr)
    return (-0.7 - float(m.group(1))) if m else 0.0

lines = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
res = []
for ln in lines:
    say = (ln.get("say") or ln["zh"]).replace("——", "，")
    h = hashlib.md5(f"{VOICE}{say}".encode()).hexdigest()[:10]
    mp3 = os.path.join(OUT, f"{ln['id']}-{h}.mp3")
    if not os.path.exists(mp3):
        wav = mp3[:-4] + ".wav"
        cmd = [os.path.join(ACPP, "audiocpp_cli.exe"), "--task", "tts", "--family", "fish_audio",
               "--model", os.path.join(ACPP, "models", "Fish-Audio-S2-Pro-GGUF"), "--backend", "cuda",
               "--language", "zh", "--voice-ref", REF, "--request-option", f"reference_text={REF_TEXT}",
               "--text", say, "--out", wav, "--seed", str(SEED)]
        r = subprocess.run(cmd, cwd=ACPP, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0 or not os.path.exists(wav):
            sys.exit(f"{ln['id']} FAIL {r.returncode}\n{(r.stderr or r.stdout)[-800:]}")
        g = peak_gain(wav)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", f"{TRIM},volume={g:.2f}dB",
                        "-ac", "1", "-b:a", "96k", mp3], check=True)
        os.remove(wav)
        print("gen", ln["id"], file=sys.stderr, flush=True)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3],
                               capture_output=True, text=True).stdout.strip())
    b64 = base64.b64encode(open(mp3, "rb").read()).decode()
    res.append({"id": ln["id"], "zh": ln["zh"], "en": ln["en"], "dur": round(dur, 3), "src": "data:audio/mpeg;base64," + b64})

js = os.path.join(HERE, "..", "js", "vo.js"); os.makedirs(os.path.dirname(js), exist_ok=True)
with open(js, "w", encoding="utf-8") as f:
    f.write("// 自动生成（tts/gen.py），不要手改\nwindow.VO = " + json.dumps({r["id"]: r for r in res}, ensure_ascii=False) + ";\n")
print("total", round(sum(r["dur"] for r in res), 1), "s,", len(res), "lines")
