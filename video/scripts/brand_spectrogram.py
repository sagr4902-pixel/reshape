"""Spectrogram + formant tracks for brand-name review sheets (pronunciation QA evidence)."""
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import parselmouth
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from vowel_probe import load, SR


def panel(ax, path, t0, t1, title):
    x = load(path)[int(t0 * SR):int(t1 * SR)]
    snd = parselmouth.Sound(x, SR)
    spec = snd.to_spectrogram(window_length=0.008, maximum_frequency=5000)
    X, Y = spec.x_grid(), spec.y_grid()
    db = 10 * np.log10(np.maximum(spec.values, 1e-12))
    ax.pcolormesh(X, Y, db, vmin=db.max() - 65, cmap="magma", shading="auto")
    form = snd.to_formant_burg(time_step=0.005, max_number_of_formants=5, maximum_formant=5000)
    ts = np.arange(0, snd.duration, 0.005)
    for k, c in ((1, "cyan"), (2, "lime")):
        ax.plot(ts, [form.get_value_at_time(k, t) for t in ts], ".", ms=2, color=c)
    ax.set_title(title, fontsize=9)
    ax.set_ylim(0, 5000)


if __name__ == "__main__":
    out = sys.argv[1]
    items = [a.split(":", 3) for a in sys.argv[2:]]  # path:t0:t1:title
    fig, axes = plt.subplots(1, len(items), figsize=(3.2 * len(items), 3.2), squeeze=False)
    for ax, (p, a, b, t) in zip(axes[0], items):
        panel(ax, p, float(a), float(b), t)
    fig.tight_layout()
    fig.savefig(out, dpi=110)
