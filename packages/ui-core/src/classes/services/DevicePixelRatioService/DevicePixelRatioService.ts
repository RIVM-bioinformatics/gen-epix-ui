import {
  container,
  singleton,
} from 'tsyringe';

import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowService } from '../WindowService';

@singleton()
export class DevicePixelRatioService extends SubscribableAbstract<number> {
  public constructor() {
    super(new Subject(WindowService.getInstance().window.devicePixelRatio));
    const attachEventListener = () => {
      const window = WindowService.getInstance().window;
      if (typeof window.matchMedia !== 'function') {
        return;
      }
      const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const onDevicePixelRatioChange = () => {
        this.subject.next(window.devicePixelRatio);
        media.removeEventListener('change', onDevicePixelRatioChange);
        attachEventListener();
      };
      media.addEventListener('change', onDevicePixelRatioChange);
    };
    attachEventListener();
  }

  public static getInstance(): DevicePixelRatioService {
    if (!container.isRegistered(DevicePixelRatioService)) {
      container.registerSingleton(DevicePixelRatioService);
    }
    return container.resolve(DevicePixelRatioService);
  }
}
