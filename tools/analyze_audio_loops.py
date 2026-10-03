#!/usr/bin/env python3
"""Decode loop assets and report objective boundary/seam measurements.

Usage:
  python tools/analyze_audio_loops.py --output report.json label=path [...]

FFmpeg/ffprobe are used only as decoders. Measurements are calculated over the
decoded float PCM, which makes WAV, MP3 and OGG inputs directly comparable.
"""

from __future__ import annotations

import argparse
import array
import hashlib
import json
import math
import pathlib
import subprocess
import sys


def command_json(command: list[str]) -> dict:
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def decoded_pcm(path: pathlib.Path) -> tuple[array.array, dict]:
    metadata = command_json([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_fmt,sample_rate,channels,bits_per_sample",
        "-of", "json", str(path),
    ])["streams"][0]
    sample_rate = int(metadata["sample_rate"])
    channels = int(metadata["channels"])
    result = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0",
         "-f", "f32le", "-acodec", "pcm_f32le", "-"],
        check=True, capture_output=True,
    )
    samples = array.array("f")
    samples.frombytes(result.stdout)
    if sys.byteorder != "little":
        samples.byteswap()
    return samples, metadata


def dbfs(value: float) -> float | None:
    return round(20 * math.log10(value), 4) if value > 0 else None


def analyze(label: str, path: pathlib.Path) -> dict:
    samples, metadata = decoded_pcm(path)
    sample_rate = int(metadata["sample_rate"])
    channels = int(metadata["channels"])
    frames = len(samples) // channels
    if frames < 2:
        raise ValueError(f"{path} contains fewer than two decoded frames")
    edge_frames = min(frames // 2, round(sample_rate * 0.25))
    channel_reports = []
    for channel in range(channels):
        values = samples[channel::channels]
        first = float(values[0])
        last = float(values[-1])
        seam_delta = abs(first - last)
        adjacent_squared = math.fsum(
            (float(values[index]) - float(values[index - 1])) ** 2
            for index in range(1, len(values))
        )
        adjacent_rms = math.sqrt(adjacent_squared / (len(values) - 1))
        start_rms = math.sqrt(math.fsum(float(v) ** 2 for v in values[:edge_frames]) / edge_frames)
        end_rms = math.sqrt(math.fsum(float(v) ** 2 for v in values[-edge_frames:]) / edge_frames)
        channel_reports.append({
            "channel": channel,
            "firstSample": round(first, 8),
            "lastSample": round(last, 8),
            "seamDelta": round(seam_delta, 8),
            "seamDeltaDbfs": dbfs(seam_delta),
            "adjacentDeltaRms": round(adjacent_rms, 8),
            "seamToAdjacentRmsRatio": round(seam_delta / adjacent_rms, 4) if adjacent_rms else None,
            "dcOffset": round(math.fsum(float(v) for v in values) / len(values), 10),
            "start250msRmsDbfs": dbfs(start_rms),
            "end250msRmsDbfs": dbfs(end_rms),
            "edgeRmsChangeDb": round(20 * math.log10(end_rms / start_rms), 4)
                if start_rms > 0 and end_rms > 0 else None,
        })
    return {
        "label": label,
        "fileName": path.name,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "codec": metadata.get("codec_name"),
        "sampleFormat": metadata.get("sample_fmt"),
        "bitsPerSample": int(metadata.get("bits_per_sample") or 0) or None,
        "sampleRate": sample_rate,
        "channels": channels,
        "decodedFrames": frames,
        "decodedDurationSeconds": round(frames / sample_rate, 9),
        "edgeWindowSeconds": round(edge_frames / sample_rate, 6),
        "channelsAnalysis": channel_reports,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("assets", nargs="+", help="path or label=path")
    parser.add_argument("--output", type=pathlib.Path)
    args = parser.parse_args()
    records = []
    for item in args.assets:
        label, raw_path = item.split("=", 1) if "=" in item else (pathlib.Path(item).name, item)
        records.append(analyze(label, pathlib.Path(raw_path).resolve()))
    report = {
        "schemaVersion": 1,
        "method": "FFmpeg-decoded float32 PCM; seam is absolute last-to-first sample delta per channel.",
        "assets": records,
    }
    encoded = json.dumps(report, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded, encoding="utf-8")
    else:
        print(encoded, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
