import { createStore } from 'zustand';

import type {
  CompleteCaseType,
  DataCollection,
  ValidatedCase,
} from '../../api';
import {
  EPI_UPLOAD_STEP,
  EPI_UPLOAD_ACTION,
  type EpiUploadMappedColumn,
  type EpiUploadSequenceMapping,
} from '../../models/epiUpload';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';
import { QUERY_KEY } from '../..';

export const STEP_ORDER = [
  EPI_UPLOAD_STEP.SELECT_FILE,
  EPI_UPLOAD_STEP.MAP_COLUMNS,
  EPI_UPLOAD_STEP.VALIDATE,
  EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES,
  EPI_UPLOAD_STEP.MAP_SEQUENCES,
  EPI_UPLOAD_STEP.CREATE_CASES,
];


export interface EpiUploadStoreState {
  rawData: string[][];
  completeCaseType: CompleteCaseType;
  createdInDataCollection: DataCollection;
  case_type_id: string;
  created_in_data_collection_id: string;
  share_in_data_collection_ids: string[];
  file_list: FileList;
  fileName: string;
  sheet: string;
  import_action: EPI_UPLOAD_ACTION;
  mappedColumns: EpiUploadMappedColumn[];
  validatedCases: ValidatedCase[];
  sequenceMapping: EpiUploadSequenceMapping;
  sequenceFilesDataTransfer: DataTransfer;
  activeStep: EPI_UPLOAD_STEP;
  validateCasesQueryKey: string[];
}

export interface EpiUploadStoreActions {
  setValue: <K extends keyof EpiUploadStoreState>(key: K, value: EpiUploadStoreState[K]) => void;
  setValues: (values: Partial<EpiUploadStoreState>) => void;
  setFileList: (fileList: FileList) => void;
  setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => void;
  setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => void;

  // setRawData: (rawData: string[][]) => void;
  // setCompleteCaseType: (completeCaseType: CompleteCaseType) => void;
  // setCreateInDataCollection: (dataCollection: DataCollection) => void;

  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;

  destroy: () => Promise<void>;
  invalidateCaseValidationQuery: () => Promise<void>;
  findNextStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP | null;
  findPreviousStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP | null;
}

export type EpiUploadStore = EpiUploadStoreState & EpiUploadStoreActions;


const createEpiUploadStoreDefaultState: () => EpiUploadStoreState = () => ({
  rawData: null,
  activeStep: STEP_ORDER[0],
  completeCaseType: null,
  createdInDataCollection: null,
  case_type_id: null,
  created_in_data_collection_id: null,
  share_in_data_collection_ids: [],
  file_list: null,
  fileName: null,
  sheet: null,
  import_action: EPI_UPLOAD_ACTION.CREATE,
  mappedColumns: [],
  validatedCases: [],
  sequenceMapping: {},
  sequenceFilesDataTransfer: new DataTransfer(),
  validateCasesQueryKey: QueryUtil.getGenericKey(QUERY_KEY.VALIDATE_CASES, StringUtil.createUuid()),
});

export const createEpiUploadStore = () => {
  return createStore<EpiUploadStore>()((set, get) => {
    return {
      ...createEpiUploadStoreDefaultState(),
      setValue: (key, value) => {
        set({ [key]: value });
      },
      setValues: (values) => {
        set({ ...values } as Partial<EpiUploadStoreState>);
      },

      // setRawData: (rawData: string[][]) => {
      //   set({ rawData });
      // },

      setFileList: (fileList: FileList) => {
        set({ file_list: fileList });
        set({ fileName: fileList?.length > 0 ? fileList[0].name : null });
      },

      setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => {
        set({ sequenceFilesDataTransfer: dataTransfer });
      },

      setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => {
        set({ sequenceMapping });
      },

      goToNextStep: () => {
        const { activeStep } = get();
        const nextStep = get().findNextStep(activeStep);
        if (nextStep !== null) {
          set({ activeStep: nextStep });
        }
      },

      goToPreviousStep: () => {
        const { activeStep } = get();
        const previousStep = get().findPreviousStep(activeStep);
        if (previousStep !== null) {
          set({ activeStep: previousStep });
        }
      },

      reset: () => {
        set(createEpiUploadStoreDefaultState());
      },

      findNextStep: (currentStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP | null => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) {
          return null;
        }
        return STEP_ORDER[currentIndex + 1];
      },

      findPreviousStep: (currentStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP | null => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex <= 0) {
          return null;
        }
        return STEP_ORDER[currentIndex - 1];
      },

      invalidateCaseValidationQuery: async () => {
        const { validateCasesQueryKey } = get();

        await QueryUtil.invalidateQueryKeys([validateCasesQueryKey]);
        QueryUtil.removeQueries([validateCasesQueryKey]);
      },

      destroy: async () => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
      },
    };
  });
};
