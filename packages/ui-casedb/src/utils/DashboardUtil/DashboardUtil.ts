import { ConfigService } from '@gen-epix/ui';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import type { FieldValues } from 'react-hook-form';
import sumBy from 'lodash/sumBy';

import {
  DASHBOARD_ARRANGEMENT_ORIENTATION,
  WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
} from '../../models/dashboard';
import type {
  DashboardArrangement,
  DashboardArrangementCell,
  DashboardArrangementConfig,
  DashboardArrangementWidgetAssignments,
  WidgetDataBase,
  WidgetsConfig,
} from '../../models/dashboard';
import type { CaseDbConfig } from '../../models/config';

export type ArrangementGroupInfo = {
  groupId: string;
  orientation: 'horizontal' | 'vertical';
};

export class DashboardUtil {
  public static readonly dashboardLayoutStorageKey = 'GENEPIX-EpiDashboard-Layout-v1.3';

  public static createDashboardArrangementConfigInitialState(): DashboardArrangementConfig {
    const defaultArrangementKey = ConfigService.getInstance<CaseDbConfig>().config.dashboard.DEFAULT_ARRANGEMENT_KEY;

    return {
      arrangementKey: defaultArrangementKey,
      arrangementWidgetAssignments: ConfigService.getInstance<CaseDbConfig>().config.dashboard.DEFAULT_WIDGET_ASSIGNMENTS[defaultArrangementKey],
    };
  }


