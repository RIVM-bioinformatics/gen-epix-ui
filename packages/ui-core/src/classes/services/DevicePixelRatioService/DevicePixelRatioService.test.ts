import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { DevicePixelRatioService } from './DevicePixelRatioService';

describe('DevicePixelRatioService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the initial pixel ratio and reattaches the media listener after changes', () => {
    const listenerCallbacks: EventListener[] = [];
    const addEventListener = vi.fn((_event: string, callback: EventListener) => {
      listenerCallbacks.push(callback);
    });
    const removeEventListener = vi.fn();
    const media = {
      addEventListener,
      removeEventListener,
    } as unknown as MediaQueryList;
    const matchMedia = vi.fn(() => media);

    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal('matchMedia', matchMedia);

    const service = DevicePixelRatioService.getInstance();
    const callback = vi.fn();
    service.subscribe(callback);

    expect(service.data).toBe(1);
    expect(DevicePixelRatioService.getInstance()).toBe(service);
    expect(matchMedia).toHaveBeenNthCalledWith(1, '(resolution: 1dppx)');

    vi.stubGlobal('devicePixelRatio', 2);
    listenerCallbacks[0](new Event('change'));

    expect(callback).toHaveBeenCalledWith(2, 1);
    expect(removeEventListener).toHaveBeenCalledWith('change', listenerCallbacks[0]);
    expect(matchMedia).toHaveBeenNthCalledWith(2, '(resolution: 2dppx)');

    vi.stubGlobal('devicePixelRatio', 3);
    listenerCallbacks[1](new Event('change'));

    expect(service.data).toBe(3);
    expect(callback).toHaveBeenLastCalledWith(3, 2);
    expect(removeEventListener).toHaveBeenCalledWith('change', listenerCallbacks[1]);
  });

  it('exposes the initial pixel ratio when matchMedia is unavailable', async () => {
    vi.resetModules();
    vi.stubGlobal('matchMedia', undefined);

    const { DevicePixelRatioService: ServiceWithoutMatchMedia } = await import(
      /* webpackChunkName: "device-pixel-ratio-service-without-match-media" */
      './DevicePixelRatioService'
    );

    expect(ServiceWithoutMatchMedia.getInstance().data).toBe(window.devicePixelRatio);
  });
});
