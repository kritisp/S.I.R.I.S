import subprocess
import time
import sys

PIPER = r"D:\piper\piper.exe"
MODEL = r"D:\piper\amy.onnx"

text = "Hello, this is AIRA. This audio is generated locally using Piper."

print("Starting Piper...")

start = time.perf_counter()

process = subprocess.Popen(
    [
        PIPER,
        "--model",
        MODEL,
        "--output_raw",
    ],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)

audio_data, error = process.communicate(
    input=text.encode("utf-8")
)

elapsed = (time.perf_counter() - start) * 1000

if process.returncode != 0:
    print("Piper failed:")
    print(error.decode(errors="replace"))
    sys.exit(1)

print()
print("========================================")
print("PIPER PIPE TEST")
print("========================================")
print(f"Audio bytes received: {len(audio_data)}")
print(f"Generation time: {elapsed:.1f} ms")
print("Audio stored: MEMORY ONLY")
print("WAV file created: NO")
print("========================================")