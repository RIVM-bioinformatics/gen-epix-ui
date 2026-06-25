import { ConfigManager } from '@gen-epix/ui';

import type {
  EpiDashboardArrangement,
  EpiDashboardArrangementConfig,
} from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';


export class DashboardUtil {
  public static readonly dashboardLayoutStorageKey = 'GENEPIX-EpiDashboard-Layout-v1.3';

  public static createDashboardArrangementConfigInitialState(): EpiDashboardArrangementConfig {
    const arrangementOptions = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS;
    const defaultArrangementKey = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_ARRANGEMENT_KEY;

    return {
      arrangement: arrangementOptions[defaultArrangementKey],
      arrangementWidgetAssignments: {},
    };
  }

  public static getArrangementWidgetAssignments(arrangement: EpiDashboardArrangement, arrangementWidgetAssignments?: { [key: string]: string }): { [key: string]: string } {
    // traverse the arrangement and create an object with all zones set to empty string
    const emptyAssignments: { [key: string]: string } = {};
    const traverseArrangement = (arr: EpiDashboardArrangement) => {
      arr.forEach((item) => {
        if (Array.isArray(item)) {
          traverseArrangement(item);
        } else {
          emptyAssignments[item] = arrangementWidgetAssignments?.[item] || null;
        }
      });
    };
    traverseArrangement(arrangement);
    return emptyAssignments;
  }

  public static isSingleWidget(arrangementConfig: EpiDashboardArrangementConfig, widgetName: string): boolean {
    return arrangementConfig.arrangementWidgetAssignments?.[widgetName] && Object.keys(arrangementConfig.arrangementWidgetAssignments).length === 1;
  }
}
