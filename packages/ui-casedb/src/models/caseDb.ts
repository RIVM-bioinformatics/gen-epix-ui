import type {
  CaseDbConcept,
  CaseDbConceptSet,
  CaseDbDataCollection,
  CaseDbOrganization,
  CaseDbRegion,
  CaseDbRegionSet,
  CaseDbTreeAlgorithm,
} from '@gen-epix/api-casedb';


export enum FILTER_TYPE {
  DATE = 'DATE',
  GEO = 'GEO',
  MULTI_SELECT = 'MULTI_SELECT',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
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

export type DataCache = {
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
  scrollIntoView?: boolean;
};

export type LineListRangeSubjectValue = {
  endIndex: number;
  startIndex: number;
};


export type LinkedScrollSubjectValue = {
  origin: HTMLElement;
  position: number;
};
