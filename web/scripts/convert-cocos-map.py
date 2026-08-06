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
    }

    for source, destination in copies.items():
        if not source.is_file():
            raise FileNotFoundError(f"Thiếu asset Cocos: {source}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


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
