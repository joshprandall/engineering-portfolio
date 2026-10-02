# Website 3.0 gapless background-audio repair evidence

Status: preview branch only; not deployed.

## Root cause and repair

The Night WAV was already built as a circularly crossfaded PCM loop. The old
runtime nevertheless ran two independent `HTMLAudioElement` instances and
started a second 180 ms crossfade from `timeupdate`. That event is deliberately
low-frequency and is not synchronized to the audio render quantum, so the
runtime could miss or move the prepared musical seam and could overlap the
already-crossfaded material.

Night playback now fetches and decodes the WAV once, starts one
`AudioBufferSourceNode`, enables `loop`, and routes it through the existing
site-volume `GainNode`. The cold fallback is one looping MP3 media element and
is activated only when Web Audio or WAV decoding is unavailable. `SiteAudio`
remains the sole owner in both cases.

## Master and Day-audio audit

The complete machine-readable measurements are in
`docs/audio-loop-analysis.json` and can be regenerated with
`tools/analyze_audio_loops.py` plus FFmpeg.

| Asset | Decoded duration | Seam result |
| --- | ---: | --- |
| Night v32 WAV | 22.093786848 s | 16-bit, 44.1 kHz stereo; seam delta -32.58/-34.36 dBFS; negligible DC; no master rebuild indicated |
| Day river MP3 | 299.983038549 s | Boundary delta is 1.51/2.14× normal adjacent-sample RMS; edge levels match within 0.29 dB |
| Day waterfall MP3 | 29.664013605 s | Boundary delta is below normal adjacent-sample RMS; no click-class discontinuity |
| Day beach pair | 14.328004535 / 12.504013605 s | These are alternating field recordings and retain the existing 1.2 s acoustic overlap; no Night-style double crossfade exists |

No audio assets were rewritten.

## Verification

- Deterministic controller suite: 13/13 passing, including three simulated
  complete Night boundaries with one source start, fallback, mute, navigation,
  visibility, theme changes, scene changes, and volume bounds.
- Chrome desktop: two real-time complete boundaries; one source start; playback
  rate 1.0; one active 5% output.
- Edge desktop: one real-time complete boundary with the same invariants.
- Chrome mobile-equivalent context: one real-time complete boundary with the
  same invariants.
- Theme teardown/restart and mute/unmute passed in all real-browser runs.
- Firefox and a WebKit/Safari runtime were not installed on the test machine.
  The standards-compatible Web Audio path and single-element fallback were
  validated deterministically, but this is not a claim of physical iOS device
  testing.

Automated checks establish decoded seam quality and source continuity; they do
not replace a final human listening pass on the preview at the user's normal
headphones/speakers.
