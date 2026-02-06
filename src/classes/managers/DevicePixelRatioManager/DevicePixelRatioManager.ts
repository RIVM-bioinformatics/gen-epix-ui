import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowManager } from '../WindowManager';

export class DevicePixelRatioManager extends SubscribableAbstract<number> {
  public static get instance(): DevicePixelRatioManager {
    WindowManager.instance.window.managers.devicePixelRatio = WindowManager.instance.window.managers.devicePixelRatio || new DevicePixelRatioManager();
    return WindowManager.instance.window.managers.devicePixelRatio;
  }

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
