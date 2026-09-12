# public/

Drop the two clips for the reel in this folder:

- `before.mp4`
- `after.mp4`

Then point `src/config/transformationData.ts` at them. Any aspect ratio works —
`SmartVideo` fits the footage to 9:16 by focal point.

Both files are gitignored on purpose: this repository is public and the clips
show an identifiable person. Keep them local, or move them to private storage.

Also here, and committed:

| Path         | What                                                      |
| ------------ | --------------------------------------------------------- |
| `brand/`     | Official RESHAPE logo files + the grain tile               |
| `fonts/`     | Zain + IBM Plex Sans Arabic, Arabic/Latin subsets (OFL)    |
| `sfx/`       | Synthesised sound design — see `scripts/make-sfx.py`       |
| `music/`     | Drop a licensed track here (gitignored)                    |
