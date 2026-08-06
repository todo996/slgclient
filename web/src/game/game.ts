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

  return {
    game,
    destroy: () => game.destroy(true),
  };
}
