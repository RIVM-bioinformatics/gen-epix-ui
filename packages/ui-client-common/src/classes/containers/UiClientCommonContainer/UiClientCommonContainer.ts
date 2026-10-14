import 'reflect-metadata';
import { container as rootContainer } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe';

import { EmotionCacheService } from '../../services/EmotionCacheService';
import { InactivityService } from '../../services/InactivityService';
import { LogService } from '../../services/LogService';
import { NotificationService } from '../../services/NotificationService';
import { PageEventBusService } from '../../services/PageEventBusService';
import { QueryClientService } from '../../services/QueryClientService';
import { CONFIG_TOKEN } from '../../../constants/config';
import type { ConfigBase } from '../../../models/config';

export type UiClientCommonContainer = DependencyContainer;

export const createUiClientCommonContainer = <TConfig extends ConfigBase>(config: TConfig): UiClientCommonContainer => {
  const container = rootContainer;
  container.register(CONFIG_TOKEN, { useValue: config });
  container.registerSingleton(EmotionCacheService);
  container.registerSingleton(InactivityService);
  container.registerSingleton(LogService);
  container.registerSingleton(NotificationService);
  container.registerSingleton(PageEventBusService);
  container.register(QueryClientService, {
    // tsyringe uses this option name; it is not a React hook.
    // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
    useFactory: () => new QueryClientService({
      config,
      queryKeyDependencies: [],
    }),
  });
  return container;
};

export const resolveConfig = <TConfig extends ConfigBase = ConfigBase>(container: UiClientCommonContainer = rootContainer): TConfig => {
  return container.resolve(CONFIG_TOKEN) as TConfig;
};
