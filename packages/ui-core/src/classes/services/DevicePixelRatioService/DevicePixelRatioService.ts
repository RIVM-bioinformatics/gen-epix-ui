import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { HmrUtil } from '../../../utils/HmrUtil';
import { WindowService } from '../WindowService';

export class DevicePixelRatioService extends SubscribableAbstract<number> {
  private static __instance: DevicePixelRatioService;

  private constructor() {
    super(new Subject(WindowService.getInstance().window.devicePixelRatio));
    const attachEventListener = () => {
      const window = WindowService.getInstance().window;
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
    DevicePixelRatioService.__instance = HmrUtil.getHmrSingleton('devicePixelRatioService', DevicePixelRatioService.__instance, () => new DevicePixelRatioService());
    return DevicePixelRatioService.__instance;
  }
}
