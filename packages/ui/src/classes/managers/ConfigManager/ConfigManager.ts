import type { ConfigBase } from '../../../models/config';
import { WindowManager } from '../WindowManager';

export class ConfigManager<TConfig extends ConfigBase = ConfigBase> {
  public set config(config: TConfig) {
    if (this.__config) {
      throw new Error('Config already set');
    }
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
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.config = WindowManager.instance.window.managers.config || new ConfigManager<TConfig>();
    return WindowManager.instance.window.managers.config as ConfigManager<TConfig>;
  }
}
