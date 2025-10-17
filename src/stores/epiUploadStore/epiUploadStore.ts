import { createStore } from 'zustand';
import { t } from 'i18next';

import type {
  CaseTypeCol,
  CompleteCaseType,
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
import { EpiUploadUtil } from '../../utils/EpiUploadUtil';
import { QUERY_KEY } from '../../models/query';
import type {
  AutoCompleteOption,
  OptionBase,
} from '../../models/form';
import { NotificationManager } from '../../classes/managers/NotificationManager';

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
  caseTypeId: string;
  createdInDataCollectionId: string;
  shareInDataCollectionIds: string[];
  fileList: FileList;
  fileName: string;
  sheet: string;
  importAction: EPI_UPLOAD_ACTION;
  mappedColumns: EpiUploadMappedColumn[];
  validatedCases: ValidatedCase[];
  sequenceMapping: EpiUploadSequenceMapping;
  sequenceFilesDataTransfer: DataTransfer;
  activeStep: EPI_UPLOAD_STEP;
  validateCasesQueryKey: string[];
  fileParsingError: string;
  sheetOptions: AutoCompleteOption<string>[];
  dataCollectionOptions: OptionBase<string>[];
  createdInDataCollectionOptions: AutoCompleteOption<string>[];
  shareInDataCollectionOptions: AutoCompleteOption<string>[];
  caseTypeCols: CaseTypeCol[];
  isInitLoading: boolean;
  initError: unknown;
  shouldResetColumnMapping: boolean;
}

export interface EpiUploadStoreActions {
  setFileList: (fileList: FileList) => Promise<void>;
  setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => void;
  setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => void;
  setMappedColumns: (mappedColumns: EpiUploadMappedColumn[]) => Promise<void>;
  setSheet: (sheet: string) => Promise<void>;
  setCaseTypeId: (caseTypeId: string) => void;
  setCompleteCaseType: (completeCaseType: CompleteCaseType) => void;
  setCreatedInDataCollectionId: (createdInDataCollectionId: string) => void;
  setShareInDataCollectionIds: (shareInDataCollectionIds: string[]) => void;
  setImportAction: (importAction: EPI_UPLOAD_ACTION) => Promise<void>;
  setRawData: (rawData: string[][]) => Promise<void>;
  setSheetOptions: (sheetOptions: AutoCompleteOption<string>[]) => Promise<void>;
  setCaseTypeCols: (caseTypeCols: CaseTypeCol[]) => void;
  setDataCollectionOptions: (options: OptionBase<string>[]) => void;
  setValidatedCases: (validatedCases: ValidatedCase[]) => void;

  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  reset: () => Promise<void>;
  destroy: () => Promise<void>;
  invalidateCaseValidationQuery: () => Promise<void>;
  findNextStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP | null;
  findPreviousStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP | null;
}

export type EpiUploadStore = EpiUploadStoreState & EpiUploadStoreActions;


const createEpiUploadStoreDefaultState: () => EpiUploadStoreState = () => ({
  activeStep: STEP_ORDER[0],
  caseTypeId: null,
  completeCaseType: null,
  createdInDataCollectionId: null,
  fileList: null,
  fileName: null,
  fileParsingError: null,
  importAction: EPI_UPLOAD_ACTION.CREATE,
  mappedColumns: null,
  rawData: null,
  sequenceFilesDataTransfer: new DataTransfer(),
  sequenceMapping: {},
  shareInDataCollectionIds: [],
  sheet: null,
  validateCasesQueryKey: QueryUtil.getGenericKey(QUERY_KEY.VALIDATE_CASES, StringUtil.createUuid()),
  validatedCases: [],
  sheetOptions: [],
  caseTypeCols: null,
  dataCollectionOptions: [],
  isInitLoading: true,
  initError: null,
  createdInDataCollectionOptions: [],
  shareInDataCollectionOptions: [],
  shouldResetColumnMapping: false,
});

