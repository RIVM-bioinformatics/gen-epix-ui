import type {
  CaseDbCol,
  CaseDbColType,
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbDataCollection,
  CaseDbGeneticDistanceProtocol,
  CaseDbOrganization,
  CaseDbRefCol,
  CaseDbRegion,
  CaseDbRegionSet,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';
import type { FormFieldDefinition } from '@gen-epix/ui';
import type { FunctionComponent } from 'react';
import type { FieldValues } from 'react-hook-form';

export enum DASHBOARD_ARRANGEMENT_ORIENTATION {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export enum FILTER_TYPE {
  DATE = 'DATE',
  GEO = 'GEO',
  MULTI_SELECT = 'MULTI_SELECT',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
}

export enum STRATIFICATION_MODE {
  FIELD = 'FIELD',
  SELECTION = 'SELECTION',
}

export enum STRATIFICATION_SELECTED {
  SELECTED = 'SELECTED',
  UNSELECTED = 'UNSELECTED',
}

export enum UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  PREVIEW = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}

export enum WIDGET_CONSTRAINT_CARDINAL_DIRECTION {
  EAST = 'EAST',
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  WEST = 'WEST',
}

export type CaseHasCaseSet = { [caseId: string]: boolean };

export type CaseTypeRowValue = {
  full: string;
  isMissing?: boolean;
  long: string;
  raw: string;
  short: string;
};

//Note: this type exists because the backend sends this as a JSON string.
export type ConceptBoundaryProps = {
  lb: number;
  lb_in: boolean;
  ub: number;
  ub_in: boolean;
  unit: string;
};

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

export type Data = {
  conceptsById: { [id: string]: CaseDbConcept };
  conceptsBySetId: { [id: string]: CaseDbConcept[] };
  conceptSets: { [id: string]: CaseDbConceptSet };
  conceptsIdsBySetId: { [id: string]: string[] };
  organizations: CaseDbOrganization[];
  organizationsById: { [id: string]: CaseDbOrganization };
  regionsById: { [id: string]: CaseDbRegion };
  regionsByRegionSetId: { [id: string]: CaseDbRegion[] };
  regionSets: { [id: string]: CaseDbRegionSet };
  treeAlgorithms: CaseDbTreeAlgorithm[];
  userDataCollections: CaseDbDataCollection[];
  userDataCollectionsById: { [id: string]: CaseDbDataCollection };
};

export type FindSimilarCasesChartDataPoint = {
  count: number;
  date: string;
};

export type FindSimilarCasesChartGranularity = 'day' | 'month' | 'quarter' | 'year';

export type FindSimilarCasesChartInterval = {
  count: number;
  endDate: string;
  label: string;
  startDate: string;
};

export type FindSimilarCasesResult = {
  colId: string;
  distance: number;
  key: string;
  originalCaseIds: string[];
  similarCaseIds: string[];
};

export type Highlighting = {
  caseIds: string[];
  origin: string;
};

export type LineListRangeSubjectValue = {
  endIndex: number;
  startIndex: number;
};

export type LinkedScrollSubjectValue = {
  origin: HTMLElement;
  position: number;
};

export interface StratifiableColumn {
  col: CaseDbCol;
  enabled: boolean;
}

export type Stratification = {
  caseIdColors: { [key: string]: string };
  col?: CaseDbCol;
  colorForIsMissing: string;
  legendaItems?: StratificationLegendaItem[];
  legendaItemsByColor?: { [key: string]: StratificationLegendaItem };
  legendaItemsByValue?: { [key: string]: StratificationLegendaItem };
  mode: STRATIFICATION_MODE;
};

export type StratificationLegendaItem = {
  caseIds: string[];
  color: string;
  columnType?: CaseDbColType;
  rowValue: CaseTypeRowValue;
};

export type TreeConfiguration = {
  col: CaseDbCol;
  computedId: string;
  geneticDistanceProtocol: CaseDbGeneticDistanceProtocol;
  refCol: CaseDbRefCol;
  treeAlgorithm: CaseDbTreeAlgorithm;
};

export type TreeFocus = {
  leafs: string[];
  root: string;
};

export type UploadCompleteColStats = {
  readsColumns: CaseDbCol[];
  sampleIdColumns: CaseDbCol[];
  sequenceColumns: CaseDbCol[];
  writableColumns: CaseDbCol[];
};

/**
 * File assignment result for genetic file uploads
 */
export interface UploadFileColumnAssignment {
  col: CaseDbCol; // null if no suitable column found
  file: File;
}

export type UploadMappedColumn = {
  col: CaseDbCol;
  isCaseIdColumn?: boolean;
  isCol?: boolean;
  isSampleIdColumn?: boolean;
  originalIndex: number;
  originalLabel: string;
  sampleIdentifierIssuerId?: string;
};

export type UploadMappedColumnsFormFields = {
  [key: string]: string;
};

export type UploadSequenceMapping = {
  [caseId: string]: UploadSequenceMappingForCaseId;
};

export type UploadSequenceMappingForCaseId = {
  readsFileNames: {
    [colId: string]: {
      fwd: string;
      rev: string;
    };
  };
  sequenceFileNames: {
    [colId: string]: string;
  };
};

export type UploadTableRow = {
  [key: string]: string;
};

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

export type WidgetsConfig<TConfigFormValues extends FieldValues> = {
  [widgetName: string]: {
    component: FunctionComponent;
    configDefaultValues?: TConfigFormValues;
    configFormFieldsDefinitions?: FormFieldDefinition<TConfigFormValues>[];
    constraints?: WidgetConstraint[];
    widgetLabel: string;
  };
};
