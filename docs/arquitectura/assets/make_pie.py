#!/usr/bin/env python3
"""Genera el pie chart de estatus de pruebas estilo SWT summary."""
from pathlib import Path
import matplotlib.pyplot as plt

HERE = Path(__file__).parent

labels = ["Passed", "Blocked", "Retest", "Failed"]
values = [18, 0, 0, 0]
colors = ["#2ECC71", "#4A4A4A", "#F1C40F", "#E74C3C"]

filtered = [(l, v, c) for l, v, c in zip(labels, values, colors) if v > 0]
plot_labels = [f[0] for f in filtered]
plot_values = [f[1] for f in filtered]
plot_colors = [f[2] for f in filtered]

fig, ax = plt.subplots(figsize=(8, 5), dpi=150)
wedges, _ = ax.pie(
    plot_values,
    colors=plot_colors,
    startangle=90,
    wedgeprops={"edgecolor": "white", "linewidth": 2},
)
ax.set_title("Milestone: Futcamedic v3.0", loc="left",
             fontsize=14, fontweight="bold", color="#333")

total = sum(values)
legend_labels = [
    f"{v} {l}  ({(v/total*100):.0f}% set to {l})"
    for l, v in zip(labels, values)
]
ax.legend(
    handles=[plt.Rectangle((0, 0), 1, 1, color=c) for c in colors],
    labels=legend_labels,
    loc="center left",
    bbox_to_anchor=(1.0, 0.5),
    frameon=False,
    fontsize=11,
)

ax.text(1.6, -0.9, "100%", fontsize=40, color="#888", transform=ax.transData)
ax.text(1.6, -1.1, "passed", fontsize=16, color="#aaa", transform=ax.transData)
ax.text(1.6, -1.25, "18 / 18 ejecutados (0% sin probar).",
        fontsize=9, color="#aaa", transform=ax.transData)

plt.tight_layout()
out = HERE / "test_status_pie.png"
plt.savefig(out, bbox_inches="tight", facecolor="white")
print(f"OK {out}")
