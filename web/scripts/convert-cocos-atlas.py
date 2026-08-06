#!/usr/bin/env python3
"""Chuyển atlas TexturePacker của Cocos sang Phaser Hash atlas JSON."""

from __future__ import annotations

import json
import plistlib
import re
import shutil
from pathlib import Path


def parse_pair(value: str, expected: int = 2) -> tuple[int, ...]:
    values = tuple(int(number) for number in re.findall(r"-?\d+", value))
    if len(values) != expected:
        raise ValueError(f"Không đọc được giá trị TexturePacker: {value}")
    return values


def convert_plist_atlas(
    plist_path: Path,
    image_path: Path,
    output_json: Path,
    output_image: Path,
) -> None:
    with plist_path.open("rb") as stream:
        atlas = plistlib.load(stream)

    frames: dict[str, dict] = {}
    for file_name, source in atlas.get("frames", {}).items():
        x, y, width, height = parse_pair(source["textureRect"], 4)
        source_width, source_height = parse_pair(source["spriteSourceSize"])
        sprite_width, sprite_height = parse_pair(source["spriteSize"])
        offset_x, offset_y = parse_pair(source.get("spriteOffset", "{0,0}"))
        trimmed = (sprite_width, sprite_height) != (source_width, source_height)
        source_x = round((source_width - sprite_width) / 2 + offset_x)
        source_y = round((source_height - sprite_height) / 2 - offset_y)
        frame_name = Path(file_name).stem

        frames[frame_name] = {
            "frame": {"x": x, "y": y, "w": width, "h": height},
            "rotated": bool(source.get("textureRotated", False)),
            "trimmed": trimmed,
            "spriteSourceSize": {
                "x": source_x,
                "y": source_y,
                "w": sprite_width,
                "h": sprite_height,
            },
            "sourceSize": {"w": source_width, "h": source_height},
        }

    metadata = atlas.get("metadata", {})
    texture_width, texture_height = parse_pair(metadata["size"])
    output_json.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(image_path, output_image)
    output_json.write_text(
        json.dumps(
            {
                "frames": frames,
                "meta": {
                    "app": "Cocos TexturePacker adapter",
                    "format": metadata.get("pixelFormat", "RGBA8888"),
                    "image": output_image.name,
                    "scale": "1",
                    "size": {"w": texture_width, "h": texture_height},
                },
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )


def main() -> None:
    project_root = Path(__file__).resolve().parents[2]
    source_root = project_root / "assets/resources/world"
    output_root = Path(__file__).resolve().parents[1] / "public/game-assets/world/atlases"

    for atlas_name in ("map_tiles", "map_res"):
        convert_plist_atlas(
            source_root / f"{atlas_name}.plist",
            source_root / f"{atlas_name}.png",
            output_root / f"{atlas_name}.json",
            output_root / f"{atlas_name}.png",
        )

    print(f"Đã chuyển atlas Cocos: {output_root}")


if __name__ == "__main__":
    main()
