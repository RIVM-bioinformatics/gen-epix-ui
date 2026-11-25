import { StringUtil } from '../../../utils/StringUtil';

type ListenerCallback = ((payload: unknown) => void);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export abstract class EventBusAbstract<T extends {}> {
  private readonly listeners = new Map<keyof T, Map<string, ListenerCallback>>();

  public addEventListener<TEventName extends keyof T>(eventName: TEventName, callback: (payload: T[TEventName]) => void): () => void {
    const id = StringUtil.createUuid();

    let listeners = this.listeners.get(eventName);
    if (!listeners) {
      listeners = new Map();
      this.listeners.set(eventName, listeners);
    }
    listeners.set(id, callback as ListenerCallback);

    return () => {
      this.listeners.get(eventName)?.delete(id);
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  public emit<TEventName extends keyof T>(eventName: TEventName, payload?: T[TEventName]): void {
    this.listeners.get(eventName)?.forEach((callback) => callback(payload));
  }

  public removeEventListener<TEventName extends keyof T>(eventName: TEventName, callback: (payload: T[TEventName]) => void): void {
    const listeners = this.listeners.get(eventName);
    if (!listeners) {
      return;
    }
    for (const [id, listener] of listeners.entries()) {
      if (listener === callback) {
        listeners.delete(id);
        break;
      }
    }
  }
}