export const createEpiUploadStore = () => {
  return createStore<EpiUploadStore>()((set, get) => {
    return {
      ...createEpiUploadStoreDefaultState(),
      setValidatedCases: (validatedCases: ValidatedCase[]) => {
        set({ validatedCases });
      },

      setCaseTypeCols: (caseTypeCols: CaseTypeCol[]) => {
        set({ caseTypeCols });
      },

      setDataCollectionOptions: (options: OptionBase<string>[]) => {
        set({ dataCollectionOptions: options });
      },

      setRawData: async (rawData: string[][]) => {
        const { caseTypeCols, setCaseTypeId, rawData: oldRawData, invalidateCaseValidationQuery } = get();
        if (JSON.stringify(oldRawData) !== JSON.stringify(rawData)) {
          set({ shouldResetColumnMapping: true });
          await invalidateCaseValidationQuery();
        }
        set({ rawData });
        if (!rawData || rawData.length === 0) {
          return;
        }
        const bestMatchingCaseType = EpiUploadUtil.getCaseTypeFromColumnLabels(caseTypeCols, rawData[0]);
        if (bestMatchingCaseType) {
          setCaseTypeId(bestMatchingCaseType.id);
        }
      },

      setFileList: async (fileList: FileList) => {
        const { setSheetOptions, setSheet, setRawData } = get();

        set({ fileParsingError: null });

        const file = fileList?.length > 0 ? fileList[0] : null;
        set({ fileName: file ? file.name : null });
        if (!file) {
          await setSheet(null);
          await setRawData(null);
          set({ fileList: null });
          return;
        }

        set({ fileList });
        try {
          if (!EpiUploadUtil.isXlsxFile(file.name)) {
            const data = await EpiUploadUtil.readRawData(fileList);
            await setRawData(data);
          }
          const sheetOptions = await EpiUploadUtil.getSheetNameOptions(fileList);
          await setSheetOptions(sheetOptions);
        } catch (_error) {
          await setSheet(null);
          await setSheetOptions([]);
          set({ fileList: null, fileParsingError: t('Error reading file') });
        }
      },

      setSheetOptions: async (sheetOptions: AutoCompleteOption<string>[]) => {
        const { setSheet } = get();
        set({ sheetOptions });
        if (sheetOptions.length === 1) {
          await setSheet(sheetOptions[0].value);
        }
      },

      setSheet: async (sheet: string) => {
        const { fileList, setRawData } = get();
        set({ sheet });
        set({ fileParsingError: null });
        if (!sheet) {
          return;
        }
        try {
          // Call the callback with parsed data
          await setRawData(await EpiUploadUtil.readRawData(fileList, sheet));
        } catch (_error) {
          set({ sheet: null });
          set({ fileParsingError: t('Error reading sheet') });
          await setRawData(null);
          return;
        }
      },

      setCaseTypeId: (caseTypeId: string) => {
        set({ caseTypeId });
      },

      setCreatedInDataCollectionId: (createdInDataCollectionId: string) => {
        set({ createdInDataCollectionId });
      },

      setShareInDataCollectionIds: (shareInDataCollectionIds: string[]) => {
        set({ shareInDataCollectionIds });
      },

      setCompleteCaseType: async (completeCaseType: CompleteCaseType) => {
        const { completeCaseType: oldCompleteCaseType, dataCollectionOptions, createdInDataCollectionId, shareInDataCollectionIds, invalidateCaseValidationQuery } = get();
        set({ completeCaseType });
        if (completeCaseType && completeCaseType.id !== oldCompleteCaseType?.id) {
          await invalidateCaseValidationQuery();
          set({ shouldResetColumnMapping: true });
          const createdInDataCollectionOptions = dataCollectionOptions.filter(option => {
            const dataCollectionId = option.value;
            return completeCaseType.case_type_access_abacs[dataCollectionId]?.is_private && completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
          });
          set({ createdInDataCollectionOptions });
          if (createdInDataCollectionOptions.length === 1) {
            set({ createdInDataCollectionId: createdInDataCollectionOptions[0].value });
          }

          const shareInDataCollectionOptions = dataCollectionOptions.filter(option => {
            const dataCollectionId = option.value;
            return completeCaseType.case_type_access_abacs[dataCollectionId]?.is_private && !completeCaseType.case_type_access_abacs[dataCollectionId]?.add_case_set;
          });
          set({ shareInDataCollectionOptions });

          // If the current createdInDataCollectionId is not valid for the new completeCaseType, reset it
          if (createdInDataCollectionId) {
            const isValid = createdInDataCollectionOptions.some(option => option.value === createdInDataCollectionId);
            if (!isValid) {
              set({ createdInDataCollectionId: null });
            }
          }

          // Filter shareInDataCollectionIds to only valid options
          const validShareInIds = shareInDataCollectionIds.filter(id => shareInDataCollectionOptions.some(option => option.value === id));
          set({ shareInDataCollectionIds: validShareInIds });
        }
      },

      setImportAction: async (importAction: EPI_UPLOAD_ACTION) => {
        const { importAction: oldImportAction, invalidateCaseValidationQuery } = get();
        if (importAction !== oldImportAction) {
          set({ shouldResetColumnMapping: true });
          await invalidateCaseValidationQuery();
        }
        if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
          set({ shareInDataCollectionIds: [] });
        }
        set({ importAction });
      },

      setMappedColumns: async (mappedColumns: EpiUploadMappedColumn[]) => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
        set({ mappedColumns });
      },

      setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => {
        set({ sequenceFilesDataTransfer: dataTransfer });
      },

      setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => {
        set({ sequenceMapping });
      },

      goToNextStep: async () => {
        const { activeStep, shouldResetColumnMapping, mappedColumns, setMappedColumns, completeCaseType, rawData, importAction } = get();

        const nextStep = get().findNextStep(activeStep);

        if (nextStep === EPI_UPLOAD_STEP.MAP_COLUMNS) {
          if (shouldResetColumnMapping && mappedColumns) {
            NotificationManager.instance.showNotification({
              message: t`Column mappings have been reset due to changes in the selected case type or file.`,
              severity: 'info',
              isLoading: false,
            });
          }
          if ((shouldResetColumnMapping && mappedColumns) || !mappedColumns) {
            await setMappedColumns(EpiUploadUtil.getInitialMappedColumns(completeCaseType, rawData, importAction));
          }
        }

        if (nextStep !== null) {
          set({ activeStep: nextStep, shouldResetColumnMapping: false });
        }
      },

      goToPreviousStep: () => {
        const { activeStep } = get();
        const previousStep = get().findPreviousStep(activeStep);
        if (previousStep !== null) {
          set({ activeStep: previousStep });
        }
      },

      reset: async () => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
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
