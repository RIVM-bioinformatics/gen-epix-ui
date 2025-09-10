import type {
  CaseTypeCol,
  CompleteCaseType,
  DataCollection,
} from '../api';

export type EpiUploadSelectFileResult = {
  completeCaseType: CompleteCaseType;
  createInDataCollection: DataCollection;
  rawData: string[][];
  case_type_id: string;
  create_in_data_collection_id: string;
  share_in_data_collection_ids: string[];
  file_list: FileList;
  sheet: string;
  import_action: EPI_UPLOAD_ACTION;
};

export type EpiUploadMappedColumn = {
  originalIndex: number;
  originalLabel: string;
  caseTypeCol: CaseTypeCol;
  isCaseIdColumn?: boolean;
  isCaseDateColumn?: boolean;
};

export enum EPI_UPLOAD_ACTION {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export type EpiUploadMappedColumnsFormFields = {
  [key: string]: string | null;
};
