import type {
  CaseTypeCol,
  ValidatedCase,
} from '../api';

export type EpiUploadMappedColumn = {
  originalIndex: number;
  originalLabel: string;
  caseTypeCol: CaseTypeCol;
  isCaseIdColumn?: boolean;
  isCaseDateColumn?: boolean;
  isCaseTypeColumn?: boolean;
};

export enum EPI_UPLOAD_ACTION {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export type EpiUploadMappedColumnsFormFields = {
  [key: string]: string | null;
};

export type EpiUploadTableRow = {
  [key: string]: string;
};

/**
 * File assignment result for genetic file uploads
 */
export interface EpiUploadFileColumnAssignment {
  file: File;
  caseTypeCol: CaseTypeCol; // null if no suitable column found
}

export type EpiValidatedCaseWithGeneratedId = ValidatedCase & { generated_id: string };

export type EpiUploadSequenceMapping = {
  [caseId: string]: {
    [seqOrReadColumnId: string]: string;
  };
};

export type EpiUploadCompleteCaseTypeColumnStats = {
  idColumns: CaseTypeCol[];
  sequenceColumns: CaseTypeCol[];
  readsColumns: CaseTypeCol[];
  writableColumns: CaseTypeCol[];
  readsFwdRevColumnPairs: { fwd: CaseTypeCol; rev: CaseTypeCol }[];
};

export enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  VALIDATE = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}
