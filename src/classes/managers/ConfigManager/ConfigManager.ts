import type { Config } from '../../../models/config';
import { WindowManager } from '../WindowManager';

export class ConfigManager {
  private __config: Config;

  private constructor() {
    //
  }

  public static get instance(): ConfigManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.config = WindowManager.instance.window.managers.config || new ConfigManager();
    return WindowManager.instance.window.managers.config;
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
