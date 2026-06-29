import { ConfigManager } from '@gen-epix/ui';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import sumBy from 'lodash/sumBy';

import {
  EPI_DASHBOARD_ARRANGEMENT_ORIENTATION,
  EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
} from '../../models/epi';
import type {
  EpiDashboardArrangement,
  EpiDashboardArrangementCell,
  EpiDashboardArrangementConfig,
  EpiDashboardArrangementWidgetAssignments,
  EpiWidgetsConfig,
} from '../../models/epi';
import type { CaseDbConfig } from '../../models/config';

export type ArrangementGroupInfo = {
  groupId: string;
  orientation: 'horizontal' | 'vertical';
};

export class DashboardUtil {
  public static readonly dashboardLayoutStorageKey = 'GENEPIX-EpiDashboard-Layout-v1.3';

  public static createDashboardArrangementConfigInitialState(): EpiDashboardArrangementConfig {
    const defaultArrangementKey = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_ARRANGEMENT_KEY;

    return {
      arrangementKey: defaultArrangementKey,
      arrangementWidgetAssignments: ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.DEFAULT_WIDGET_ASSIGNMENTS[defaultArrangementKey],
    };
  }


  public static getAdjacentZones(
    arrangement: EpiDashboardArrangement,
    zoneName: string,
    direction: EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
  ): string[] {
    const adjacencyMap: Record<string, Partial<Record<EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION, string[]>>> = {};

    const addAdjacency = (zone: string, dir: EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION, adjacent: string[]) => {
      adjacencyMap[zone] ??= {};
      adjacencyMap[zone][dir] ??= [];
      adjacencyMap[zone][dir].push(...adjacent);
    };

    const traverse = (arr: EpiDashboardArrangement) => {
      const isHorizontal = arr.orientation === EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL;
      arr.cells.forEach((cell, index) => {
        if (index > 0) {
          const prevCell = arr.cells[index - 1];
          if (isHorizontal) {
            const prevEast = DashboardUtil.getBoundaryLeafZones(prevCell, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST);
            const currWest = DashboardUtil.getBoundaryLeafZones(cell, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST);
            prevEast.forEach(z => addAdjacency(z, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST, currWest));
            currWest.forEach(z => addAdjacency(z, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST, prevEast));
          } else {
            const prevSouth = DashboardUtil.getBoundaryLeafZones(prevCell, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH);
            const currNorth = DashboardUtil.getBoundaryLeafZones(cell, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.NORTH);
            prevSouth.forEach(z => addAdjacency(z, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH, currNorth));
            currNorth.forEach(z => addAdjacency(z, EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.NORTH, prevSouth));
          }
        }
        if ('cells' in cell) {
          traverse(cell);
        }
      });
    };

    traverse(arrangement);
    return adjacencyMap[zoneName]?.[direction] ?? [];
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

  public static getAvailableWidgets(
    arrangementConfig: EpiDashboardArrangementConfig,
    zoneName: string,
    widgetsConfig: EpiWidgetsConfig,
  ): string[] {
    const assignments = DashboardUtil.getArrangementWidgetAssignments(
      DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey),
      arrangementConfig.arrangementWidgetAssignments,
    );
    const assignedWidgetNames = new Set(
      Object.entries(assignments)
        .filter(([zone]) => zone !== zoneName)
        .map(([, widgetName]) => widgetName)
        .filter(Boolean),
    );
    return Object.keys(widgetsConfig).filter(widgetName => {
      if (assignedWidgetNames.has(widgetName)) {
        return false;
      }
      const constraints = widgetsConfig[widgetName].constraints ?? [];
      return constraints.every(({ require_adjacent: { direction, widgetName: requiredWidget } }) => {
        const adjacentZones = DashboardUtil.getAdjacentZones(DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey), zoneName, direction);
        return adjacentZones.some(zone => assignments[zone] === requiredWidget);
      });
    });
  }

  public static getCaseCount(cases: CaseDbCase[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getEnabledWidgets(arrangementConfig: EpiDashboardArrangementConfig): string[] {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey), arrangementConfig.arrangementWidgetAssignments);
    return Object.keys(arrangementWidgetAssignments).filter(widgetName => arrangementWidgetAssignments[widgetName]);
  }

  public static getSelectedRows(cases: CaseDbCase[], selectedIds: string[]): CaseDbCase[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }

  public static isArrangementWidgetAssignmentsValid(
    assignments: EpiDashboardArrangementWidgetAssignments,
    widgets: EpiWidgetsConfig,
  ): boolean {
    return Object.values(assignments).every((widgetName) => !widgetName || widgetName in widgets);
  }

  public static isSingleWidget(arrangementConfig: EpiDashboardArrangementConfig, widgetName: string): boolean {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey), arrangementConfig.arrangementWidgetAssignments);
    return arrangementWidgetAssignments?.[widgetName] && Object.keys(arrangementWidgetAssignments).length === 1;
  }

  public static validateAndMigrateArrangementConfig(config: EpiDashboardArrangementConfig): EpiDashboardArrangementConfig {
    const epiDashboardConfig = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard;
    let result = config;

    if (!result.arrangementKey || !(result.arrangementKey in epiDashboardConfig.ARRANGEMENT_OPTIONS)) {
      result = { ...result, arrangementKey: epiDashboardConfig.DEFAULT_ARRANGEMENT_KEY };
    }

    if (!DashboardUtil.isArrangementWidgetAssignmentsValid(result.arrangementWidgetAssignments, epiDashboardConfig.WIDGETS)) {
      result = {
        ...result,
        arrangementWidgetAssignments: epiDashboardConfig.DEFAULT_WIDGET_ASSIGNMENTS[result.arrangementKey]
          ?? epiDashboardConfig.DEFAULT_WIDGET_ASSIGNMENTS[epiDashboardConfig.DEFAULT_ARRANGEMENT_KEY],
      };
    }

    return result;
  }

  private static getArrangementByKey(arrangementKey: string): EpiDashboardArrangement {
    return ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard.ARRANGEMENT_OPTIONS[arrangementKey];
  }

  private static getBoundaryLeafZones(
    cell: EpiDashboardArrangement | EpiDashboardArrangementCell,
    direction: EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
  ): string[] {
    if ('name' in cell) {
      return [cell.name];
    }
    const { cells, orientation } = cell;
    if (cells.length === 0) {
      return [];
    }
    const isHorizontal = orientation === EPI_DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL;
    if (direction === EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST) {
      return isHorizontal
        ? DashboardUtil.getBoundaryLeafZones(cells[cells.length - 1], direction)
        : cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction));
    }
    if (direction === EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST) {
      return isHorizontal
        ? DashboardUtil.getBoundaryLeafZones(cells[0], direction)
        : cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction));
    }
    if (direction === EPI_WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH) {
      return isHorizontal
        ? cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction))
        : DashboardUtil.getBoundaryLeafZones(cells[cells.length - 1], direction);
    }
    // NORTH
    return isHorizontal
      ? cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction))
      : DashboardUtil.getBoundaryLeafZones(cells[0], direction);
  }
}