  public static getAdjacentZones(
    arrangement: DashboardArrangement,
    zoneName: string,
    direction: WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
  ): string[] {
    const adjacencyMap: Record<string, Partial<Record<WIDGET_CONSTRAINT_CARDINAL_DIRECTION, string[]>>> = {};

    const addAdjacency = (zone: string, dir: WIDGET_CONSTRAINT_CARDINAL_DIRECTION, adjacent: string[]) => {
      adjacencyMap[zone] ??= {};
      adjacencyMap[zone][dir] ??= [];
      adjacencyMap[zone][dir].push(...adjacent);
    };

    const traverse = (arr: DashboardArrangement) => {
      const isHorizontal = arr.orientation === DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL;
      arr.cells.forEach((cell, index) => {
        if (index > 0) {
          const prevCell = arr.cells[index - 1];
          if (isHorizontal) {
            const prevEast = DashboardUtil.getBoundaryLeafZones(prevCell, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST);
            const currWest = DashboardUtil.getBoundaryLeafZones(cell, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST);
            prevEast.forEach(z => addAdjacency(z, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST, currWest));
            currWest.forEach(z => addAdjacency(z, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST, prevEast));
          } else {
            const prevSouth = DashboardUtil.getBoundaryLeafZones(prevCell, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH);
            const currNorth = DashboardUtil.getBoundaryLeafZones(cell, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.NORTH);
            prevSouth.forEach(z => addAdjacency(z, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH, currNorth));
            currNorth.forEach(z => addAdjacency(z, WIDGET_CONSTRAINT_CARDINAL_DIRECTION.NORTH, prevSouth));
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

  public static getArrangementGroupInfos(arrangement: DashboardArrangement, storagePrefix: string, path = 'root'): ArrangementGroupInfo[] {
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

  public static getArrangementWidgetAssignments(arrangement: DashboardArrangement, arrangementWidgetAssignments?: { [key: string]: string }): { [key: string]: string } {
    // traverse the arrangement and create an object with all zones set to empty string
    const emptyAssignments: { [key: string]: string } = {};
    const traverseArrangement = (arr: DashboardArrangement) => {
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
    arrangementConfig: DashboardArrangementConfig,
    zoneName: string,
    widgetsConfig: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase>,
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
      const arrangement = DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey);
      return constraints.every((constraint) => {
        if (constraint.require_adjacent) {
          const { direction, widgetName: requiredWidget } = constraint.require_adjacent;
          const adjacentZones = DashboardUtil.getAdjacentZones(arrangement, zoneName, direction);
          return adjacentZones.some(zone => assignments[zone] === requiredWidget);
        }
        if (constraint.require_adjacent_direct_sibling) {
          const { widgetName: requiredWidget } = constraint.require_adjacent_direct_sibling;
          const siblingZones = DashboardUtil.getSiblingZonesInSameCellsArray(arrangement, zoneName);
          return siblingZones.some(zone => assignments[zone] === requiredWidget);
        }
        return true;
      });
    });
  }

  public static getCaseCount(cases: CaseDbCase[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getEnabledWidgets(arrangementConfig: DashboardArrangementConfig): string[] {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey), arrangementConfig.arrangementWidgetAssignments);
    return Object.keys(arrangementWidgetAssignments).filter(widgetName => arrangementWidgetAssignments[widgetName]);
  }

  public static getSelectedRows(cases: CaseDbCase[], selectedIds: string[]): CaseDbCase[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }

  public static isArrangementWidgetAssignmentsValid(
    assignments: DashboardArrangementWidgetAssignments,
    widgets: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase>,
  ): boolean {
    return Object.values(assignments).every((widgetName) => !widgetName || widgetName in widgets);
  }

  public static isSingleWidget(arrangementConfig: DashboardArrangementConfig, widgetName: string): boolean {
    const arrangementWidgetAssignments = DashboardUtil.getArrangementWidgetAssignments(DashboardUtil.getArrangementByKey(arrangementConfig.arrangementKey), arrangementConfig.arrangementWidgetAssignments);
    return arrangementWidgetAssignments?.[widgetName] && Object.keys(arrangementWidgetAssignments).length === 1;
  }

  public static removeInvalidWidgetAssignments(
    config: DashboardArrangementConfig,
    widgetsConfig: WidgetsConfig<FieldValues, WidgetDataBase, WidgetDataBase>,
  ): DashboardArrangementConfig {
    let updatedConfig = config;
    let changed = true;
    while (changed) {
      changed = false;
      const assignments = { ...updatedConfig.arrangementWidgetAssignments };
      for (const [zoneName, widgetName] of Object.entries(assignments)) {
        if (!widgetName) {
          continue;
        }
        const availableWidgets = DashboardUtil.getAvailableWidgets(updatedConfig, zoneName, widgetsConfig);
        if (!availableWidgets.includes(widgetName)) {

          assignments[zoneName] = null;
          changed = true;
        }
      }
      if (changed) {
        updatedConfig = { ...updatedConfig, arrangementWidgetAssignments: assignments };
      }
    }
    return updatedConfig;
  }

  public static validateAndMigrateArrangementConfig(config: DashboardArrangementConfig): DashboardArrangementConfig {
    const dashboardConfig = ConfigService.getInstance<CaseDbConfig>().config.dashboard;
    let result = config;

    if (!result.arrangementKey || !(result.arrangementKey in dashboardConfig.ARRANGEMENT_OPTIONS)) {
      result = { ...result, arrangementKey: dashboardConfig.DEFAULT_ARRANGEMENT_KEY };
    }

    if (!DashboardUtil.isArrangementWidgetAssignmentsValid(result.arrangementWidgetAssignments, dashboardConfig.WIDGETS)) {
      result = {
        ...result,
        arrangementWidgetAssignments: dashboardConfig.DEFAULT_WIDGET_ASSIGNMENTS[result.arrangementKey]
          ?? dashboardConfig.DEFAULT_WIDGET_ASSIGNMENTS[dashboardConfig.DEFAULT_ARRANGEMENT_KEY],
      };
    }

    return result;
  }

  private static getArrangementByKey(arrangementKey: string): DashboardArrangement {
    return ConfigService.getInstance<CaseDbConfig>().config.dashboard.ARRANGEMENT_OPTIONS[arrangementKey];
  }

  private static getBoundaryLeafZones(
    cell: DashboardArrangement | DashboardArrangementCell,
    direction: WIDGET_CONSTRAINT_CARDINAL_DIRECTION,
  ): string[] {
    if ('name' in cell) {
      return [cell.name];
    }
    const { cells, orientation } = cell;
    if (cells.length === 0) {
      return [];
    }
    const isHorizontal = orientation === DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL;
    if (direction === WIDGET_CONSTRAINT_CARDINAL_DIRECTION.EAST) {
      return isHorizontal
        ? DashboardUtil.getBoundaryLeafZones(cells[cells.length - 1], direction)
        : cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction));
    }
    if (direction === WIDGET_CONSTRAINT_CARDINAL_DIRECTION.WEST) {
      return isHorizontal
        ? DashboardUtil.getBoundaryLeafZones(cells[0], direction)
        : cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction));
    }
    if (direction === WIDGET_CONSTRAINT_CARDINAL_DIRECTION.SOUTH) {
      return isHorizontal
        ? cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction))
        : DashboardUtil.getBoundaryLeafZones(cells[cells.length - 1], direction);
    }
    // NORTH
    return isHorizontal
      ? cells.flatMap(c => DashboardUtil.getBoundaryLeafZones(c, direction))
      : DashboardUtil.getBoundaryLeafZones(cells[0], direction);
  }

  private static getSiblingZonesInSameCellsArray(
    arrangement: DashboardArrangement,
    zoneName: string,
  ): string[] {
    const search = (arr: DashboardArrangement): null | string[] => {
      const directLeafNames = arr.cells
        .filter((cell): cell is DashboardArrangementCell => 'name' in cell)
        .map(cell => cell.name);
      if (directLeafNames.includes(zoneName)) {
        return directLeafNames.filter(name => name !== zoneName);
      }
      for (const cell of arr.cells) {
        if ('cells' in cell) {
          const result = search(cell);
          if (result !== null) {
            return result;
          }
        }
      }
      return null;
    };
    return search(arrangement) ?? [];
  }
}
