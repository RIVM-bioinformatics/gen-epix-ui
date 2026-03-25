import { StringUtil } from '../../../utils/StringUtil';

type ListenerCallback = ((payload: unknown) => void);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export abstract class EventBusAbstract<T extends {}> {
  private readonly listeners: Partial<Record<keyof T, Map<string, ListenerCallback>>> = {};

  public addEventListener<TEventName extends keyof T>(eventName: TEventName, callback: (payload: T[TEventName]) => void): () => void {
    const id = StringUtil.createUuid();

    this.listeners[eventName] = this.listeners[eventName] || new Map();
    this.listeners[eventName].set(id, callback as ListenerCallback);

    return () => {
      if (!this.listeners[eventName]) {
        return;
      }
      this.listeners[eventName].delete(id);
    };
  }

  public emit<TEventName extends keyof T>(eventName: TEventName, payload?: T[TEventName]): void {
    this.listeners[eventName]?.forEach((callback) => callback(payload));
  }

  public destroy(): void {
    // clean up all listeners
    Object.keys(this.listeners).forEach((eventName) => {
      try {
        delete this.listeners[eventName as keyof T];
      } catch {
        // ignore
      }
    });
  }
}
