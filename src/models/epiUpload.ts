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
  file_list: FileList;
  sheet: string;
};

export type EpiUploadMappedColumn = {
  originalIndex: number;
  originalLabel: string;
  caseTypeCol: CaseTypeCol;
};
