type LegacyHandler = (...args: any[]) => void;

type EventSubscription = Readonly<{
  handler: LegacyHandler;
  target?: object;
}>;

class LegacyEventManager {
  private readonly events = new Map<string, EventSubscription[]>();
  private readonly targetNames = new Map<object, Set<string>>();

  on(name: string, handler: LegacyHandler, target?: object): void {
    const subscriptions = this.events.get(name) ?? [];

    if (
      subscriptions.some(
        (subscription) =>
          subscription.handler === handler &&
          subscription.target === target,
      )
    ) {
      return;
    }

    subscriptions.push({ handler, target });
    this.events.set(name, subscriptions);

    if (target) {
      const names = this.targetNames.get(target) ?? new Set<string>();
      names.add(name);
      this.targetNames.set(target, names);
    }
  }

  off(name: string, handler: LegacyHandler, target?: object): void {
    const subscriptions = this.events.get(name);
    if (!subscriptions) return;

    this.events.set(
      name,
      subscriptions.filter(
        (subscription) =>
          subscription.handler !== handler ||
          subscription.target !== target,
      ),
    );
  }

  emit(name: string, ...args: any[]): void {
    const subscriptions = this.events.get(name);
    if (!subscriptions) return;

    for (const subscription of [...subscriptions]) {
      Reflect.apply(
        subscription.handler,
        subscription.target,
        args,
      );
    }
  }

  targetOff(target: object): void {
    const names = this.targetNames.get(target);
    if (!names) return;

    for (const name of names) {
      const subscriptions = this.events.get(name) ?? [];
      this.events.set(
        name,
        subscriptions.filter(
          (subscription) => subscription.target !== target,
        ),
      );
    }

    this.targetNames.delete(target);
  }

  clear(): void {
    this.events.clear();
    this.targetNames.clear();
  }
}

export const EventMgr = new LegacyEventManager();
