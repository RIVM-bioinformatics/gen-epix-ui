import type {
  CaseDbCaseForUpload,
  CaseDbCaseUploadResult,
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
import type { FunctionComponent } from 'react';

export enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  PREVIEW = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
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

export type CaseForUploadWithGeneratedId = { generatedId: string } & CaseDbCaseForUpload;

export type CaseTypeRowValue = {
  full: string;
  isMissing?: boolean;
  long: string;
  raw: string;
  short: string;
};
export type CaseUploadResultWithGeneratedId = { generatedId: string } & CaseDbCaseUploadResult;

export type EpiCaseHasCaseSet = { [caseId: string]: boolean };

export type EpiConceptBoundaryProps = {
  lb: number;
  lb_in: boolean;
  ub: number;
  ub_in: boolean;
  unit: string;
};

export type EpiDashboardArrangement = Array<Array<Array<string> | string> | string>;

export type EpiDashboardArrangementConfig = {
  arrangement: EpiDashboardArrangement;
  arrangementWidgetAssignments: EpiDashboardArrangementWidgetAssignments;
};
export type EpiDashboardArrangementWidgetAssignments = { [arrangementZone: string]: string };

export type EpiData = {
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

export type EpiLineListRangeSubjectValue = {
  endIndex: number;
  startIndex: number;
};

export type EpiLinkedScrollSubjectValue = {
  origin: HTMLElement;
  position: number;
};

export type EpiUploadCompleteColStats = {
  readsColumns: CaseDbCol[];
  sampleIdColumns: CaseDbCol[];
  sequenceColumns: CaseDbCol[];
  writableColumns: CaseDbCol[];
};

/**
 * File assignment result for genetic file uploads
 */
export interface EpiUploadFileColumnAssignment {
  col: CaseDbCol; // null if no suitable column found
  file: File;
}

export type EpiUploadMappedColumn = {
  col: CaseDbCol;
  isCaseIdColumn?: boolean;
  isCol?: boolean;
  isSampleIdColumn?: boolean;
  originalIndex: number;
  originalLabel: string;
  sampleIdentifierIssuerId?: string;
};

export type EpiUploadMappedColumnsFormFields = {
  [key: string]: string;
};

export type EpiUploadSequenceMapping = {
  [caseId: string]: EpiUploadSequenceMappingForCaseId;
};

export type EpiUploadSequenceMappingForCaseId = {
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

export type EpiUploadTableRow = {
  [key: string]: string;
};

export type EpiWidgetConfig = {
  [widgetName: string]: {
    component: FunctionComponent;
    widgetLabel: string;
  };
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
