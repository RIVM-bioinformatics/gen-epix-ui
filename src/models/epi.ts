import type {
  Case,
  ColType,
  CaseTypeCol,
  Col,
  GeneticDistanceProtocol,
  TreeAlgorithm,
  Organization,
  ConceptSet,
  Concept,
  RegionSet,
  Region,
  DataCollection,
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

export interface CaseWithMetaData extends Case {
  isSelected: boolean;
  groupColor?: string;
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
  caseTypeColumn?: CaseTypeCol;
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

export type EpiDashboardLayoutFirstPanelDirection = 'vertical' | 'horizontal';
export type EpiDashboardLayoutSecondAxisPanel = [30 | 70 | 50 | 100, EPI_ZONE];
export type EpiDashboardLayoutFirstAxisPanel = [30 | 70 | 50 | 100, ...EpiDashboardLayoutSecondAxisPanel[]];
export type EpiDashboardLayout = [EpiDashboardLayoutFirstPanelDirection, ...EpiDashboardLayoutFirstAxisPanel[]];
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
  col: Col;
  caseTypeCol: CaseTypeCol;
  geneticDistanceProtocol: GeneticDistanceProtocol;
  treeAlgorithm: TreeAlgorithm;
};

export type EpiLinkedScrollSubjectValue = {
  position: number;
  origin: HTMLElement;
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

export type EpiCaseHasCaseSet = { [caseId: string]: boolean };
