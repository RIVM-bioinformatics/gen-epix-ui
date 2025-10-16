import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import {
  useContext,
  useMemo,
} from 'react';
import { useTheme } from '@mui/material';
import { useStore } from 'zustand';

import { EPI_UPLOAD_STEP } from '../../../models/epiUpload';
import {
  EpiUploadStoreContext,
  STEP_ORDER,
} from '../../../stores/epiUploadStore';

import EpiUploadSelectFile from './EpiUploadSelectFile';
import { EpiUploadMapColumns } from './EpiUploadMapColumns';
import { EpiUploadValidate } from './EpiUploadValidate';
import { EpiUploadCreateCases } from './EpiUploadCreateCases';
import { EpiUploadSelectSequenceFiles } from './EpiUploadSelectSequenceFiles';
import { EpiUploadMapSequences } from './EpiUploadMapSequences';

export const EpiUpload = () => {
  const [t] = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const activeStep = useStore(store, (state) => state.activeStep);

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

  // const onEpiUploadSelectFileProceed = useCallback(async (data: EpiUploadSelectFileResult) => {
  //   if (JSON.stringify(selectFileResult) !== JSON.stringify(data)) {
  //     await invalidateCaseValidationQuery();
  //   }
  //   setSelectFileResult(data);
  //   if (mappedColumns) {
  //     if (!EpiUploadUtil.areMappedColumnsEqual(mappedColumns, EpiUploadUtil.getInitialMappedColumns(data.completeCaseType, data.rawData, data.import_action))) {
  //       NotificationManager.instance.showNotification({
  //         message: t`Column mappings have been reset due to changes in the selected case type or file.`,
  //         severity: 'info',
  //         isLoading: false,
  //       });
  //       setMappedColumns(null);
  //     }
  //   }
  //   setActiveStep(EPI_UPLOAD_STEP.MAP_COLUMNS);
  // }, [invalidateCaseValidationQuery, mappedColumns, selectFileResult, t]);

  // const onEpiUploadMapColumnsProceed = useCallback(async (data: EpiUploadMappedColumn[]) => {
  //   if (JSON.stringify(mappedColumns) !== JSON.stringify(data)) {
  //     await invalidateCaseValidationQuery();
  //   }
  //   setMappedColumns(data);
  //   setActiveStep(findNext(EPI_UPLOAD_STEP.MAP_COLUMNS));
  // }, [findNext, invalidateCaseValidationQuery, mappedColumns]);

  // const onEpiUploadCreateCasesStartOver = useCallback(async () => {
  //   await QueryUtil.invalidateQueryKeys([validateQueryKey]);
  //   setSelectFileResult(null);
  //   setMappedColumns(null);
  //   setValidatedCases(null);
  //   setActiveStep(EPI_UPLOAD_STEP.SELECT_FILE);
  // }, [validateQueryKey]);

  // const onEpiUploadCreateCasesGoBack = useCallback(() => {
  //   setActiveStep(findPrevious(EPI_UPLOAD_STEP.CREATE_CASES));
  // }, [findPrevious]);

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
        {STEP_ORDER.map((step) => {
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
          <EpiUploadSelectFile />
        )}
        {activeStep === EPI_UPLOAD_STEP.MAP_COLUMNS && (
          <EpiUploadMapColumns />
        )}
        {activeStep === EPI_UPLOAD_STEP.VALIDATE && (
          <EpiUploadValidate />
        )}
        {activeStep === EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES && (
          <EpiUploadSelectSequenceFiles />
        )}
        {activeStep === EPI_UPLOAD_STEP.MAP_SEQUENCES && (
          <EpiUploadMapSequences />
        )}
        {activeStep === EPI_UPLOAD_STEP.CREATE_CASES && (
          <EpiUploadCreateCases />
        )}
      </Box>
    </Box>
  );
};
