#!/usr/bin/env bash
# Transcribe a video (or audio) file with whisper.cpp.
#
# Usage: scripts/transcribe.sh <video-file> [model]
#   model defaults to base.en (others: tiny.en, small.en, medium.en, large-v3, ...)
#
# Builds whisper.cpp and downloads the model on first run. Writes
# <video-file>.txt and <video-file>.srt next to the input.
# Requires: git, cmake, a C++ compiler, ffmpeg, curl or wget.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <video-file> [model]" >&2
  exit 1
fi

input="$1"
model="${2:-base.en}"
whisper_dir="${WHISPER_DIR:-$HOME/whisper.cpp}"
model_file="$whisper_dir/models/ggml-$model.bin"

if [ ! -f "$input" ]; then
  echo "error: '$input' not found" >&2
  exit 1
fi

if [ ! -x "$whisper_dir/build/bin/whisper-cli" ]; then
  [ -d "$whisper_dir" ] || git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git "$whisper_dir"
  cmake -S "$whisper_dir" -B "$whisper_dir/build" -DCMAKE_BUILD_TYPE=Release
  cmake --build "$whisper_dir/build" -j"$(nproc)" --config Release
fi

if [ ! -f "$model_file" ]; then
  sh "$whisper_dir/models/download-ggml-model.sh" "$model"
fi

# whisper.cpp expects 16 kHz mono 16-bit WAV.
wav="$(mktemp --suffix=.wav)"
trap 'rm -f "$wav"' EXIT
ffmpeg -nostdin -loglevel error -y -i "$input" -vn -ar 16000 -ac 1 -c:a pcm_s16le "$wav"

"$whisper_dir/build/bin/whisper-cli" -m "$model_file" -f "$wav" \
  -t "$(nproc)" -otxt -osrt -of "$input"

echo "Transcript written to $input.txt and $input.srt"
