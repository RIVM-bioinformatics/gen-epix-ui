import type { ConfigBase } from '../../../models/config';
import { HmrUtil } from '../../../utils/HmrUtil';

export class ConfigService<TConfig extends ConfigBase = ConfigBase> {
  private static __instance: ConfigService;

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

  public static getInstance<TConfig extends ConfigBase = ConfigBase>(): ConfigService<TConfig> {
    ConfigService.__instance = HmrUtil.getHmrSingleton('configService', ConfigService.__instance, () => new ConfigService<TConfig>());

    return ConfigService.__instance as ConfigService<TConfig>;
  }
}
