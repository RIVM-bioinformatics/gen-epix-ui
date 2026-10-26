import 'reflect-metadata';
import { container } from 'tsyringe';
import type { DependencyContainer } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { QueryClientService } from '../../classes/services/QueryClientService';
import {
  CONFIG_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../../constants/config.constants';
import type { ConfigBase } from '../../models/config.models';

export class DependencyContainerUtil {
  public static initializeContainer(): DependencyContainer {
    container.registerInstance(WINDOW_SERVICE_TOKEN, WindowService.getInstance());
    container.register(QueryClientService, {
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      useFactory: () => new QueryClientService({
        config: container.resolve(CONFIG_TOKEN),
        queryKeyDependencies: [],
      }),
    });
    return container;
  }

  public static registerConfig<TConfig extends ConfigBase>(config: TConfig): void {
    container.register(CONFIG_TOKEN, { useValue: config });
  }

  public static resolveConfig<TConfig extends ConfigBase = ConfigBase>(): TConfig {
    return container.resolve(CONFIG_TOKEN) as TConfig;
  }
}
