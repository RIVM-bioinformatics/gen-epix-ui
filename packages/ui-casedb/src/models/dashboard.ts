import type { FormFieldDefinition } from '@gen-epix/ui';
import type { FunctionComponent } from 'react';
import type { FieldValues } from 'react-hook-form';
import type {
  CaseDbCol,
  CaseDbGeneticDistanceProtocol,
  CaseDbRefCol,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';

export enum DASHBOARD_ARRANGEMENT_ORIENTATION {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum WIDGET_CONSTRAINT_CARDINAL_DIRECTION {
  EAST = 'EAST',
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  WEST = 'WEST',
}


export type DashboardArrangement = {
  cells: (DashboardArrangement | DashboardArrangementCell)[];
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION;
  size: number;
};

export type DashboardArrangementCell = {
  name: string;
  size: number;
};

export type DashboardArrangementConfig = {
  arrangementKey: string;
  arrangementWidgetAssignments: DashboardArrangementWidgetAssignments;
};

export type DashboardArrangementWidgetAssignments = { [arrangementZone: string]: string };

export type DashboardEpiCurveSettings = {
  isIncludeMissingValuesInAreaChartEnabled: boolean;
};

export type DashboardTreeSettings = {
  isShowDistancesEnabled: boolean;
  isShowSupportLinesWhenUnlinkedEnabled?: boolean;
};


export interface EpiCurveWidgetData extends WidgetDataBase {
  columnId: string;
  dimensionId: string;
}

export interface LineListWidgetData extends WidgetDataBase {
  visibleItemItemIndex: number;
}

export interface MapWidgetData extends WidgetDataBase {
  columnId: string;
  dimensionId: string;
}


export type TreeConfiguration = {
  col: CaseDbCol;
  computedId: string;
  geneticDistanceProtocol: CaseDbGeneticDistanceProtocol;
  refCol: CaseDbRefCol;
  treeAlgorithm: CaseDbTreeAlgorithm;
};

export interface TreeWidgetData extends WidgetDataBase {
  horizontalScrollPosition: number;
  verticalScrollPosition: number;
  zoomLevel: number;
}

export interface TreeWidgetDataPersistable {
  treeConfiguration: TreeConfiguration;
}

export type WidgetConstraint = {
  require_adjacent?: {
    direction: WIDGET_CONSTRAINT_CARDINAL_DIRECTION;
    widgetName: string;
  };
  require_adjacent_direct_sibling?: {
    direction: WIDGET_CONSTRAINT_CARDINAL_DIRECTION;
    widgetName: string;
  };
};

export interface WidgetDataBase {
  [key: string]: unknown;
}

export type WidgetsConfig<TConfigFormValues extends FieldValues, TWidgetData extends WidgetDataBase, TPersistableWidgetData extends WidgetDataBase> = {
  [widgetName: string]: {
    component: FunctionComponent;
    configDefaultValues?: TConfigFormValues;
    configFormFieldsDefinitions?: FormFieldDefinition<TConfigFormValues>[];
    constraints?: WidgetConstraint[];
    dataDefaultValues?: TWidgetData;
    dataPersistableDefaultValues?: TPersistableWidgetData;
    widgetLabel: string;
  };
};
