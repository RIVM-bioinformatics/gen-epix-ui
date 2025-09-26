import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTheme } from '@mui/material';
import noop from 'lodash/noop';

import type {
  EpiUploadMappedColumn,
  EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import type { ValidatedCase } from '../../../api';
import { QUERY_KEY } from '../../../models/query';
import { QueryUtil } from '../../../utils/QueryUtil';

import EpiUploadSelectFile from './EpiUploadSelectFile';
import { EpiUploadMapColumns } from './EpiUploadMapColumns';
import { EpiUploadValidate } from './EpiUploadValidate';
import { EpiUploadCreateCases } from './EpiUploadCreateCases';
import { EpiUploadSelectSequenceFiles } from './EpiUploadSelectSequenceFiles';
import { EpiUploadMapSequences } from './EpiUploadMapSequences';


enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  VALIDATE = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  CREATE_CASES = 5,
}

export const EpiUpload = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(EPI_UPLOAD_STEP.SELECT_FILE);
  const validateQueryKeyId = useId();
  const validateQueryKey = useMemo(() => QueryUtil.getGenericKey(QUERY_KEY.VALIDATE_CASES, validateQueryKeyId), [validateQueryKeyId]);

  const invalidateCaseValidationQuery = useCallback(async () => {
    await QueryUtil.invalidateQueryKeys([validateQueryKey]);
    QueryUtil.removeQueries([validateQueryKey]);
  }, [validateQueryKey]);

  useEffect(() => {
    return () => {
      invalidateCaseValidationQuery().catch(noop);
    };
  }, [invalidateCaseValidationQuery]);

  const stepOrder = useMemo(() => [
    EPI_UPLOAD_STEP.SELECT_FILE,
    EPI_UPLOAD_STEP.MAP_COLUMNS,
    EPI_UPLOAD_STEP.VALIDATE,
    EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES,
    EPI_UPLOAD_STEP.MAP_SEQUENCES,
    EPI_UPLOAD_STEP.CREATE_CASES,
  ], []);
  const steps = useMemo(() => {
    return {
      [EPI_UPLOAD_STEP.SELECT_FILE]: t`Select file`,
      [EPI_UPLOAD_STEP.MAP_COLUMNS]: t`Map columns`,
      [EPI_UPLOAD_STEP.VALIDATE]: t`Validate`,
      [EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES]: t`Select sequence files`,
      [EPI_UPLOAD_STEP.MAP_SEQUENCES]: t`Map sequences`,
      [EPI_UPLOAD_STEP.CREATE_CASES]: t`Upload`,
    } satisfies Record<EPI_UPLOAD_STEP, string>;
  }, [t]);
  const [disabledSteps, setDisabledSteps] = useState<EPI_UPLOAD_STEP[]>([]);


  const [selectFileResult, setSelectFileResult] = useState<EpiUploadSelectFileResult | null>(null);
  const [sequenceFilesDataTransfer, setSequenceFilesDataTransfer] = useState<DataTransfer | null>(null);
  const [mappedColumns, setMappedColumns] = useState<EpiUploadMappedColumn[] | null>(null);
  const [validatedCases, setValidatedCases] = useState<ValidatedCase[] | null>(null);


  useEffect(() => {
    if (selectFileResult?.completeCaseType) {
      const { sequenceColumns, readsColumns } = EpiUploadUtil.getCompleteCaseTypeColumnStats(selectFileResult.completeCaseType);
      const newDisabledSteps: EPI_UPLOAD_STEP[] = [];
      if (sequenceColumns.length === 0 || readsColumns.length === 0) {
        newDisabledSteps.push(EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES, EPI_UPLOAD_STEP.MAP_SEQUENCES);
      }
      setDisabledSteps(newDisabledSteps);
    } else {
      setDisabledSteps([]);
    }
  }, [selectFileResult]);

  const findNext = useCallback((fromStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP | null => {
    const currentIndex = stepOrder.indexOf(fromStep);
    if (currentIndex < 0 || currentIndex >= stepOrder.length - 1) {
      return null;
    }

    // Find next non-disabled step
    for (let i = currentIndex + 1; i < stepOrder.length; i++) {
      const nextStep = stepOrder[i];
      if (!disabledSteps.includes(nextStep)) {
        return nextStep;
      }
    }

    return null;
  }, [stepOrder, disabledSteps]);

  const findPrevious = useCallback((fromStep: EPI_UPLOAD_STEP): EPI_UPLOAD_STEP | null => {
    const currentIndex = stepOrder.indexOf(fromStep);
    if (currentIndex <= 0) {
      return null;
    }

    // Find previous non-disabled step
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevStep = stepOrder[i];
      if (!disabledSteps.includes(prevStep)) {
        return prevStep;
      }
    }

    return null;
  }, [stepOrder, disabledSteps]);

  const onEpiUploadSelectFileProceed = useCallback(async (data: EpiUploadSelectFileResult) => {
    if (JSON.stringify(selectFileResult) !== JSON.stringify(data)) {
      await invalidateCaseValidationQuery();
    }
    setSelectFileResult(data);
    if (mappedColumns) {
      if (!EpiUploadUtil.areMappedColumnsEqual(mappedColumns, EpiUploadUtil.getInitialMappedColumns(data.completeCaseType, data.rawData, data.import_action))) {
        NotificationManager.instance.showNotification({
          message: t`Column mappings have been reset due to changes in the selected case type or file.`,
          severity: 'info',
          isLoading: false,
        });
        setMappedColumns(null);
      }
    }
    setActiveStep(EPI_UPLOAD_STEP.MAP_COLUMNS);
  }, [invalidateCaseValidationQuery, mappedColumns, selectFileResult, t]);

  const onEpiUploadMapColumnsProceed = useCallback(async (data: EpiUploadMappedColumn[]) => {
    if (JSON.stringify(mappedColumns) !== JSON.stringify(data)) {
      await invalidateCaseValidationQuery();
    }
    setMappedColumns(data);
    setActiveStep(findNext(EPI_UPLOAD_STEP.MAP_COLUMNS));
  }, [findNext, invalidateCaseValidationQuery, mappedColumns]);

  const onEpiUploadMapColumnsGoBack = useCallback(() => {
    setActiveStep(findPrevious(EPI_UPLOAD_STEP.MAP_COLUMNS));
  }, [findPrevious]);

  const onEpiUploadValidateGoBack = useCallback(() => {
    setActiveStep(findPrevious(EPI_UPLOAD_STEP.VALIDATE));
  }, [findPrevious]);

  const onEpiUploadValidateProceed = useCallback((data: ValidatedCase[]) => {
    setValidatedCases(data);
    setActiveStep(findNext(EPI_UPLOAD_STEP.VALIDATE));
  }, [findNext]);

  const onEpiUploadSelectSequenceFilesGoBack = useCallback(() => {
    setActiveStep(findPrevious(EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES));
  }, [findPrevious]);

  const onEpiUploadSelectSequenceFilesProceed = useCallback((dataTransfer: DataTransfer) => {
    setSequenceFilesDataTransfer(dataTransfer);
    setActiveStep(findNext(EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES));
  }, [findNext]);

  const onEpiUploadMapSequencesGoBack = useCallback(() => {
    setActiveStep(findPrevious(EPI_UPLOAD_STEP.MAP_SEQUENCES));
  }, [findPrevious]);

  const onEpiUploadMapSequencesProceed = useCallback(() => {
    setActiveStep(findNext(EPI_UPLOAD_STEP.MAP_SEQUENCES));
  }, [findNext]);

  const onEpiUploadCreateCasesStartOver = useCallback(async () => {
    await QueryUtil.invalidateQueryKeys([validateQueryKey]);
    setSelectFileResult(null);
    setMappedColumns(null);
    setValidatedCases(null);
    setActiveStep(EPI_UPLOAD_STEP.SELECT_FILE);
  }, [validateQueryKey]);

  const onEpiUploadCreateCasesGoBack = useCallback(() => {
    setActiveStep(findPrevious(EPI_UPLOAD_STEP.CREATE_CASES));
  }, [findPrevious]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'max-content auto',
      }}
    >
      <Stepper activeStep={activeStep}>
        {stepOrder.map((step) => {
          const stepProps: { completed?: boolean } = {};
          const isDisabled = disabledSteps.includes(step);
          return (
            <Step
              key={step}
              {...stepProps}
              disabled={isDisabled}
            >
              <StepLabel>
                {steps[step]}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Box
        sx={{
          marginTop: 2,
          marginBottom: 2,
          height: `calc(100% - ${theme.spacing(4)})`,
          position: 'relative',
        }}
      >
        {activeStep === EPI_UPLOAD_STEP.SELECT_FILE && (
          <EpiUploadSelectFile
            defaultValues={selectFileResult ? {
              case_type_id: selectFileResult.case_type_id,
              create_in_data_collection_id: selectFileResult.create_in_data_collection_id,
              share_in_data_collection_ids: selectFileResult.share_in_data_collection_ids,
              file_list: selectFileResult.file_list,
              sheet: selectFileResult.sheet,
              import_action: selectFileResult.import_action,
            } : undefined}
            onProceed={onEpiUploadSelectFileProceed}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.MAP_COLUMNS && (
          <EpiUploadMapColumns
            mappedColumns={mappedColumns || undefined}
            completeCaseType={selectFileResult.completeCaseType}
            rawData={selectFileResult.rawData}
            importAction={selectFileResult.import_action}
            fileName={selectFileResult.file_list[0].name}
            onProceed={onEpiUploadMapColumnsProceed}
            onGoBack={onEpiUploadMapColumnsGoBack}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.VALIDATE && (
          <EpiUploadValidate
            caseTypeId={selectFileResult.case_type_id}
            completeCaseType={selectFileResult.completeCaseType}
            selectFileResult={selectFileResult}
            mappedColumns={mappedColumns}
            queryKey={validateQueryKey}
            onGoBack={onEpiUploadValidateGoBack}
            onProceed={onEpiUploadValidateProceed}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES && (
          <EpiUploadSelectSequenceFiles
            initialDataTransfer={sequenceFilesDataTransfer || undefined}
            onGoBack={onEpiUploadSelectSequenceFilesGoBack}
            onProceed={onEpiUploadSelectSequenceFilesProceed}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.MAP_SEQUENCES && (
          <EpiUploadMapSequences
            completeCaseType={selectFileResult.completeCaseType}
            validatedCases={validatedCases || []}
            sequenceFilesDataTransfer={sequenceFilesDataTransfer}
            onGoBack={onEpiUploadMapSequencesGoBack}
            onProceed={onEpiUploadMapSequencesProceed}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.CREATE_CASES && (
          <EpiUploadCreateCases
            selectFileResult={selectFileResult}
            validatedCases={validatedCases}
            onGoBack={onEpiUploadCreateCasesGoBack}
            onStartOver={onEpiUploadCreateCasesStartOver}
          />
        )}
      </Box>
    </Box>
  );
};
