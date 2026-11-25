import { vi } from 'vitest';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

// Chromium does not allow stubbing location.reload, so the window is wrapped: only location is replaced, everything else reaches the real global.
export const registerWindowServiceReloadSpy = () => {
  const reload = vi.fn();
  const realWindowService = container.resolve(WindowService);
  const realWindow = realWindowService.window;
  const fakeWindow = new Proxy(realWindow, {
    get: (target, property) => {
      if (property === 'location') {
        return { reload };
      }
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  });
  container.registerInstance(WindowService, Object.create(realWindowService, {
    window: { value: fakeWindow },
  }) as WindowService);
  return reload;
};
