import { SubscribableAbstract } from '../../abstracts/SubscribableAbstract';
import { Subject } from '../../Subject';
import { WindowManager } from '../WindowManager';

export class DevicePixelRatioManager extends SubscribableAbstract<number> {
  public static get instance(): DevicePixelRatioManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

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
