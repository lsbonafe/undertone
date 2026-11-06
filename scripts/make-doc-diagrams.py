"""Generate the README's original SVG diagrams with the Python standard library."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent / 'docs' / 'diagrams'
ROOT.mkdir(parents=True, exist_ok=True)


def document(title, description, height):
    return [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="{height}" viewBox="0 0 1200 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>
<style>text{{font-family:Arial,Helvetica,sans-serif;fill:#263c35}}.small{{font-size:17px;fill:#54675f}}.label{{font-size:20px;font-weight:700}}.title{{font-size:30px;font-weight:700}}.note{{font-size:24px;font-weight:700}}.mono{{font-family:Menlo,Consolas,monospace;font-size:18px}}</style>
<rect width="1200" height="{height}" rx="22" fill="#f4f1e8"/>''']


def text(parts, x, y, value, style='small', extra=''):
    parts.append(f'<text x="{x}" y="{y}" class="{style}" {extra}>{escape(str(value))}</text>')


def line(parts, x1, y1, x2, y2, color='#d4dacf', width=2, extra=''):
    parts.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}" {extra}/>')


p = document('One hand, two musical behaviors', 'Illustrative timeline: gesture mode speeds up notes and holds a harmony on stopping; groove mode keeps its beat and plays its lead only during scrolling.', 690)
text(p, 40, 52, 'One hand. Two musical behaviors.', 'title')
text(p, 40, 84, 'Illustrative timing, not a recording. Fast movement never queues skipped notes.')
columns = [(300, 'SLOW SCROLL'), (512, 'READING'), (724, 'FAST SCROLL'), (936, 'STOP SCROLLING')]
for x, label in columns:
    p.append(f'<rect x="{x}" y="116" width="212" height="444" fill="{"#e0e8dc" if x == 936 else "#ede9df"}"/>')
    text(p, x + 12, 147, label, 'small')
    line(p, x, 160, x, 560, '#d3d9cc', 1, 'stroke-dasharray="4 5"')

text(p, 40, 206, 'GESTURE MODE', 'label')
text(p, 40, 234, 'Readings 01–17')
text(p, 40, 269, 'Hand → phrasing')
line(p, 300, 240, 1148, 240)
hits = [325, 430, 525, 590, 650, 705, 742, 777, 812, 847, 882, 917]
for i, x in enumerate(hits):
    p.append(f'<circle cx="{x}" cy="240" r="8" fill="#b06440"/>')
    line(p, x, 240, x + (36 if i < 6 else 20), 240, '#b06440', 4)
line(p, 936, 240, 1136, 240, '#527461', 7)
text(p, 967, 275, 'Hold the harmony')
text(p, 304, 318, 'Wider gaps → closer gaps → bounded fast phrasing → held harmony')

text(p, 40, 387, 'GROOVE MODE', 'label')
text(p, 40, 415, 'Readings 18–20')
text(p, 40, 452, 'Clock → backing')
text(p, 40, 511, 'Hand → lead')
line(p, 300, 437, 1148, 437)
for x in range(318, 1140, 53):
    p.append(f'<rect x="{x}" y="429" width="11" height="16" rx="3" fill="#527461"/>')
line(p, 300, 499, 1148, 499)
for x in hits:
    p.append(f'<circle cx="{x}" cy="499" r="8" fill="#b06440"/>')
line(p, 925, 499, 989, 499, '#b06440', 4, 'stroke-dasharray="6 6"')
text(p, 1010, 511, 'Lead rings out')
text(p, 304, 552, 'Steady backing; lead notes follow your hand, then ring out.')

for x, label in [(40, 'Tiny jitter is ignored'), (415, 'Big jumps do not queue notes'), (820, 'Pause sound → silence')]:
    p.append(f'<rect x="{x}" y="597" width="340" height="48" rx="10" fill="#e3e6dc"/>')
    text(p, x + 15, 627, label)
p.append('</svg>')
(ROOT / 'scroll-behavior.svg').write_text('\n'.join(p) + '\n')

p = document('A shared pitch palette in both directions', 'D Lydian notes, forward and backward melodic order, and a D-root held voicing with simple frequency ratios.', 720)
text(p, 40, 52, 'Change the order. Keep a shared musical home.', 'title')
text(p, 40, 84, 'D Lydian: G♯ adds color; D and A give the phrase a recurring center.')
text(p, 40, 148, 'PITCH PALETTE', 'label')
notes = [('D', '1 / root'), ('E', '2'), ('F♯', '3'), ('G♯', '♯4 / color'), ('A', '5 / fifth'), ('B', '6'), ('C♯', '7')]
for i, (note, degree) in enumerate(notes):
    x = 295 + i * 121
    fill = '#e5cbb9' if i == 0 else '#d2dfcf' if i == 4 else '#d8e2e7' if i == 3 else '#fffdf7'
    p.append(f'<rect x="{x}" y="119" width="109" height="118" rx="10" fill="{fill}" stroke="#c5cdc1"/>')
    text(p, x + 54, 169, note, 'note', 'text-anchor="middle"')
    text(p, x + 54, 211, degree, 'small', 'text-anchor="middle"')

text(p, 40, 301, 'SCROLL DOWN', 'label')
text(p, 298, 301, 'D4    →    A4    →    E5    →    F♯5', 'note')
text(p, 40, 354, 'SCROLL UP', 'label')
text(p, 298, 354, 'F♯5   →    E5    →    A4    →    D4', 'note')
text(p, 298, 394, 'Both directions use one palette and a recurring tonal center.')
line(p, 40, 422, 1160, 422)
text(p, 40, 474, 'STOP SCROLLING', 'label')
text(p, 40, 506, 'Gesture-mode example:')
text(p, 40, 535, 'hold the latest color,')
text(p, 40, 564, 'root and fifth.')
text(p, 297, 465, 'Held voice', 'label')
text(p, 489, 465, 'Relative frequency', 'label')
text(p, 938, 465, 'Frequency', 'label')
for y, note, ratio, length, hz in [(510, 'D3 / root', '1 : 1', 130, '~147 Hz'), (557, 'A3 / fifth', '3 : 2', 195, '~220 Hz'), (604, 'F♯4 / upper note', '5 : 2', 325, '~367 Hz')]:
    text(p, 297, y, note)
    p.append(f'<rect x="490" y="{y - 17}" width="{length}" height="20" rx="5" fill="#527461"/>')
    text(p, 835, y, ratio, 'mono')
    text(p, 938, y, hz)
text(p, 40, 667, 'Simple-ratio held tuning and softer spectra are design choices, not a universal guarantee of comfort.')
p.append('</svg>')
(ROOT / 'pitch-palette.svg').write_text('\n'.join(p) + '\n')
print('Generated scroll-behavior.svg and pitch-palette.svg')
