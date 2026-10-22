import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { EventBusAbstract } from './EventBusAbstract';

type TestEvents = {
  message: string;
  reset: void;
};

class TestEventBus extends EventBusAbstract<TestEvents> { }

describe('EventBusAbstract', () => {
  it('emits payloads to registered listeners and supports unsubscribe', () => {
    const eventBus = new TestEventBus();
    const callback = vi.fn<(payload: string) => void>();

    const unsubscribe = eventBus.addEventListener('message', callback);
    eventBus.emit('message', 'hello');

    expect(callback).toHaveBeenCalledWith('hello');

    unsubscribe();
    eventBus.emit('message', 'ignored');

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('removes only the matching callback and ignores missing listeners', () => {
    const eventBus = new TestEventBus();
    const retainedCallback = vi.fn<(payload: string) => void>();
    const removedCallback = vi.fn<(payload: string) => void>();
    const unmatchedCallback = vi.fn<(payload: string) => void>();

    eventBus.addEventListener('message', retainedCallback);
    eventBus.addEventListener('message', removedCallback);
    eventBus.removeEventListener('message', unmatchedCallback);
    eventBus.removeEventListener('message', removedCallback);
    eventBus.removeEventListener('reset', vi.fn<(payload: void) => void>());
    eventBus.emit('message', 'hello');
    eventBus.emit('reset');

    expect(retainedCallback).toHaveBeenCalledWith('hello');
    expect(removedCallback).not.toHaveBeenCalled();
  });

  it('forwards an undefined payload when an event payload is omitted', () => {
    const eventBus = new TestEventBus();
    const callback = vi.fn<(payload: void) => void>();

    eventBus.addEventListener('reset', callback);
    eventBus.emit('reset');

    expect(callback).toHaveBeenCalledWith(undefined);
  });

  it('destroys all listeners and makes existing unsubscribe callbacks safe', () => {
    const eventBus = new TestEventBus();
    const messageCallback = vi.fn<(payload: string) => void>();
    const resetCallback = vi.fn<(payload: void) => void>();

    const unsubscribe = eventBus.addEventListener('message', messageCallback);
    eventBus.addEventListener('reset', resetCallback);
    eventBus.destroy();
    eventBus.emit('message', 'ignored');
    eventBus.emit('reset');
    unsubscribe();

    expect(messageCallback).not.toHaveBeenCalled();
    expect(resetCallback).not.toHaveBeenCalled();
  });
});
