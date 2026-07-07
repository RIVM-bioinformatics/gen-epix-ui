import type { CaseDbCol } from '@gen-epix/api-casedb';

export enum UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  PREVIEW = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}

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
