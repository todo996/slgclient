#!/usr/bin/env python3
"""Chuẩn bị asset Cocos cần thiết cho client web.

- Chuyển map TMX/TSX sang Tiled JSON cho Phaser.
- Giữ nguyên tile ID, layer, kích thước, thứ tự render và trạng thái visible.
- Sao chép đúng tileset, map config và các mảnh UI được tái sử dụng.

Script chỉ tạo output runtime trong ``web/public/game-assets``; nguồn Cocos không bị sửa.
"""

from __future__ import annotations

import argparse
import json
import plistlib
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path


def integer(value: str | None, default: int = 0) -> int:
    return int(value) if value is not None else default


def number(value: str | None, default: float = 0) -> float | int:
    if value is None:
        return default
    parsed = float(value)
    return int(parsed) if parsed.is_integer() else parsed


def parse_csv(data_text: str | None, expected: int, layer_name: str) -> list[int]:
    values = [
        int(item.strip())
        for item in (data_text or "").replace("\n", "").split(",")
        if item.strip()
    ]
    if len(values) != expected:
        raise ValueError(
            f"Layer {layer_name!r} có {len(values)} tile, cần đúng {expected}."
        )
    return values


def parse_tileset(reference: ET.Element, source_dir: Path, output_dir: Path) -> dict:
    source_name = reference.attrib.get("source")
    if not source_name:
        raise ValueError("Map chứa tileset nhúng chưa được hỗ trợ.")

    source_path = source_dir / source_name
    tileset = ET.parse(source_path).getroot()
    image = tileset.find("image")
    if image is None or not image.attrib.get("source"):
        raise ValueError(f"Tileset {source_name} không có image hợp lệ.")

    image_source = image.attrib["source"]
    image_path = source_path.parent / image_source
    output_image = output_dir / Path(image_source).name
    shutil.copy2(image_path, output_image)

    result = {
        "firstgid": integer(reference.attrib.get("firstgid")),
        "columns": integer(tileset.attrib.get("columns")),
        "image": Path(image_source).name,
        "imageheight": integer(image.attrib.get("height")),
        "imagewidth": integer(image.attrib.get("width")),
        "margin": integer(tileset.attrib.get("margin")),
        "name": tileset.attrib["name"],
        "spacing": integer(tileset.attrib.get("spacing")),
        "tilecount": integer(tileset.attrib.get("tilecount")),
        "tileheight": integer(tileset.attrib.get("tileheight")),
        "tilewidth": integer(tileset.attrib.get("tilewidth")),
    }

    return result



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

def convert(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    map_root = ET.parse(source).getroot()
    width = integer(map_root.attrib.get("width"))
    height = integer(map_root.attrib.get("height"))
    expected_tiles = width * height

    layers: list[dict] = []
    for layer in map_root.findall("layer"):
        data = layer.find("data")
        if data is None or data.attrib.get("encoding") != "csv":
            raise ValueError(
                f"Layer {layer.attrib.get('name')} phải dùng encoding=csv."
            )

        layer_name = layer.attrib["name"]
        layers.append(
            {
                "data": parse_csv(data.text, expected_tiles, layer_name),
                "height": integer(layer.attrib.get("height"), height),
                "id": integer(layer.attrib.get("id")),
                "name": layer_name,
                "opacity": number(layer.attrib.get("opacity"), 1),
                "type": "tilelayer",
                "visible": layer.attrib.get("visible", "1") != "0",
                "width": integer(layer.attrib.get("width"), width),
                "x": integer(layer.attrib.get("x")),
                "y": integer(layer.attrib.get("y")),
            }
        )

    output_dir = destination.parent
    tilesets = [
        parse_tileset(reference, source.parent, output_dir)
        for reference in map_root.findall("tileset")
    ]

    result = {
        "compressionlevel": -1,
        "height": height,
        "infinite": map_root.attrib.get("infinite", "0") == "1",
        "layers": layers,
        "nextlayerid": integer(map_root.attrib.get("nextlayerid")),
        "nextobjectid": integer(map_root.attrib.get("nextobjectid")),
        "orientation": map_root.attrib.get("orientation", "isometric"),
        "renderorder": map_root.attrib.get("renderorder", "right-down"),
        "tiledversion": map_root.attrib.get("tiledversion", "1.4.3"),
        "tileheight": integer(map_root.attrib.get("tileheight")),
        "tilesets": tilesets,
        "tilewidth": integer(map_root.attrib.get("tilewidth")),
        "type": "map",
        "version": number(map_root.attrib.get("version"), 1.4),
        "width": width,
    }

    destination.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )



