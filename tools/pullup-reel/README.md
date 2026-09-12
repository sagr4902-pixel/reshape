# Pull-up Reel pipeline

Turns a fixed-camera pull-up clip into a 1080×1920 Instagram Reel with a rep
counter driven by measured motion, plus an anatomical Latissimus Dorsi intro.

## Rep detection (`analyze.py`)

    python3 analyze.py <video>

The athlete is dark against a flat bright wall, so averaging the dark mask over
the whole clip yields the static furniture (bar, brackets, wall shadow), which
is subtracted. What remains is the athlete. Occupancy of a horizontal band just
below the bar then peaks sharply at the top of each rep and returns to zero at
the bottom — a rep is counted only on a full high→low cycle, so partials,
bounces and setup movement do not register.

For the source clip this reports 20 repetitions, with the last three separated
by 3.1–3.4 s rest gaps. Top and bottom frames were also inspected visually:
the chin clears the bar on every rep and the arms extend at every bottom.

## Render (`render.py`, `anat.py`, `audio.py`)

`render.py` streams source frames from ffmpeg at 1080×1920, composites the
graphics with Pillow and pipes raw frames back to an encoder. `anat.py` holds
the Latissimus Dorsi geometry, measured against the torso silhouette on the
freeze frame. `audio.py` builds the mix: original audio plus a click locked to
each verified rep completion.

The counter increments at the *completion* frame of each rep (return to the
bottom), not on a fixed cadence.

### Lat highlight

The athlete is filmed from the front, so the lats are only visible as the
lateral torso wall below the axilla — there is no back surface to track, and no
pose-estimation model is available offline. Rather than float an approximate
overlay through the set, the highlight is placed once on a freeze frame where
the geometry could be verified against the actual silhouette.

### Running

Scripts read and write alongside themselves; place `src.mov` in the same
directory, then:

    python3 render.py          # -> video_only.mp4
    python3 audio.py           # -> mix.wav
    ffmpeg -i video_only.mp4 -i mix.wav -c:v libx264 -b:v 5600k \
      -pix_fmt yuv420p -c:a aac -b:a 160k \
      -af loudnorm=I=-14:TP=-1.5:LRA=11 -movflags +faststart out.mp4

Requires ffmpeg, numpy, Pillow, and the Inter + Roboto Condensed fonts
(`fonts-inter`, `fonts-roboto`).
