import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { EventBusService } from './EventBusService';

describe('EventBusService', () => {
  it('dispatches and unsubscribes a Case DB event', () => {
    const service = new EventBusService();
    const listener = vi.fn();
    const removeListener = service.addEventListener('openFiltersMenu', listener);

    service.emit('openFiltersMenu');
    expect(listener).toHaveBeenCalledExactlyOnceWith(undefined);

    removeListener();
    service.emit('openFiltersMenu');
    expect(listener).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it('removes all listeners when destroyed', () => {
    const service = new EventBusService();
    const listener = vi.fn();
    service.addEventListener('onLinkLineListAndTree', listener);

    service.destroy();
    service.emit('onLinkLineListAndTree');

    expect(listener).not.toHaveBeenCalled();
  });
});
