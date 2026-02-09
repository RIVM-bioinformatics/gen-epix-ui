import type { UserManager } from 'oidc-client-ts';

import type { RouterManager } from '../classes/managers/RouterManager';
import type { AuthenticationManager } from '../classes/managers/AuthenticationManager';
import type { AuthorizationManager } from '../classes/managers/AuthorizationManager';
import type { BackendVersionManager } from '../classes/managers/BackendVersionManager';
import type { BreadcrumbManager } from '../classes/managers/BreadcrumbManager';
import type { ConfigManager } from '../classes/managers/ConfigManager';
import type { DevicePixelRatioManager } from '../classes/managers/DevicePixelRatioManager';
import type { EmotionCacheManager } from '../classes/managers/EmotionCacheManager';
import type { EpiDataManager } from '../classes/managers/EpiDataManager';
import type { EpiEventBusManager } from '../classes/managers/EpiEventBusManager';
import type { EpiLineListCaseSetMembersManager } from '../classes/managers/EpiLineListCaseSetMembersManager';
import type { EpiHighlightingManager } from '../classes/managers/EpiHighlightingManager';
import type { InactivityManager } from '../classes/managers/InactivityManager';
import type { KeyboardShortcutManager } from '../classes/managers/KeyboardShortcutManager';
import type { LogManager } from '../classes/managers/LogManager';
import type { NavigationHistoryManager } from '../classes/managers/NavigationHistoryManager';
import type { NotificationManager } from '../classes/managers/NotificationManager';
import type { PageEventBusManager } from '../classes/managers/PageEventBusManager';
import type { QueryClientManager } from '../classes/managers/QueryClientManager';
import type { UserSettingsManager } from '../classes/managers/UserSettingsManager';
import type { I18nManager } from '../classes/managers/I18nManager';

declare global {
  interface Window {
    userManager: UserManager;
    managers: {
      route?: RouterManager;
      authentication?: AuthenticationManager;
      authorization?: AuthorizationManager;
      backendVersion?: BackendVersionManager;
      breadcrumb?: BreadcrumbManager;
      config?: ConfigManager;
      devicePixelRatio?: DevicePixelRatioManager;
      emotionCache?: EmotionCacheManager;
      epiData?: EpiDataManager;
      epiEventBus?: EpiEventBusManager;
      epiLineListCaseSetMembers?: EpiLineListCaseSetMembersManager;
      epiHighlighting?: EpiHighlightingManager;
      inactivity?: InactivityManager;
      keyboardShortcut?: KeyboardShortcutManager;
      log?: LogManager;
      navigationHistory?: NavigationHistoryManager;
      notification?: NotificationManager;
      pageEventBus?: PageEventBusManager;
      queryClient?: QueryClientManager;
      userSettings?: UserSettingsManager;
      i18n?: I18nManager;
    };
  }
}
