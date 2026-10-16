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
  public static createContainer<TConfig extends ConfigBase>(config: TConfig): DependencyContainer {
    container.register(CONFIG_TOKEN, { useValue: config });
    container.registerInstance(WINDOW_SERVICE_TOKEN, WindowService.getInstance());
    container.register(QueryClientService, {
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      useFactory: () => new QueryClientService({
        config,
        queryKeyDependencies: [],
      }),
    });
    return container;
  }

  public static resolveConfig<TConfig extends ConfigBase = ConfigBase>(dependencyContainer: DependencyContainer = container): TConfig {
    return dependencyContainer.resolve(CONFIG_TOKEN) as TConfig;
  }
}
