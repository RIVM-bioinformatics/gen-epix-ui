import { ConfigManager } from '@gen-epix/ui';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import sumBy from 'lodash/sumBy';

import type {
  EpiDashboardArrangement,
  EpiDashboardArrangementConfig,
} from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';

export type ArrangementGroupInfo = {
  groupId: string;
  orientation: 'horizontal' | 'vertical';
};

export class DashboardUtil {
  public static readonly dashboardLayoutStorageKey = 'GENEPIX-EpiDashboard-Layout-v1.3';

  public static createDashboardArrangementConfigInitialState(): EpiDashboardArrangementConfig {
    const arrangementOptions = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS;
    const defaultArrangementKey = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_ARRANGEMENT_KEY;

    return {
      arrangement: arrangementOptions[defaultArrangementKey],
      arrangementWidgetAssignments: ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_ARRANGEMENT_WIDGET_ASSIGNMENTS,
    };
  }

  public static getArrangementGroupInfos(arrangement: EpiDashboardArrangement, storagePrefix: string, path = 'root'): ArrangementGroupInfo[] {
    const result: ArrangementGroupInfo[] = [{
      groupId: `${storagePrefix}-${path}`,
      orientation: arrangement.orientation,
    }];
    arrangement.cells.forEach((cell, index) => {
      if ('cells' in cell) {
        result.push(...DashboardUtil.getArrangementGroupInfos(cell, storagePrefix, `${path}-${index}`));
      }
    });
    return result;
  }

  public static getArrangementWidgetAssignments(arrangement: EpiDashboardArrangement, arrangementWidgetAssignments?: { [key: string]: string }): { [key: string]: string } {
    // traverse the arrangement and create an object with all zones set to empty string
    const emptyAssignments: { [key: string]: string } = {};
    const traverseArrangement = (arr: EpiDashboardArrangement) => {
      arr.cells.forEach((item) => {
        if ('name' in item) {
          emptyAssignments[item.name] = arrangementWidgetAssignments?.[item.name] || null;
        } else {
          traverseArrangement(item);
        }
      });
    };
    traverseArrangement(arrangement);
    return emptyAssignments;
  }

  public static getCaseCount(cases: CaseDbCase[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getEnabledWidgets(arrangementConfig: EpiDashboardArrangementConfig): string[] {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(arrangementConfig.arrangement, arrangementConfig.arrangementWidgetAssignments);
    return Object.keys(arrangementWidgetAssignments).filter(widgetName => arrangementWidgetAssignments[widgetName]);
  }

  public static getSelectedRows(cases: CaseDbCase[], selectedIds: string[]): CaseDbCase[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }

  public static isSingleWidget(arrangementConfig: EpiDashboardArrangementConfig, widgetName: string): boolean {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(arrangementConfig.arrangement, arrangementConfig.arrangementWidgetAssignments);
    return arrangementWidgetAssignments?.[widgetName] && Object.keys(arrangementWidgetAssignments).length === 1;
  }
}
