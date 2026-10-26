import { container } from 'tsyringe';

import { DevicePixelRatioService } from '../classes/services/DevicePixelRatioService';
import { KeyboardShortcutService } from '../classes/services/KeyboardShortcutService';
import { WindowService } from '../classes/services/WindowService';

export const setupUiCore = () => {
  container.registerInstance(WindowService, WindowService.getInstance());
  container.registerInstance(DevicePixelRatioService, DevicePixelRatioService.getInstance());
  container.registerInstance(KeyboardShortcutService, KeyboardShortcutService.getInstance());
};
