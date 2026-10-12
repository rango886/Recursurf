# 用本地 audio.cpp（Fish Audio S2 Pro 音色克隆 + manbo_ref.wav）试音色，输出到 out_try/
# 用法：python try_fish.py [--seed 42] [--tag 后缀] [--opt 键=值 ...] [id1 id2 ...]
import argparse, json, os, subprocess, time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out_try"); os.makedirs(OUT, exist_ok=True)
ACPP = r"V:\software\AI\audio-cpp"
# manbo_ref.wav 的文字稿（必须和参考音频内容一致，换参考音频就要换）
REF_TEXT = "大家好，今天的训练也要全力以赴哦。记住，无论是跑步还是学习，保持良好的节奏最重要。让我们一起朝着梦想奔跑吧！相信只要努力，一定能创造属于自己的记录。加油！"

ap = argparse.ArgumentParser()
ap.add_argument("ids", nargs="*", default=["logo1", "p1", "a3", "r2", "x3", "o1"])
ap.add_argument("--ref", default=os.path.join(ACPP, "manbo_ref.wav"))
ap.add_argument("--ref-text", default=REF_TEXT)
ap.add_argument("--seed", type=int, default=42)
ap.add_argument("--tag", default="plain")
ap.add_argument("--opt", action="append", default=[], help="额外 --request-option，可多次")
args = ap.parse_args()
args.ref = os.path.abspath(args.ref)

lines = {l["id"]: l for l in json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))}

for i in args.ids:
    say = (lines[i].get("say") or lines[i]["zh"]).replace("——", "，")
    wav = os.path.join(OUT, f"fish-{args.tag}-{i}.wav")
    cmd = [os.path.join(ACPP, "audiocpp_cli.exe"), "--task", "tts", "--family", "fish_audio",
           "--model", os.path.join(ACPP, "models", "Fish-Audio-S2-Pro-GGUF"), "--backend", "cuda",
           "--language", "zh", "--voice-ref", args.ref,
           "--request-option", f"reference_text={args.ref_text}",
           "--text", say, "--out", wav, "--seed", str(args.seed)]
    for o in args.opt: cmd += ["--request-option", o]
    t = time.time()
    r = subprocess.run(cmd, cwd=ACPP, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0 or not os.path.exists(wav):
        print(i, "FAIL", r.returncode, (r.stderr or r.stdout)[-800:]); continue
    mp3 = wav[:-4] + ".mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-b:a", "128k", mp3], check=True)
    os.remove(wav)
    print(i, f"{time.time()-t:.1f}s", mp3, flush=True)
