import 'reflect-metadata';
import { container as rootContainer } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { QueryClientService } from '../../services/QueryClientService';
import {
  CONFIG_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../../../constants/config.constants';
import type { ConfigBase } from '../../../models/config.models';

export type UiClientCommonContainer = DependencyContainer;

export const createUiClientCommonContainer = <TConfig extends ConfigBase>(config: TConfig): UiClientCommonContainer => {
  const container = rootContainer;
  container.register(CONFIG_TOKEN, { useValue: config });
  container.registerInstance(WINDOW_SERVICE_TOKEN, WindowService.getInstance());
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
