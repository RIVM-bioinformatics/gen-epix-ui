import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useTheme } from '@mui/material';

import type {
  EpiUploadMappedColumn,
  EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import type { ValidatedCase } from '../../../api';

import EpiUploadSelectFile from './EpiUploadSelectFile';
import { EpiUploadMapColumns } from './EpiUploadMapColumns';
import { EpiUploadValidate } from './EpiUploadValidate';
import { EpiUploadCreateCases } from './EpiUploadCreateCases';
import { EpiUploadSelectSequenceFiles } from './EpiUploadSelectSequenceFiles';


enum EPI_UPLOAD_STEP {
  SELECT_FILE = 0,
  MAP_COLUMNS = 1,
  VALIDATE = 2,
  SELECT_SEQUENCE_FILES = 3,
  MAP_SEQUENCES = 4,
  UPLOAD = 5,
}

export const EpiUpload = () => {
  const [t] = useTranslation();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(EPI_UPLOAD_STEP.SELECT_FILE);

  const stepOrder = useMemo(() => [
    EPI_UPLOAD_STEP.SELECT_FILE,
    EPI_UPLOAD_STEP.MAP_COLUMNS,
    EPI_UPLOAD_STEP.VALIDATE,
    EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES,
    EPI_UPLOAD_STEP.MAP_SEQUENCES,
    EPI_UPLOAD_STEP.UPLOAD,
  ], []);
  const steps = useMemo(() => {
    return {
      [EPI_UPLOAD_STEP.SELECT_FILE]: t`Select file`,
      [EPI_UPLOAD_STEP.MAP_COLUMNS]: t`Map columns`,
      [EPI_UPLOAD_STEP.VALIDATE]: t`Validate`,
      [EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES]: t`Select sequence files`,
      [EPI_UPLOAD_STEP.MAP_SEQUENCES]: t`Map sequences`,
      [EPI_UPLOAD_STEP.UPLOAD]: t`Upload`,
    } satisfies Record<EPI_UPLOAD_STEP, string>;
  }, [t]);

  const [selectFileResult, setSelectFileResult] = useState<EpiUploadSelectFileResult | null>(null);
  const [mappedColumns, setMappedColumns] = useState<EpiUploadMappedColumn[] | null>(null);
  const [validatedCases, setValidatedCases] = useState<ValidatedCase[] | null>(null);

  const onEpiUploadSelectFileProceed = useCallback((data: EpiUploadSelectFileResult) => {
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
  }, [mappedColumns, t]);

  const findNext = useCallback((fromStep: EPI_UPLOAD_STEP) => {
    const currentIndex = stepOrder.indexOf(fromStep);
    return currentIndex >= 0 && currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null;
  }, [stepOrder]);

  const findPrevious = useCallback((fromStep: EPI_UPLOAD_STEP) => {
    const currentIndex = stepOrder.indexOf(fromStep);
    return currentIndex > 0 ? stepOrder[currentIndex - 1] : null;
  }, [stepOrder]);

  const onEpiUploadMapColumnsProceed = useCallback((data: EpiUploadMappedColumn[]) => {
    setMappedColumns(data);
    setActiveStep(findNext(EPI_UPLOAD_STEP.MAP_COLUMNS));
  }, [findNext]);

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

  const onEpiUploadSelectSequenceFilesProceed = useCallback((_fileList: FileList) => {
    // Handle the file list selection
    setActiveStep(findNext(EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES));
  }, [findNext]);

  const onUploadCasesStartOver = useCallback(() => {
    setSelectFileResult(null);
    setMappedColumns(null);
    setValidatedCases(null);
    setActiveStep(EPI_UPLOAD_STEP.SELECT_FILE);
  }, []);

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
          return (
            <Step
              key={step}
              {...stepProps}
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
            fileName={selectFileResult.file_list[0]?.name ?? 'unknown file'}
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
            onGoBack={onEpiUploadValidateGoBack}
            onProceed={onEpiUploadValidateProceed}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.UPLOAD && (
          <EpiUploadCreateCases
            selectFileResult={selectFileResult}
            validatedCases={validatedCases}
            onStartOver={onUploadCasesStartOver}
          />
        )}
        {activeStep === EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES && (
          <EpiUploadSelectSequenceFiles
            onGoBack={onEpiUploadSelectSequenceFilesGoBack}
            onProceed={onEpiUploadSelectSequenceFilesProceed}
          />
        )}
      </Box>
    </Box>
  );
};
