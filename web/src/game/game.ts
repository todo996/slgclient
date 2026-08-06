import Phaser from "phaser";
import { BootScene } from "./scenes/boot-scene";
import { MapScene } from "./scenes/map-scene";

export type CreateGameOptions = Readonly<{
  parent: string;
}>;

export type GameRuntime = Readonly<{
  game: Phaser.Game;
  destroy: () => void;
}>;

export function createGame(options: CreateGameOptions): GameRuntime {
  const parent = document.getElementById(options.parent);
  if (!parent) {
    throw new Error(`Không tìm thấy phần tử game #${options.parent}`);
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    backgroundColor: "#171713",
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    input: {
      activePointers: 3,
      touch: {
        capture: true,
      },
    },
    scene: [BootScene, MapScene],
  });

  let resizeFrame = 0;
  const syncViewport = (): void => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      const width = Math.max(1, Math.round(parent.clientWidth));
      const height = Math.max(1, Math.round(parent.clientHeight));
      if (game.scale.width !== width || game.scale.height !== height) {
        game.scale.resize(width, height);
      }
    });
  };

  const resizeObserver = new ResizeObserver(syncViewport);
  resizeObserver.observe(parent);
  window.visualViewport?.addEventListener("resize", syncViewport);
  window.addEventListener("orientationchange", syncViewport);
  syncViewport();

  return {
    game,
    destroy: () => {
      resizeObserver.disconnect();
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
      window.cancelAnimationFrame(resizeFrame);
      game.destroy(true);
    },
  };
}
