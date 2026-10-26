import 'reflect-metadata';
import { container } from 'tsyringe';

import { CONFIG_TOKEN } from '../../constants/config.constants';
import type { ConfigBase } from '../../models/config.models';

export class DependencyContainerUtil {
  public static registerConfig<TConfig extends ConfigBase>(config: TConfig): void {
    container.register(CONFIG_TOKEN, { useValue: config });
  }

  public static resolveConfig<TConfig extends ConfigBase = ConfigBase>(): TConfig {
    return container.resolve(CONFIG_TOKEN) as TConfig;
  }
}
