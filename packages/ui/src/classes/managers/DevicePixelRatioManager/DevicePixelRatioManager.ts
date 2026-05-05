import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { HmrUtil } from '../../../utils/HmrUtil';
import { WindowManager } from '../WindowManager';

export class DevicePixelRatioManager extends SubscribableAbstract<number> {
  public static get instance(): DevicePixelRatioManager {
    DevicePixelRatioManager.__instance = HmrUtil.getHmrSingleton('devicePixelRatioManager', DevicePixelRatioManager.__instance, () => new DevicePixelRatioManager());
    return DevicePixelRatioManager.__instance;
  }

  private static __instance: DevicePixelRatioManager;

  private constructor() {
    super(new Subject(WindowManager.instance.window.devicePixelRatio));
    const attachEventListener = () => {
      const window = WindowManager.instance.window;
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
}
