import Phaser from "phaser";

const GRID_SIZE = 96;
const GRID_COLUMNS = 30;
const GRID_ROWS = 30;

export class MapScene extends Phaser.Scene {
  private dragPointerId: number | null = null;
  private lastPointerPosition = new Phaser.Math.Vector2();

  constructor() {
    super("MapScene");
  }

  create(): void {
    this.drawFoundationGrid();
    this.configureCamera();
    this.configureInput();
  }

  private drawFoundationGrid(): void {
    const graphics = this.add.graphics();
    const width = GRID_COLUMNS * GRID_SIZE;
    const height = GRID_ROWS * GRID_SIZE;

    graphics.fillStyle(0x2f3b27, 1);
    graphics.fillRect(0, 0, width, height);

    graphics.lineStyle(1, 0xb8995e, 0.24);

    for (let column = 0; column <= GRID_COLUMNS; column += 1) {
      const x = column * GRID_SIZE;
      graphics.lineBetween(x, 0, x, height);
    }

    for (let row = 0; row <= GRID_ROWS; row += 1) {
      const y = row * GRID_SIZE;
      graphics.lineBetween(0, y, width, y);
    }

    this.add
      .text(72, 72, "Nền tảng bản đồ web\nSẵn sàng nhận dữ liệu map Cocos", {
        color: "#f1e5c8",
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        lineSpacing: 10,
        padding: { x: 18, y: 14 },
        backgroundColor: "rgba(23, 23, 19, 0.78)",
      })
      .setDepth(10);
  }

  private configureCamera(): void {
    const width = GRID_COLUMNS * GRID_SIZE;
    const height = GRID_ROWS * GRID_SIZE;
    const camera = this.cameras.main;

    camera.setBounds(0, 0, width, height);
    camera.centerOn(width / 2, height / 2);
    camera.setZoom(0.8);
  }

  private configureInput(): void {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (this.dragPointerId !== null) return;

        this.dragPointerId = pointer.id;
        this.lastPointerPosition.set(pointer.x, pointer.y);
      },
    );

    this.input.on(
      Phaser.Input.Events.POINTER_MOVE,
      (pointer: Phaser.Input.Pointer) => {
        if (
          this.dragPointerId !== pointer.id ||
          !pointer.isDown
        ) {
          return;
        }

        const camera = this.cameras.main;
        const deltaX = pointer.x - this.lastPointerPosition.x;
        const deltaY = pointer.y - this.lastPointerPosition.y;

        camera.scrollX -= deltaX / camera.zoom;
        camera.scrollY -= deltaY / camera.zoom;
        this.lastPointerPosition.set(pointer.x, pointer.y);
      },
    );

    this.input.on(
      Phaser.Input.Events.POINTER_UP,
      (pointer: Phaser.Input.Pointer) => {
        if (this.dragPointerId === pointer.id) {
          this.dragPointerId = null;
        }
      },
    );

    this.input.on(
      Phaser.Input.Events.POINTER_UP_OUTSIDE,
      (pointer: Phaser.Input.Pointer) => {
        if (this.dragPointerId === pointer.id) {
          this.dragPointerId = null;
        }
      },
    );

    this.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        const camera = this.cameras.main;
        const nextZoom = Phaser.Math.Clamp(
          camera.zoom - deltaY * 0.001,
          0.45,
          1.6,
        );

        camera.setZoom(nextZoom);
      },
    );
  }
}
