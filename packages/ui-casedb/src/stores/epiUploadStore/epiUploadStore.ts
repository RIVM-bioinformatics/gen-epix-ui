import { createStore } from 'zustand';
import { t } from 'i18next';
import type {
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import type {
  AutoCompleteOption,
  OptionBase,
} from '@gen-epix/ui';
import {
  NotificationManager,
  QueryKeyManager,
  StringUtil,
} from '@gen-epix/ui';

import type {
  CaseUploadResultWithGeneratedId,
  EpiUploadMappedColumn,
  EpiUploadSequenceMapping,
} from '../../models/epi';
import { EPI_UPLOAD_STEP } from '../../models/epi';
import { EpiUploadUtil } from '../../utils/EpiUploadUtil';
import { CASEDB_QUERY_KEY } from '../../data/query';

export const STEP_ORDER = [
  EPI_UPLOAD_STEP.SELECT_FILE,
  EPI_UPLOAD_STEP.MAP_COLUMNS,
  EPI_UPLOAD_STEP.VALIDATE,
  EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES,
  EPI_UPLOAD_STEP.MAP_SEQUENCES,
  EPI_UPLOAD_STEP.CREATE_CASES,
];

export type EpiUploadStore = EpiUploadStoreActions & EpiUploadStoreState;

export interface EpiUploadStoreActions {
  destroy: () => Promise<void>;
  findNextStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP;
  findPreviousStep: (currentStep: EPI_UPLOAD_STEP) => EPI_UPLOAD_STEP;
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  invalidateCaseValidationQuery: () => Promise<void>;
  reset: () => Promise<void>;
  setCaseTypeId: (caseTypeId: string) => void;
  setCols: (cols: CaseDbCol[]) => void;
  setCompleteCaseType: (completeCaseType: CaseDbCompleteCaseType) => void;
  setCreatedInDataCollectionId: (createdInDataCollectionId: string) => void;
  setDataCollectionOptions: (options: OptionBase<string>[]) => void;
  setFileList: (fileList: FileList) => Promise<void>;

  setMappedColumns: (mappedColumns: EpiUploadMappedColumn[]) => Promise<void>;
  setRawData: (rawData: string[][]) => Promise<void>;
  setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => void;
  setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => void;
  setSheet: (sheet: string) => Promise<void>;
  setSheetOptions: (sheetOptions: AutoCompleteOption<string>[]) => Promise<void>;
  setValidatedCases: (validatedCases: CaseDbCaseUploadResult[]) => void;
}

export interface EpiUploadStoreState {
  activeStep: EPI_UPLOAD_STEP;
  assemblyProtocolId: string;
  caseTypeId: string;
  cols: CaseDbCol[];
  completeCaseType: CaseDbCompleteCaseType;
  createdInDataCollectionId: string;
  createdInDataCollectionOptions: AutoCompleteOption<string>[];
  dataCollectionOptions: OptionBase<string>[];
  fileList: FileList;
  fileName: string;
  fileParsingError: string;
  initError: unknown;
  isInitLoading: boolean;
  mappedColumns: EpiUploadMappedColumn[];
  rawData: string[][];
  sampleIdColId: string;
  sequenceFilesDataTransfer: DataTransfer;
  sequenceMapping: EpiUploadSequenceMapping;
  sequencingProtocolId: string;
  sheet: string;
  sheetOptions: AutoCompleteOption<string>[];
  shouldResetColumnMapping: boolean;
  shouldResetSequenceMapping: boolean;
  validateCasesQueryKey: string[];
  validatedCases: CaseDbCaseUploadResult[];
  validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
}


const createEpiUploadStoreDefaultState: () => EpiUploadStoreState = () => ({
  activeStep: STEP_ORDER[0],
  assemblyProtocolId: null,
  caseTypeId: null,
  cols: null,
  completeCaseType: null,
  createdInDataCollectionId: null,
  createdInDataCollectionOptions: [],
  dataCollectionOptions: [],
  fileList: null,
  fileName: null,
  fileParsingError: null,
  initError: null,
  isInitLoading: true,
  mappedColumns: null,
  rawData: null,
  sampleIdColId: null,
  sequenceFilesDataTransfer: new DataTransfer(),
  sequenceMapping: null,
  sequencingProtocolId: null,
  sheet: null,
  sheetOptions: [],
  shouldResetColumnMapping: false,
  shouldResetSequenceMapping: false,
  validateCasesQueryKey: QueryKeyManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.VALIDATE_CASES, StringUtil.createUuid()),
  validatedCases: [],
  validatedCasesWithGeneratedId: [],
});

