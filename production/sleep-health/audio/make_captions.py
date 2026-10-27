"""Build caption cues from the aligned word timestamps of VO take 1 + timeline offsets.
Writes src/captions.ts (on-screen kinetic subtitles) and out/RESHAPE_Sleep_Health.srt."""
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.dirname(HERE)
words = [w for w in json.load(open(f'{HERE}/vo-takes/take1-words.json'))['words'] if not re.match(r'^\[|\]$', w['text'])]
TL = json.load(open(f'{HERE}/timeline.json'))
segs = TL['segments']
DIAC = re.compile('[ً-ْٰـ]')
def strip(s, keep_shadda=False):
    s = re.sub('[ً-ِْٰـ]', '', s) if keep_shadda else DIAC.sub('', s)
    return s.replace('…', '…').strip()
def place(t, end=False):
    cands = [s for s in segs if s['src'][0] - 0.05 <= t <= s['src'][1] + 0.05]
    if not cands: raise ValueError(t)
    # a word START on a boundary belongs to the later segment; a word END to the earlier one
    s = (min if end else max)(cands, key=lambda s: s['src'][0])
    return t - s['src'][0] + s['dst']
# cues: (first word index, last word index, display override, emphasis words)
# indices refer to the 80 spoken tokens in order
texts = [strip(w['text']) for w in words]
def idx(tok, start=0):
    for i in range(start, len(texts)):
        if texts[i].startswith(tok): return i
    raise KeyError(tok)
CUES = [
    ('تحسب', 'تضرك…', None, []),
    ('دامك', 'صاحي؟', None, ['صاحي؟']),
    ('دراسة', 'لأسبوعين،', None, ['ست', 'ساعات']),
    ('ممكن', 'انتبهت.', None, ['تركيزك…']),
    ('ودراسة', 'النوم', None, []),
    ('بزيادة', 'بالزكام.', None, ['بالزكام.']),
    ('والأبحاث', 'الكافي', None, []),
    ('بمخاطر', 'القلب.', None, ['القلب.']),
    ('وانتظام', 'مهم.', None, ['وانتظام']),
    ('عشان', 'بالغ،', None, []),
    ('حاول', 'ساعات،', None, ['سبع', 'إلى', 'تسع']),
    ('وثبت', 'وصحوتك،', 'وثبّت وقت نومك وصحوتك', ['وثبّت']),
    ('وخفف', 'بالمساء.', 'وخفّف الكافيين بالمساء', ['وخفّف']),
    ('النوم', 'رفاهية…', None, []),
    ('النوم', 'صحة.', None, ['صحة.']),
    ('ري', 'شيب.', 'ري شيب', []),
]
cues = []; cursor = 0
for first, last, override, emph in CUES:
    i = idx(first, cursor); j = idx(last, i); cursor = j + 1
    start = place(words[i]['start']); end = place(words[j]['end'], end=True)
    text = override or ' '.join(texts[i:j+1])
    cues.append({'start': round(start, 3), 'end': round(end + 0.25, 3), 'text': text, 'emph': emph,
                 'seg': max([s for s in segs if s['dst'] <= start + 0.01], key=lambda s: s['dst'])['id']})
# avoid overlaps
for a, b in zip(cues, cues[1:]):
    if a['end'] > b['start'] - 0.04: a['end'] = round(b['start'] - 0.04, 3)
ts = 'export type Cue = {start: number; end: number; text: string; emph: string[]; seg: string};\n'
ts += 'export const CUES: Cue[] = ' + json.dumps(cues, ensure_ascii=False, indent=2) + ';\n'
open(f'{P}/src/captions.ts', 'w').write(ts)
def fmt(t):
    h = int(t//3600); m = int(t%3600//60); s = int(t%60); ms = int(round((t-int(t))*1000))
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
os.makedirs(f'{P}/out', exist_ok=True)
with open(f'{P}/out/RESHAPE_Sleep_Health.srt', 'w') as f:
    for n, c in enumerate(cues, 1):
        f.write(f"{n}\n{fmt(c['start'])} --> {fmt(c['end'])}\n{c['text']}\n\n")
for c in cues: print(f"{c['start']:6.2f}-{c['end']:6.2f} [{c['seg']}] {c['text']}")
