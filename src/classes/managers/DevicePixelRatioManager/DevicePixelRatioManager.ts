import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowManager } from '../WindowManager';

export class DevicePixelRatioManager extends SubscribableAbstract<number> {
  private static __instance: DevicePixelRatioManager;

  public static get instance(): DevicePixelRatioManager {
    DevicePixelRatioManager.__instance = DevicePixelRatioManager.__instance || new DevicePixelRatioManager();
    return DevicePixelRatioManager.__instance;
  }

  private constructor() {
    super(new Subject(WindowManager.instance.window.devicePixelRatio));
    const attachEventListener = () => {
      const window = WindowManager.instance.window;
      const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      const onDevicePixelRatioChange = () => {
        console.log('DevicePixelRatioManager: Device pixel ratio changed', window.devicePixelRatio);
        this.subject.next(window.devicePixelRatio);
        media.removeEventListener('change', onDevicePixelRatioChange);
        attachEventListener();
      };
      media.addEventListener('change', onDevicePixelRatioChange);
    };
    attachEventListener();
  }
}
