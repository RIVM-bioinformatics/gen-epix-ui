import { setupYup } from '@gen-epix/ui-core-form/setup/setup';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { DevicePixelRatioService } from '@gen-epix/ui-core/classes/services/DevicePixelRatioService';
import { KeyboardShortcutService } from '@gen-epix/ui-core/classes/services/KeyboardShortcutService';

import {
  DEVICE_PIXEL_RATIO_SERVICE_TOKEN,
  KEYBOARD_SHORTCUT_SERVICE_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../constants/api.constants';

export const setupClientCommon = () => {
  container.registerInstance(WINDOW_SERVICE_TOKEN, WindowService.getInstance());
  container.registerInstance(DEVICE_PIXEL_RATIO_SERVICE_TOKEN, DevicePixelRatioService.getInstance());
  container.registerInstance(KEYBOARD_SHORTCUT_SERVICE_TOKEN, KeyboardShortcutService.getInstance());

  setupYup();
};
