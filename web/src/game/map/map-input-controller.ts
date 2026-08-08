import Phaser from "phaser";

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1.6;
const CLICK_MOVE_TOLERANCE = 10;

export class MapInputController {
  private dragPointerId: number | null = null;
  private dragDistance = 0;
  private readonly lastPointerPosition = new Phaser.Math.Vector2();
  private pinchDistance = 0;
  private pinchZoom = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onSelect: (worldX: number, worldY: number) => void,
  ) {}

  enable(): void {
    const input = this.scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    input.on(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel, this);

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.disable, this);
  }

  disable(): void {
    const input = this.scene.input;
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    input.off(Phaser.Input.Events.POINTER_WHEEL, this.onPointerWheel, this);
  }

  private readonly onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    const activePointers = this.getActivePointers();
    if (activePointers.length >= 2) {
      this.startPinch(activePointers[0], activePointers[1]);
      this.dragPointerId = null;
      return;
    }

    if (this.dragPointerId !== null) return;
    this.dragPointerId = pointer.id;
    this.dragDistance = 0;
    this.lastPointerPosition.set(pointer.x, pointer.y);
  };

  private readonly onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    const activePointers = this.getActivePointers();
    if (activePointers.length >= 2) {
      this.updatePinch(activePointers[0], activePointers[1]);
      return;
    }

    this.pinchDistance = 0;
    if (this.dragPointerId !== pointer.id || !pointer.isDown) return;

    const camera = this.scene.cameras.main;
    const deltaX = pointer.x - this.lastPointerPosition.x;
    const deltaY = pointer.y - this.lastPointerPosition.y;
    this.dragDistance += Math.hypot(deltaX, deltaY);
    camera.scrollX -= deltaX / camera.zoom;
    camera.scrollY -= deltaY / camera.zoom;
    this.lastPointerPosition.set(pointer.x, pointer.y);
  };

  private readonly onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (
      this.dragPointerId === pointer.id &&
      this.dragDistance <= CLICK_MOVE_TOLERANCE
    ) {
      this.onSelect(pointer.worldX, pointer.worldY);
    }

    if (this.dragPointerId === pointer.id) this.dragPointerId = null;
    if (this.getActivePointers().length < 2) this.pinchDistance = 0;
  };

  private readonly onPointerWheel = (
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    const camera = this.scene.cameras.main;
    camera.setZoom(
      Phaser.Math.Clamp(camera.zoom - deltaY * 0.001, MIN_ZOOM, MAX_ZOOM),
    );
  };

  private getActivePointers(): Phaser.Input.Pointer[] {
    return this.scene.input.manager.pointers.filter((pointer) => pointer.isDown);
  }

  private startPinch(
    first: Phaser.Input.Pointer,
    second: Phaser.Input.Pointer,
  ): void {
    this.pinchDistance = Phaser.Math.Distance.Between(
      first.x,
      first.y,
      second.x,
      second.y,
    );
    this.pinchZoom = this.scene.cameras.main.zoom;
  }

  private updatePinch(
    first: Phaser.Input.Pointer,
    second: Phaser.Input.Pointer,
  ): void {
    const distance = Phaser.Math.Distance.Between(
      first.x,
      first.y,
      second.x,
      second.y,
    );

    if (this.pinchDistance <= 0) {
      this.startPinch(first, second);
      return;
    }

    this.scene.cameras.main.setZoom(
      Phaser.Math.Clamp(
        this.pinchZoom * (distance / this.pinchDistance),
        MIN_ZOOM,
        MAX_ZOOM,
      ),
    );
  }
}
