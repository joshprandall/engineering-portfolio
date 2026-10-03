"""Build four short, silent, captioned educational videos from local artwork.

Requires Pillow and FFmpeg. Run from the repository root. Frames and captions
are generated from one reviewed script; no external media or network is used.
"""
from pathlib import Path
import math
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/content'
FPS, SECONDS, WIDTH, HEIGHT = 12, 6, 960, 540
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

STORIES = {
    'learn': ('A learning method', (
        ('Frame the question', 'What does the claim say, and where does it hold?'),
        ('Work the model', 'A universal claim needs every case in its domain.'),
        ('Try to refute', 'One counterexample defeats a universal claim.'),
        ('Explain the limit', 'Finite tests give evidence, not a proof for all cases.'),
    )),
    'security': ('A bounded security test', (
        ('Use a synthetic fixture', 'Local request: ../lab-secret.txt'),
        ('Reproduce the boundary', 'A naive virtual resolver escapes /lab.'),
        ('Block the escape', 'A bounded resolver rejects the request.'),
        ('Record the evidence', 'Save expected versus observed; repeat the test.'),
    )),
    'projects': ('An engineering case study', (
        ('State the problem', 'Define a measurable user outcome.'),
        ('Trace the system', 'Follow input, transformation, and visible result.'),
        ('Run a check', 'Use the local demo and inspect its output.'),
        ('Report the boundary', 'Separate simulated results from untested claims.'),
    )),
    'ai': ('An AI evaluation workflow', (
        ('Define the task', 'What is predicted, classified, or generated?'),
        ('Build a baseline', 'Compare against a simple reference.'),
        ('Hold out evidence', 'Measure errors on unseen examples.'),
        ('State the limits', 'Describe data limits and human review.'),
    )),
}


def timestamp(seconds):
    return f'00:00:{seconds:02d}.000'


def frame(title, steps, index, phase):
    im = Image.new('RGB', (WIDTH, HEIGHT), '#091c2a')
    d = ImageDraw.Draw(im)
    for y in range(HEIGHT):
        d.line((0, y, WIDTH, y), fill=(9 + y // 45, 28 + y // 30, 42 + y // 22))
    for x in range(44, WIDTH, 48):
        for y in range(40, HEIGHT, 48):
            d.ellipse((x-1, y-1, x+1, y+1), fill='#285063')
    eyebrow = ImageFont.truetype(BOLD, 17)
    heading = ImageFont.truetype(BOLD, 48)
    body = ImageFont.truetype(FONT, 27)
    small = ImageFont.truetype(FONT, 17)
    d.text((68, 52), title.upper(), font=eyebrow, fill='#8edbe1')
    d.text((68, 136), steps[index][0], font=heading, fill='#f1f5f2')
    d.text((70, 222), steps[index][1], font=body, fill='#d6e9e8')
    xs = (137, 365, 593, 821)
    d.line((xs[0], 365, xs[-1], 365), fill='#326578', width=5)
    end = xs[index] + int((xs[min(index+1, 3)]-xs[index])*phase)
    d.line((xs[0], 365, end, 365), fill='#89d8de', width=6)
    for n, x in enumerate(xs):
        active = n == index
        radius = 15 + (int(3*math.sin(phase*math.pi)) if active else 0)
        color = '#f3bd83' if active else '#89d8de' if n < index else '#326578'
        d.ellipse((x-radius, 365-radius, x+radius, 365+radius), fill=color)
        d.text((x, 406), f'{n+1:02}', anchor='mm', font=small, fill='#d6e9e8')
    d.text((68, 493), 'A visual method · full transcript beside the video', font=small, fill='#afcbd0')
    return im


def build(name, title, steps):
    DEST.mkdir(parents=True, exist_ok=True)
    target = DEST / f'{name}-method.mp4'
    command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
               '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s:v', f'{WIDTH}x{HEIGHT}',
               '-r', str(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264',
               '-threads', '2', '-preset', 'veryfast', '-crf', '28',
               '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-level:v', '3.1',
               '-bf', '0', '-g', '24', '-movflags', '+faststart', str(target)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for index in range(len(steps)):
            for tick in range(FPS * SECONDS):
                process.stdin.write(frame(title, steps, index,
                                          tick / (FPS * SECONDS)).tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError('FFmpeg failed building ' + str(target))
    cues = ['WEBVTT', '']
    for index, (label, explanation) in enumerate(steps):
        cues.extend((f'{timestamp(index*SECONDS)} --> {timestamp((index+1)*SECONDS)}',
                     f'{label}. {explanation}', ''))
    (DEST / f'{name}-method.vtt').write_text('\n'.join(cues), encoding='utf-8')
    print(f'{target.relative_to(ROOT)}: {target.stat().st_size} bytes')


if __name__ == '__main__':
    for key, (title, steps) in STORIES.items():
        build(key, title, steps)
