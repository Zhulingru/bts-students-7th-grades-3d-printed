#!/usr/bin/env python3
"""Scan 名牌 STL files, copy to site/, generate flat previews and manifest."""

from __future__ import annotations

import json
import os
import re
import shutil
from pathlib import Path

os.environ.setdefault("MPLBACKEND", "Agg")

import matplotlib.pyplot as plt
import numpy as np
import trimesh
from matplotlib.collections import PolyCollection

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "名牌"
MODELS_DIR = ROOT / "models" / "nameplates"
PREVIEWS_DIR = ROOT / "previews" / "nameplates"
DATA_FILE = ROOT / "data" / "nameplates.json"

COLOR_HEX = {
    "白色": "#e8e8e8",
    "灰色": "#8a8a8a",
    "黑色": "#2a2a2a",
}

CLASS_MAP = str.maketrans("ＡＢＣａｂｃ", "ABCABC")

# 建模時上下顛倒的學生：繞薄軸旋轉 180° 後再輸出
FLIP_180_NAMES = {"林至誼"}


def parse_student(stem: str) -> tuple[str, str]:
    """Return (class_letter, student_name) from filename stem."""
    m = re.search(r"專案\s*([A-Za-zＡ-Ｚａ-ｚ])\s*班\s*(.+)$", stem)
    if not m:
        return "?", stem
    cls = m.group(1).translate(CLASS_MAP).upper()
    if cls not in "ABC":
        cls = "?"
    rest = m.group(2).strip()
    rest = re.split(r"[＿_]", rest, maxsplit=1)[0]
    rest = re.split(r"\s*名牌", rest, maxsplit=1)[0]
    rest = re.sub(r"名牌色[：:].*$", "", rest)
    rest = re.sub(r"名牌.*$", "", rest)
    rest = rest.replace("顏色：", "").replace("顏色:", "")
    name = rest.strip()
    return cls, name or stem


def fix_orientation(mesh: trimesh.Trimesh, name: str) -> trimesh.Trimesh:
    """Rotate upside-down nameplates 180° around the thin (print) axis."""
    if name not in FLIP_180_NAMES:
        return mesh
    thin_axis = int(np.argmin(mesh.extents))
    axis = np.zeros(3)
    axis[thin_axis] = 1.0
    matrix = trimesh.transformations.rotation_matrix(np.pi, axis, mesh.centroid)
    fixed = mesh.copy()
    fixed.apply_transform(matrix)
    return fixed


def render_preview(mesh: trimesh.Trimesh, out_path: Path, color_hex: str) -> None:
    """Orthographic top-down thumbnail — solid fill, no triangle wireframe."""
    verts = mesh.vertices
    faces = mesh.faces

    # Nameplate is thin along the shortest axis; project onto the flat plane.
    thin_axis = int(np.argmin(mesh.extents))
    plane_axes = [a for a in range(3) if a != thin_axis]
    polys = verts[faces][:, :, plane_axes]

    fig, ax = plt.subplots(figsize=(8, 8), dpi=240, facecolor="#f4f6f8")
    ax.set_facecolor("#f4f6f8")

    collection = PolyCollection(
        polys,
        facecolors=color_hex,
        edgecolors="none",
        linewidths=0,
        antialiased=True,
        rasterized=False,
    )
    ax.add_collection(collection)

    xs = verts[:, plane_axes[0]]
    ys = verts[:, plane_axes[1]]
    pad = 0.06 * max(xs.max() - xs.min(), ys.max() - ys.min(), 1e-6)
    ax.set_xlim(xs.min() - pad, xs.max() + pad)
    ax.set_ylim(ys.min() - pad, ys.max() + pad)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.margins(0.02)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(
        out_path,
        bbox_inches="tight",
        pad_inches=0.08,
        facecolor="#f4f6f8",
        format="png",
    )
    plt.close(fig)


def main() -> None:
    if MODELS_DIR.exists():
        shutil.rmtree(MODELS_DIR)
    if PREVIEWS_DIR.exists():
        shutil.rmtree(PREVIEWS_DIR)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
    (ROOT / "data").mkdir(parents=True, exist_ok=True)

    entries: list[dict] = []
    idx = 0

    for color_dir in sorted(SOURCE.iterdir()):
        if not color_dir.is_dir() or color_dir.name.startswith("."):
            continue
        color = color_dir.name
        if color not in COLOR_HEX:
            continue

        for stl_path in sorted(color_dir.glob("*.stl")) + sorted(color_dir.glob("*.STL")):
            idx += 1
            item_id = f"np-{idx:03d}"
            cls, name = parse_student(stl_path.stem)

            dest_stl = MODELS_DIR / f"{item_id}.stl"
            dest_png = PREVIEWS_DIR / f"{item_id}.png"

            mesh = trimesh.load(stl_path, force="mesh")
            if isinstance(mesh, trimesh.Scene):
                mesh = trimesh.util.concatenate(
                    [g for g in mesh.geometry.values() if isinstance(g, trimesh.Trimesh)]
                )
            mesh = fix_orientation(mesh, name)
            mesh.export(dest_stl)
            render_preview(mesh, dest_png, COLOR_HEX[color])

            entries.append(
                {
                    "id": item_id,
                    "name": name,
                    "class": cls,
                    "color": color,
                    "colorHex": COLOR_HEX[color],
                    "stl": f"models/nameplates/{item_id}.stl",
                    "preview": f"previews/nameplates/{item_id}.png",
                    "sourceFile": stl_path.name,
                }
            )
            print(f"  [{item_id}] {cls}班 {name} ({color})")

    data = {
        "title": "七年級 3D 列印作品",
        "projects": [
            {
                "id": "nameplate",
                "title": "名牌",
                "description": "個人專屬 3D 列印名牌 — 白 / 灰 / 黑 三色",
                "cover": "assets/images/blank-cover.svg",
                "count": len(entries),
            }
        ],
        "nameplates": sorted(entries, key=lambda e: (e["class"], e["name"])),
    }

    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone: {len(entries)} nameplates -> {DATA_FILE}")


if __name__ == "__main__":
    main()
