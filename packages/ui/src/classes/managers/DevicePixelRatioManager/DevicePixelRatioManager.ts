import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { HmrUtil } from '../../../utils/HmrUtil';
import { WindowManager } from '../WindowManager';

export class DevicePixelRatioManager extends SubscribableAbstract<number> {
  private static __instance: DevicePixelRatioManager;

  private constructor() {
    super(new Subject(WindowManager.getInstance().window.devicePixelRatio));
    const attachEventListener = () => {
      const window = WindowManager.getInstance().window;
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

  public static getInstance(): DevicePixelRatioManager {
    DevicePixelRatioManager.__instance = HmrUtil.getHmrSingleton('devicePixelRatioManager', DevicePixelRatioManager.__instance, () => new DevicePixelRatioManager());
    return DevicePixelRatioManager.__instance;
  }
}
