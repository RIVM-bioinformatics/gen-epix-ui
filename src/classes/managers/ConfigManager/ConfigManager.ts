import type { Config } from '../../../models/config';

export class ConfigManager {
  private static __instance: ConfigManager;
  private __config: Config;

  public static get instance(): ConfigManager {
    ConfigManager.__instance = ConfigManager.__instance || new ConfigManager();
    return ConfigManager.__instance;
  }

  public set config(config: Config) {
    if (this.__config) {
      throw new Error('Config already set');
    }
    this.__config = config;
  }

  public get config(): Config {
    if (!this.__config) {
      throw new Error('Config not set');
    }
    return this.__config;
  }
}
