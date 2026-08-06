export type TimerId = number;

export class TimerAdapter {
  private readonly timers = new Set<TimerId>();

  schedule(callback: () => void, intervalMs: number): TimerId {
    const timerId = window.setInterval(callback, intervalMs);
    this.timers.add(timerId);
    return timerId;
  }

  scheduleOnce(callback: () => void, delayMs: number): TimerId {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delayMs);

    this.timers.add(timerId);
    return timerId;
  }

  clear(timerId: TimerId): void {
    window.clearInterval(timerId);
    window.clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  clearAll(): void {
    for (const timerId of this.timers) {
      window.clearInterval(timerId);
      window.clearTimeout(timerId);
    }

    this.timers.clear();
  }
}
