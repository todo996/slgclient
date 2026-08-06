export class UIManager {
  private readonly stack: HTMLElement[] = [];

  constructor(private readonly root: HTMLElement) {}

  open(panel: HTMLElement): void {
    if (this.stack.includes(panel)) return;

    this.stack.push(panel);
    this.root.appendChild(panel);
  }

  close(panel: HTMLElement): void {
    const index = this.stack.lastIndexOf(panel);

    if (index >= 0) {
      this.stack.splice(index, 1);
    }

    panel.remove();
  }

  closeTop(): void {
    this.stack.pop()?.remove();
  }

  closeAll(): void {
    for (const panel of this.stack) {
      panel.remove();
    }

    this.stack.length = 0;
  }
}
