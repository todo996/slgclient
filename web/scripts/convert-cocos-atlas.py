#!/usr/bin/env python3
"""Chuyển atlas/animation Cocos sang định dạng runtime của Phaser.

Nguồn Cocos không bị sửa. Script hỗ trợ cả hai biến thể plist TexturePacker
đang có trong dự án và giữ đúng trim, offset, rotated, source size.
"""

from __future__ import annotations

import json
import plistlib
import re
import shutil
from pathlib import Path
from typing import Any


def parse_numbers(value: str, expected: int) -> tuple[int, ...]:
    values = tuple(int(number) for number in re.findall(r"-?\d+", value))
    if len(values) != expected:
        raise ValueError(f"Không đọc được giá trị TexturePacker: {value}")
    return values


def parse_frame(source: dict[str, Any]) -> dict[str, Any]:
    rect_value = source.get("textureRect") or source.get("frame")
    if not isinstance(rect_value, str):
        raise ValueError("Frame TexturePacker không có textureRect/frame")

    x, y, logical_width, logical_height = parse_numbers(rect_value, 4)
    rotated = bool(source.get("textureRotated", source.get("rotated", False)))

    # TexturePacker format 2 ghi kích thước logic (chưa xoay) vào `frame`.
    # Phaser cần kích thước thật của hình chữ nhật trong texture.
    packed_width = logical_height if rotated else logical_width
    packed_height = logical_width if rotated else logical_height

    if isinstance(source.get("sourceColorRect"), str):
        source_x, source_y, sprite_width, sprite_height = parse_numbers(
            source["sourceColorRect"],
            4,
        )
        source_width, source_height = parse_numbers(source["sourceSize"], 2)
    else:
        source_width, source_height = parse_numbers(source["spriteSourceSize"], 2)
        sprite_width, sprite_height = parse_numbers(source["spriteSize"], 2)
        offset_x, offset_y = parse_numbers(source.get("spriteOffset", "{0,0}"), 2)
        source_x = round((source_width - sprite_width) / 2 + offset_x)
        source_y = round((source_height - sprite_height) / 2 - offset_y)

    return {
        "frame": {
            "x": x,
            "y": y,
            "w": packed_width,
            "h": packed_height,
        },
        "rotated": rotated,
        "trimmed": (
            sprite_width != source_width
            or sprite_height != source_height
            or source_x != 0
            or source_y != 0
        ),
        "spriteSourceSize": {
            "x": source_x,
            "y": source_y,
            "w": sprite_width,
            "h": sprite_height,
        },
        "sourceSize": {"w": source_width, "h": source_height},
    }


def convert_plist_atlas(
    plist_path: Path,
    image_path: Path,
    output_json: Path,
    output_image: Path,
    strip_frame_prefix: str = "",
) -> dict[str, Any]:
    with plist_path.open("rb") as stream:
        atlas = plistlib.load(stream)

    frames: dict[str, dict[str, Any]] = {}
    for file_name, source in atlas.get("frames", {}).items():
        frame_name = Path(file_name).stem
        if strip_frame_prefix and frame_name.startswith(strip_frame_prefix):
            frame_name = frame_name[len(strip_frame_prefix):]
        frames[frame_name] = parse_frame(source)

    metadata = atlas.get("metadata", {})
    texture_width, texture_height = parse_numbers(metadata["size"], 2)
    output_json.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(image_path, output_image)

    result = {
        "frames": frames,
        "meta": {
            "app": "Cocos TexturePacker adapter",
            "format": metadata.get("pixelFormat", "RGBA8888"),
            "image": output_image.name,
            "scale": "1",
            "size": {"w": texture_width, "h": texture_height},
        },
    }
    output_json.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    return result


def load_frame_uuid_map(meta_path: Path) -> dict[str, str]:
    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    result: dict[str, str] = {}
    for sub_meta in metadata.get("subMetas", {}).values():
        uuid = str(sub_meta.get("uuid", ""))
        name = str(sub_meta.get("name", ""))
        if "@" in uuid and name:
            result[uuid.rsplit("@", 1)[1]] = name
    return result


def convert_army_animations(
    animation_directory: Path,
    atlas_meta_path: Path,
    output_path: Path,
) -> None:
    frame_names = load_frame_uuid_map(atlas_meta_path)
    animations: list[dict[str, Any]] = []

    for path in sorted(animation_directory.glob("qb_run_*.anim")):
        objects = json.loads(path.read_text(encoding="utf-8"))
        clip = objects[0]
        curve = next(
            item
            for item in objects
            if item.get("__type__") == "cc.ObjectCurve"
        )
        frames: list[str] = []
        for reference in curve.get("_values", []):
            uuid = str(reference.get("__uuid__", ""))
            suffix = uuid.rsplit("@", 1)[-1]
            frame_name = frame_names.get(suffix)
            if not frame_name:
                raise ValueError(f"Không tìm thấy frame animation {uuid}")
            frames.append(frame_name)

        duration = float(clip.get("_duration", 0))
        speed = float(clip.get("speed", 1))
        if duration <= 0 or speed <= 0 or not frames:
            raise ValueError(f"Animation {path.name} có metadata không hợp lệ")

        animations.append(
            {
                "key": clip["_name"],
                "frames": frames,
                "frameRate": len(frames) * speed / duration,
                "repeat": -1,
            }
        )

    output_path.write_text(
        json.dumps(
            {"animations": animations},
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )


def main() -> None:
    project_root = Path(__file__).resolve().parents[2]
    source_root = project_root / "assets/resources/world"
    output_root = Path(__file__).resolve().parents[1] / "public/game-assets/world"
    atlas_output_root = output_root / "atlases"

    for atlas_name in (
        "map_tiles",
        "map_res",
        "map_frame_color",
        "component_outside",
        "map_qibing",
    ):
        convert_plist_atlas(
            source_root / f"{atlas_name}.plist",
            source_root / f"{atlas_name}.png",
            atlas_output_root / f"{atlas_name}.json",
            atlas_output_root / f"{atlas_name}.png",
            "",
        )

    shutil.copy2(source_root / "sys_city.png", output_root / "sys_city.png")
    shutil.copy2(
        project_root / "assets/texure/ui/arrow.png",
        output_root / "army_arrow.png",
    )
    convert_army_animations(
        project_root / "assets/animations",
        source_root / "map_qibing.plist.meta",
        output_root / "army_animations.json",
    )

    print(f"Đã chuyển atlas và animation Cocos: {output_root}")


if __name__ == "__main__":
    main()