export const createEpiUploadStore = () => {
  return createStore<EpiUploadStore>()((set, get) => {
    return {
      ...createEpiUploadStoreDefaultState(),
      destroy: async () => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
      },

      findNextStep: (currentStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) {
          return null;
        }
        return STEP_ORDER[currentIndex + 1];
      },

      findPreviousStep: (currentStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex <= 0) {
          return null;
        }
        return STEP_ORDER[currentIndex - 1];
      },

      goToNextStep: async () => {
        const { activeStep, completeCaseType, mappedColumns, rawData, sequenceFilesDataTransfer, sequenceMapping, setMappedColumns, shouldResetColumnMapping, shouldResetSequenceMapping, validatedCasesWithGeneratedId } = get();

        let nextStep = get().findNextStep(activeStep);

        if (nextStep === EPI_UPLOAD_STEP.MAP_COLUMNS) {
          if (shouldResetColumnMapping && mappedColumns) {
            NotificationManager.getInstance().showNotification({
              isLoading: false,
              message: t`Column mappings have been reset due to changes in the selected case type or file.`,
              severity: 'info',
            });
          }
          if ((shouldResetColumnMapping && mappedColumns) || !mappedColumns) {
            await setMappedColumns(EpiUploadUtil.getInitialMappedColumns(completeCaseType, rawData));
          }
        }

        if (nextStep === EPI_UPLOAD_STEP.MAP_SEQUENCES) {
          if (shouldResetSequenceMapping && sequenceMapping) {
            NotificationManager.getInstance().showNotification({
              isLoading: false,
              message: t`Sequence mappings have been reset due to changes in the selected uploaded files.`,
              severity: 'info',
            });
          }
          if ((shouldResetSequenceMapping && sequenceMapping) || !sequenceMapping) {
            set({ sequenceMapping: EpiUploadUtil.getEpiUploadSequenceMapping(completeCaseType, validatedCasesWithGeneratedId, sequenceFilesDataTransfer) });
          }
          if (EpiUploadUtil.getSequenceMappingStats(get().sequenceMapping, sequenceFilesDataTransfer).numberOfFilesToMap === 0) {
            nextStep = get().findNextStep(nextStep);
          }
        }

        if (nextStep !== null) {
          set({ activeStep: nextStep, shouldResetColumnMapping: false, shouldResetSequenceMapping: false });
        }
      },

      goToPreviousStep: () => {
        const { activeStep, sequenceFilesDataTransfer, sequenceMapping } = get();
        let previousStep = get().findPreviousStep(activeStep);
        if (previousStep === EPI_UPLOAD_STEP.MAP_SEQUENCES && EpiUploadUtil.getSequenceMappingStats(sequenceMapping, sequenceFilesDataTransfer).numberOfFilesToMap === 0) {
          previousStep = get().findPreviousStep(previousStep);
        }

        if (previousStep !== null) {
          set({ activeStep: previousStep });
        }
      },

      invalidateCaseValidationQuery: async () => {
        const { validateCasesQueryKey } = get();

        await QueryKeyManager.getInstance().invalidateQueryKeys([validateCasesQueryKey]);
        QueryKeyManager.getInstance().removeQueries([validateCasesQueryKey]);
      },

      reset: async () => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
        set(createEpiUploadStoreDefaultState());
      },

      setCaseTypeId: (caseTypeId: string) => {
        set({ caseTypeId });
      },

      setCols: (cols: CaseDbCol[]) => {
        set({ cols });
      },

      setCompleteCaseType: async (completeCaseType: CaseDbCompleteCaseType) => {
        const { completeCaseType: oldCompleteCaseType, createdInDataCollectionId, dataCollectionOptions, invalidateCaseValidationQuery } = get();
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

          // If the current createdInDataCollectionId is not valid for the new completeCaseType, reset it
          if (createdInDataCollectionId) {
            const isValid = createdInDataCollectionOptions.some(option => option.value === createdInDataCollectionId);
            if (!isValid) {
              set({ createdInDataCollectionId: null });
            }
          }
        }
      },

      setCreatedInDataCollectionId: (createdInDataCollectionId: string) => {
        set({ createdInDataCollectionId });
      },

      setDataCollectionOptions: (options: OptionBase<string>[]) => {
        set({ dataCollectionOptions: options });
      },

      setFileList: async (fileList: FileList) => {
        const { setRawData, setSheet, setSheetOptions } = get();

        const file = fileList?.length > 0 ? fileList[0] : null;
        set({ fileName: file?.name ?? null, fileParsingError: null, rawData: null, sheet: null });

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

      setMappedColumns: async (mappedColumns: EpiUploadMappedColumn[]) => {
        const { invalidateCaseValidationQuery } = get();
        await invalidateCaseValidationQuery();
        set({ mappedColumns });
      },

      setRawData: async (rawData: string[][]) => {
        const { cols, invalidateCaseValidationQuery, rawData: oldRawData, setCaseTypeId } = get();
        if (JSON.stringify(oldRawData) !== JSON.stringify(rawData)) {
          set({ shouldResetColumnMapping: true });
          await invalidateCaseValidationQuery();
        }
        set({ rawData });
        if (!rawData || rawData.length === 0) {
          return;
        }
        const bestMatchingCaseType = EpiUploadUtil.getCaseTypeFromColumnLabels(cols, rawData[0]);
        if (bestMatchingCaseType) {
          setCaseTypeId(bestMatchingCaseType.id);
        }
      },

      setSequenceFilesDataTransfer: (dataTransfer: DataTransfer) => {
        const { sequenceFilesDataTransfer, sequenceMapping } = get();
        if (dataTransfer === sequenceFilesDataTransfer) {
          return;
        }
        set({ sequenceFilesDataTransfer: dataTransfer });
        if (sequenceMapping) {
          set({ shouldResetSequenceMapping: true });
        }
      },

      setSequenceMapping: (sequenceMapping: EpiUploadSequenceMapping) => {
        set({ sequenceMapping });
      },

      setSheet: async (sheet: string) => {
        const { fileList, setRawData } = get();
        set({ fileParsingError: null, rawData: null, sheet });

        if (!sheet) {
          return;
        }
        try {
          // Call the callback with parsed data
          await setRawData(await EpiUploadUtil.readRawData(fileList, sheet));
        } catch (error) {
          console.log('Error reading sheet', error);
          set({ sheet: null });
          set({ fileParsingError: t('Error reading sheet') });
          await setRawData(null);
          return;
        }
      },

      setSheetOptions: async (sheetOptions: AutoCompleteOption<string>[]) => {
        const { setSheet } = get();
        set({ sheetOptions });
        if (sheetOptions.length === 1) {
          await setSheet(sheetOptions[0].value);
        }
      },

      setValidatedCases: (validatedCases: CaseDbCaseUploadResult[]) => {
        set({
          validatedCases, validatedCasesWithGeneratedId: (validatedCases || []).map((vc, index) => ({
            ...vc,
            generatedId: index.toString(),
          })),
        });
      },
    };
  });
};
