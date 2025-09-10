import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  EpiUploadMappedColumn,
  EpiUploadSelectFileResult,
} from '../../../models/epiUpload';
import { NotificationManager } from '../../../classes/managers/NotificationManager';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import EpiUploadSelectFile from './EpiUploadSelectFile';
import { EpiUploadDataPreview } from './EpiUploadDataPreview';
import { EpiUploadMapColumns } from './EpiUploadMapColumns';


export const EpiUpload = () => {
  const [t] = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [t`Select file`, t`Map columns`, t`Preview`, t`Validate`, t`Upload`];
  const [selectFileResult, setSelectFileResult] = useState<EpiUploadSelectFileResult | null>(null);
  const [mappedColumns, setMappedColumns] = useState<EpiUploadMappedColumn[] | null>(null);

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
  }, [mappedColumns, t]);

  const onEpiUploadMapColumnsProceed = useCallback((data: EpiUploadMappedColumn[]) => {
    setMappedColumns(data);
  }, []);

  const onEpiUploadMapColumnsGoBack = useCallback(() => {
    setActiveStep(0);
  }, []);

  const onEpiUploadDataPreviewGoBack = useCallback(() => {
    setActiveStep(1);
  }, []);

  const onEpiUploadDataPreviewProceed = useCallback(() => {
    setActiveStep(3);
  }, []);


  useEffect(() => {
    if (selectFileResult) {
      setActiveStep(1);
    }
    if (mappedColumns) {
      setActiveStep(2);
    }
  }, [selectFileResult, mappedColumns]);

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
        {steps.map((label) => {
          const stepProps: { completed?: boolean } = {};
          return (
            <Step
              key={label}
              {...stepProps}
            >
              <StepLabel>
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Box>
        {activeStep === 0 && (
          <Box marginY={2}>
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
          </Box>
        )}
        {activeStep === 1 && (
          <Box marginY={2}>
            <EpiUploadMapColumns
              mappedColumns={mappedColumns || undefined}
              completeCaseType={selectFileResult.completeCaseType}
              rawData={selectFileResult.rawData}
              importAction={selectFileResult.import_action}
              fileName={selectFileResult.file_list[0]?.name ?? 'unknown file'}
              onProceed={onEpiUploadMapColumnsProceed}
              onGoBack={onEpiUploadMapColumnsGoBack}
            />
          </Box>
        )}
        {activeStep === 2 && (
          <Box
            sx={{
              height: '100%',
              position: 'relative',
            }}
          >
            <EpiUploadDataPreview
              mappedColumns={mappedColumns}
              rawData={selectFileResult.rawData}
              onGoBack={onEpiUploadDataPreviewGoBack}
              onProceed={onEpiUploadDataPreviewProceed}
            />
          </Box>
        )}
        {activeStep === 3 && (
          <Box
            sx={{
              height: '100%',
              position: 'relative',
            }}
          >
            {'Upload step (not implemented)'}
          </Box>
        )}
      </Box>
    </Box>
  );
};
