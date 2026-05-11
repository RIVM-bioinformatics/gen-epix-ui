import type { ConfigBase } from '../../../models/config';
import { HmrUtil } from '../../../utils/HmrUtil';

export class ConfigManager<TConfig extends ConfigBase = ConfigBase> {
  private static __instance: ConfigManager;

  public set config(config: TConfig) {
    this.__config = config;
  }


  public get config(): TConfig {
    if (!this.__config) {
      throw new Error('Config not set');
    }
    return this.__config;
  }

  private __config: TConfig;

  private constructor() {
    //
  }

  public static getInstance<TConfig extends ConfigBase = ConfigBase>(): ConfigManager<TConfig> {
    ConfigManager.__instance = HmrUtil.getHmrSingleton('configManager', ConfigManager.__instance, () => new ConfigManager<TConfig>());

    return ConfigManager.__instance as ConfigManager<TConfig>;
  }
}
