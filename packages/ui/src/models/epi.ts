import type {
  CaseUploadResult,
  Col,
  ColType,
  Concept,
  ConceptSet,
  DataCollection,
  GeneticDistanceProtocol,
  Organization,
  RefCol,
  Region,
  RegionSet,
  TreeAlgorithm,
} from '../api';

export enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  VALIDATE = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}

export enum EPI_ZONE {
  EPI_CURVE = 'EPI_CURVE',
  LEGENDA = 'LEGENDA',
  LINE_LIST = 'LINE_LIST',
  MAP = 'MAP',
  TREE = 'TREE',
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

export type CaseTypeRowValue = {
  full: string;
  isMissing?: boolean;
  long: string;
  raw: string;
  short: string;
};

export type CaseUploadResultWithGeneratedId = { generatedId: string } & CaseUploadResult;

export type EpiCaseHasCaseSet = { [caseId: string]: boolean };

export type EpiDashboardLayout = [EpiDashboardLayoutPanelOrientation, ...EpiDashboardLayoutFirstAxisPanel[]];

export type EpiDashboardLayoutConfig = { layouts: EpiDashboardLayout[]; zones: EPI_ZONE[] };
export type EpiDashboardLayoutFirstAxisPanel = [100 | 30 | 50 | 70, ...EpiDashboardLayoutSecondAxisPanel[]];
export type EpiDashboardLayoutPanelOrientation = 'horizontal' | 'vertical';
export type EpiDashboardLayoutSecondAxisPanel = [100 | 30 | 50 | 70, EPI_ZONE];
export type EpiDashboardLayoutUserConfig = {
  arrangement: number;
  zones: {
    [EPI_ZONE.EPI_CURVE]: boolean;
    [EPI_ZONE.LINE_LIST]: boolean;
    [EPI_ZONE.MAP]: boolean;
    [EPI_ZONE.TREE]: boolean;
  };
};
export type EpiData = {
  conceptsById: { [id: string]: Concept };
  conceptsBySetId: { [id: string]: Concept[] };
  conceptSets: { [id: string]: ConceptSet };
  conceptsIdsBySetId: { [id: string]: string[] };
  organizations: Organization[];
  organizationsById: { [id: string]: Organization };
  regionsById: { [id: string]: Region };
  regionsByRegionSetId: { [id: string]: Region[] };
  regionSets: { [id: string]: RegionSet };
  treeAlgorithms: TreeAlgorithm[];
  userDataCollections: DataCollection[];
  userDataCollectionsById: { [id: string]: DataCollection };
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
  readsColumns: Col[];
  sampleIdColumns: Col[];
  sequenceColumns: Col[];
  writableColumns: Col[];
};

/**
 * File assignment result for genetic file uploads
 */
export interface EpiUploadFileColumnAssignment {
  col: Col; // null if no suitable column found
  file: File;
}

export type EpiUploadMappedColumn = {
  col: Col;
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

export type FindSimilarCasesResult = {
  colId: string;
  distance: number;
  key: string;
  originalCaseIds: string[];
  similarCaseIds: string[];
};

export type Highlighting = {
  caseIds: string[];
  origin: EPI_ZONE;
};

export type Stratification = {
  caseIdColors: { [key: string]: string };
  col?: Col;
  legendaItems?: StratificationLegendaItem[];
  legendaItemsByColor?: { [key: string]: StratificationLegendaItem };
  legendaItemsByValue?: { [key: string]: StratificationLegendaItem };
  mode: STRATIFICATION_MODE;
};

export type StratificationLegendaItem = {
  caseIds: string[];
  color: string;
  columnType?: ColType;
  rowValue: CaseTypeRowValue;
};


export type TreeConfiguration = {
  col: Col;
  computedId: string;
  geneticDistanceProtocol: GeneticDistanceProtocol;
  refCol: RefCol;
  treeAlgorithm: TreeAlgorithm;
};

export type TreeFocus = {
  leafs: string[];
  root: string;
};
