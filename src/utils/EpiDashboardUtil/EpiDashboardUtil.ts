import intersection from 'lodash/intersection';

import { ConfigManager } from '../../classes/managers/ConfigManager';
import type {
  EpiDashboardLayoutUserConfig,
  EpiDashboardLayoutConfig,
  EpiDashboardLayout,
} from '../../models/epi';
import { EPI_ZONE } from '../../models/epi';


export class EpiDashboardUtil {
  public static readonly dashboardLayoutStorageKey = 'GENEPIX-EpiDashboard-Layout-v1.3';

  public static isSingleWidget(userConfig: EpiDashboardLayoutUserConfig, zone: EPI_ZONE): boolean {
    const enabledZones = EpiDashboardUtil.getEnabledZones(userConfig);
    return enabledZones.length === 1 && enabledZones[0] === zone;
  }

  public static getEnabledZones(userConfig: EpiDashboardLayoutUserConfig): EPI_ZONE[] {
    return Object.entries(userConfig.zones).filter(([_name, value]) => value).map(([name]) => name) as EPI_ZONE[];
  }

  public static getDashboardLayoutConfig(userConfig: EpiDashboardLayoutUserConfig): EpiDashboardLayoutConfig {
    const enabledZones = EpiDashboardUtil.getEnabledZones(userConfig);
    return ConfigManager.instance.config.epiDashboard.LAYOUTS.find(epiDashboardLayout => epiDashboardLayout.zones.length === enabledZones.length && intersection(enabledZones, epiDashboardLayout.zones).length === enabledZones.length);
  }

  public static getDashboardLayout(userConfig: EpiDashboardLayoutUserConfig): EpiDashboardLayout {
    const layoutConfig = EpiDashboardUtil.getDashboardLayoutConfig(userConfig);

    return layoutConfig?.layouts?.[userConfig.arrangement] ?? layoutConfig?.layouts?.[0];
  }

  public static createDashboardLayoutUserConfigInitialState(): EpiDashboardLayoutUserConfig {
    return {
      arrangement: 0,
      zones: {
        [EPI_ZONE.EPI_CURVE]: true,
        [EPI_ZONE.LINE_LIST]: true,
        [EPI_ZONE.MAP]: true,
        [EPI_ZONE.TREE]: true,
      },
    };
  }
}
