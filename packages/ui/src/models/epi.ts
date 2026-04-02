import type {
  ColType,
  Col,
  RefCol,
  GeneticDistanceProtocol,
  TreeAlgorithm,
  Organization,
  ConceptSet,
  Concept,
  RegionSet,
  Region,
  DataCollection,
  CaseUploadResult,
} from '../api';

export type CaseTypeRowValue = {
  raw: string;
  short: string;
  long: string;
  full: string;
  isMissing?: boolean;
};

export enum STRATIFICATION_MODE {
  FIELD = 'FIELD',
  SELECTION = 'SELECTION',
}

export type StratificationLegendaItem = {
  color: string;
  caseIds: string[];
  rowValue: CaseTypeRowValue;
  columnType?: ColType;
};

export enum STRATIFICATION_SELECTED {
  SELECTED = 'SELECTED',
  UNSELECTED = 'UNSELECTED',
}

export type Stratification = {
  mode: STRATIFICATION_MODE;
  caseIdColors: { [key: string]: string };
  legendaItems?: StratificationLegendaItem[];
  legendaItemsByColor?: { [key: string]: StratificationLegendaItem };
  legendaItemsByValue?: { [key: string]: StratificationLegendaItem };
  col?: Col;
};

export enum EPI_ZONE {
  LINE_LIST = 'LINE_LIST',
  EPI_CURVE = 'EPI_CURVE',
  MAP = 'MAP',
  TREE = 'TREE',
  LEGENDA = 'LEGENDA',
}

export type Highlighting = {
  caseIds: string[];
  origin: EPI_ZONE;
};

export type TreeFocus = {
  root: string;
  leafs: string[];
};

export enum FILTER_TYPE {
  DATE = 'DATE',
  NUMBER = 'NUMBER',
  MULTI_SELECT = 'MULTI_SELECT',
  STRING = 'STRING',
  GEO = 'GEO',
}

export type EpiDashboardLayoutPanelOrientation = 'vertical' | 'horizontal';
export type EpiDashboardLayoutSecondAxisPanel = [30 | 70 | 50 | 100, EPI_ZONE];
export type EpiDashboardLayoutFirstAxisPanel = [30 | 70 | 50 | 100, ...EpiDashboardLayoutSecondAxisPanel[]];
export type EpiDashboardLayout = [EpiDashboardLayoutPanelOrientation, ...EpiDashboardLayoutFirstAxisPanel[]];
export type EpiDashboardLayoutConfig = { zones: EPI_ZONE[]; layouts: EpiDashboardLayout[] };
export type EpiDashboardLayoutUserConfig = {
  arrangement: number;
  zones: {
    [EPI_ZONE.EPI_CURVE]: boolean;
    [EPI_ZONE.LINE_LIST]: boolean;
    [EPI_ZONE.MAP]: boolean;
    [EPI_ZONE.TREE]: boolean;
  };
};

export type TreeConfiguration = {
  computedId: string;
  refCol: RefCol;
  col: Col;
  geneticDistanceProtocol: GeneticDistanceProtocol;
  treeAlgorithm: TreeAlgorithm;
};

export type EpiLinkedScrollSubjectValue = {
  position: number;
  origin: HTMLElement;
};

export type EpiLineListRangeSubjectValue = {
  startIndex: number;
  endIndex: number;
};

export type EpiData = {
  organizations: Organization[];
  organizationsById: { [id: string]: Organization };
  conceptSets: { [id: string]: ConceptSet };
  conceptsBySetId: { [id: string]: Concept[] };
  conceptsIdsBySetId: { [id: string]: string[] };
  conceptsById: { [id: string]: Concept };
  regionSets: { [id: string]: RegionSet };
  regionsByRegionSetId: { [id: string]: Region[] };
  regionsById: { [id: string]: Region };
  userDataCollections: DataCollection[];
  userDataCollectionsById: { [id: string]: DataCollection };
  treeAlgorithms: TreeAlgorithm[];
};

export type FindSimilarCasesResult = {
  key: string;
  similarCaseIds: string[];
  originalCaseIds: string[];
  distance: number;
  colId: string;
};

export type EpiCaseHasCaseSet = { [caseId: string]: boolean };

export type EpiUploadMappedColumn = {
  originalIndex: number;
  originalLabel: string;
  col: Col;
  isCaseIdColumn?: boolean;
  isCol?: boolean;
  isSampleIdColumn?: boolean;
  sampleIdentifierIssuerId?: string;
};

export type EpiUploadMappedColumnsFormFields = {
  [key: string]: string;
};

export type EpiUploadTableRow = {
  [key: string]: string;
};

/**
 * File assignment result for genetic file uploads
 */
export interface EpiUploadFileColumnAssignment {
  file: File;
  col: Col; // null if no suitable column found
}

export type CaseUploadResultWithGeneratedId = CaseUploadResult & { generatedId: string };

export type EpiUploadSequenceMappingForCaseId = {
  sequenceFileNames: {
    [colId: string]: string;
  };
  readsFileNames: {
    [colId: string]: {
      fwd: string;
      rev: string;
    };
  };
};

export type EpiUploadSequenceMapping = {
  [caseId: string]: EpiUploadSequenceMappingForCaseId;
};


export type EpiUploadCompleteColStats = {
  sampleIdColumns: Col[];
  sequenceColumns: Col[];
  readsColumns: Col[];
  writableColumns: Col[];
};

export enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  VALIDATE = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}