def copy_runtime_assets(project_root: Path, public_root: Path) -> None:
    copies = {
        project_root / "assets/resources/config/mapRes_0.json":
            public_root / "world/mapRes_0.json",
        project_root / "assets/texure/ui/tipsbiaoti.png":
            public_root / "ui/auth/title-ribbon.png",
        project_root / "assets/texure/ui/btn/btn_pw_green.png":
            public_root / "ui/auth/create.png",
        project_root / "assets/texure/ui/diban1_23.png":
            public_root / "ui/auth/panel.png",
        project_root / "assets/texure/ui/cr_btn_roll.png":
            public_root / "ui/auth/random.png",
        project_root / "assets/texure/ui/pet_hx_select_1.png":
            public_root / "ui/auth/choice.png",
        project_root / "assets/texure/ui/pet_hx_select_2.png":
            public_root / "ui/auth/choice-selected.png",
        project_root / "assets/texure/ui/bg_vipshop_top.png":
            public_root / "ui/map-hud/top.png",
        project_root / "assets/texure/ui/btn/cr_btn_back.png":
            public_root / "ui/map-hud/back.png",
        project_root / "assets/texure/ui/bg_team_item4.png":
            public_root / "ui/map-hud/resource-cell.png",
        project_root / "assets/texure/ui/btn/btn_pw_green.png":
            public_root / "ui/map-hud/button-green.png",
        project_root / "assets/texure/ui/btn/btn_pw_yellow.png":
            public_root / "ui/map-hud/tab-yellow.png",
        project_root / "assets/texure/ui/btn/btn_pw_red.png":
            public_root / "ui/map-hud/tab-red.png",
        project_root / "assets/texure/ui/img_gem_21.png":
            public_root / "ui/map-hud/notice.png",
        project_root / "assets/texure/bg/bg.jpg":
            public_root / "ui/general/background.jpg",
        project_root / "assets/texure/ui/btn/btn_close.png":
            public_root / "ui/general/close.png",
        project_root / "assets/texure/ui/btn/btn_pw_green.png":
            public_root / "ui/general/button-green.png",
        project_root / "assets/texure/ui/card_bg.png":
            public_root / "ui/general/card-bg.png",
        project_root / "assets/resources/generalpic/head_wrap.png":
            public_root / "ui/general/head-wrap.png",
        project_root / "assets/texure/ui/img_star.png":
            public_root / "ui/general/star.png",
        project_root / "assets/texure/ui/img_shiyongz.png":
            public_root / "ui/general/used.png",
        project_root / "assets/texure/ui/actport_xfqp__box_select.png":
            public_root / "ui/general/selected.png",
        project_root / "assets/texure/ui/btn/btn_pw_red.png":
            public_root / "ui/general/button-red.png",
        project_root / "assets/texure/ui/btn/btn_pw_yellow.png":
            public_root / "ui/general/button-yellow.png",
        project_root / "assets/texure/ui/bg_team_item4.png":
            public_root / "ui/general/attribute-row.png",
        project_root / "assets/texure/ui/btn/btn_old_jia_edd.png":
            public_root / "ui/general/plus.png",
        project_root / "assets/texure/ui/btn/btn_old_jian.png":
            public_root / "ui/general/minus.png",
        project_root / "assets/texure/ui/bg_vipshop_top.png":
            public_root / "ui/general/scroll-panel.png",
        project_root / "assets/texure/ui/facility_wrap.png":
            public_root / "ui/general/skill-wrap.png",
        project_root / "assets/texure/ui/diban1_23.png":
            public_root / "ui/general/detail-panel.png",
        project_root / "assets/texure/ui/card_110500.png":
            public_root / "ui/general/draw-card.png",
        project_root / "assets/texure/ui/skill/tactics_1.png":
            public_root / "ui/general/skill-1.png",
        project_root / "assets/texure/ui/skill/tactics_2.png":
            public_root / "ui/general/skill-2.png",
        project_root / "assets/texure/ui/skill/tactics_3.png":
            public_root / "ui/general/skill-3.png",
        project_root / "assets/texure/ui/skill/tactics_4.png":
            public_root / "ui/general/skill-4.png",
        project_root / "assets/texure/bg/war_bg.png":
            public_root / "ui/war/background.png",
        project_root / "assets/texure/ui/bg_1.png":
            public_root / "ui/army/background.png",
        project_root / "assets/texure/ui/icon_cross.png":
            public_root / "ui/army/close.png",
        project_root / "assets/resources/config/basic.json":
            public_root / "config/basic.json",
        project_root / "assets/resources/config/json/general/general.json":
            public_root / "config/general/general.json",
        project_root / "assets/resources/config/json/general/general_basic.json":
            public_root / "config/general/general_basic.json",
        project_root / "assets/resources/config/json/skill/skill_outline.json":
            public_root / "config/skill/skill-outline.json",
        project_root / "assets/resources/config/json/skill/zhudong/tuji.json":
            public_root / "config/skill/active.json",
        project_root / "assets/resources/config/json/skill/beidong/baizhanjingbing.json":
            public_root / "config/skill/passive.json",
        project_root / "assets/resources/config/json/skill/zuiji/zhongzhan.json":
            public_root / "config/skill/pursuit.json",
        project_root / "assets/resources/config/json/skill/zhihui/fengshi.json":
            public_root / "config/skill/command.json",
    }

    for source, destination in copies.items():
        if not source.is_file():
            raise FileNotFoundError(f"Thiếu asset Cocos: {source}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)

    cards_source = project_root / "assets/resources/generalpic"
    cards_output = public_root / "general/cards"
    cards_output.mkdir(parents=True, exist_ok=True)
    for source in cards_source.glob("card_*.png"):
        shutil.copy2(source, cards_output / source.name)

    world_source = project_root / "assets/resources/world"
    atlas_output = public_root / "world/atlases"
    for atlas_name in ("map_tiles", "map_res"):
        convert_plist_atlas(
            world_source / f"{atlas_name}.plist",
            world_source / f"{atlas_name}.png",
            atlas_output / f"{atlas_name}.json",
            atlas_output / f"{atlas_name}.png",
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path(__file__).resolve().parents[2]
        / "assets/resources/world/map.tmx",
    )
    parser.add_argument(
        "--destination",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "public/game-assets/world/map.json",
    )
    args = parser.parse_args()
    source = args.source.resolve()
    destination = args.destination.resolve()
    project_root = Path(__file__).resolve().parents[2]
    public_root = Path(__file__).resolve().parents[1] / "public/game-assets"

    convert(source, destination)
    copy_runtime_assets(project_root, public_root)
    print(f"Đã chuẩn bị runtime assets: {public_root}")


if __name__ == "__main__":
    main()
