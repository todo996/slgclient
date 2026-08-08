export type ViewportSize = Readonly<{ width: number; height: number }>;

/**
 * Giữ tỷ lệ nhìn gần với camera Cocos 1280x720, nhưng thu nhỏ thêm ở màn dọc
 * để thành 600px và vùng chiếm đóng 580px không che hết bản đồ.
 */
export function getMapZoom(viewport: ViewportSize): number {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  if (height > width) {
    return Math.min(0.42, Math.max(0.34, width / 1900));
  }
  return Math.min(0.68, Math.max(0.5, height / 720));
}

/**
 * Không được tắt culling cho 40.000 tile: một batch WebGL quá lớn có thể làm
 * Safari bỏ mất từng mảng tile. Padding 12 đủ bao quanh viewport isometric.
 */
export const MAP_TILE_CULL_PADDING = 12;

export const ROLE_CITY_PREFAB = Object.freeze({
  relationWidth: 580,
  relationHeight: 308,
  spriteWidth: 400,
  spriteHeight: 250,
  spriteScale: 1.5,
  spriteX: -5,
  spriteY: -25,
  labelY: -43.628,
});

export const ARMY_ARROW_PREFAB = Object.freeze({
  width: 20,
  minimumHeight: 36,
  alpha: 0.58,
});
