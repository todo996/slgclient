type EventMap = Record<string, readonly unknown[]>;
type EventHandler<Arguments extends readonly unknown[]> = (
  ...args: Arguments
) => void;

type Subscription<Arguments extends readonly unknown[]> = Readonly<{
  handler: EventHandler<Arguments>;
  target?: object;
}>;

export class EventBus<Events extends EventMap> {
  private readonly subscriptions = new Map<
    keyof Events,
    Subscription<Events[keyof Events]>[]
  >();

  on<Name extends keyof Events>(
    name: Name,
    handler: EventHandler<Events[Name]>,
    target?: object,
  ): () => void {
    const current = this.subscriptions.get(name) ?? [];
    current.push({
      handler: handler as EventHandler<Events[keyof Events]>,
      target,
    });
    this.subscriptions.set(name, current);

    return () => this.off(name, handler, target);
  }

  off<Name extends keyof Events>(
    name: Name,
    handler: EventHandler<Events[Name]>,
    target?: object,
  ): void {
    const current = this.subscriptions.get(name) ?? [];

    this.subscriptions.set(
      name,
      current.filter(
        (subscription) =>
          subscription.handler !== handler ||
          (target !== undefined && subscription.target !== target),
      ),
    );
  }

  emit<Name extends keyof Events>(
    name: Name,
    ...args: Events[Name]
  ): void {
    const current = this.subscriptions.get(name) ?? [];

    for (const subscription of [...current]) {
      Reflect.apply(subscription.handler, subscription.target, [...args]);
    }
  }

  targetOff(target: object): void {
    for (const [name, current] of this.subscriptions.entries()) {
      this.subscriptions.set(
        name,
        current.filter((subscription) => subscription.target !== target),
      );
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}
