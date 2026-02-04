import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import {
  useContext,
  useMemo,
} from 'react';
import {
  Container,
  Typography,
  useTheme,
} from '@mui/material';
import { useStore } from 'zustand';

import {
  EpiUploadStoreContext,
  STEP_ORDER,
} from '../../../stores/epiUploadStore';
import { EPI_UPLOAD_STEP } from '../../../models/epi';

import EpiUploadSelectFile from './EpiUploadSelectFile';
import { EpiUploadMapColumns } from './EpiUploadMapColumns';
import { EpiUploadValidate } from './EpiUploadValidate';
import { EpiUploadCreateCases } from './EpiUploadCreateCases';
import { EpiUploadSelectSequenceFiles } from './EpiUploadSelectSequenceFiles';
import { EpiUploadMapSequences } from './EpiUploadMapSequences';

export const EpiUpload = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const activeStep = useStore(store, (state) => state.activeStep);

  const steps = useMemo(() => {
    return {
      [EPI_UPLOAD_STEP.SELECT_FILE]: {
        label: t`Select file`,
        optional: false,
      },
      [EPI_UPLOAD_STEP.MAP_COLUMNS]: {
        label: t`Map columns`,
        optional: false,
      },
      [EPI_UPLOAD_STEP.VALIDATE]: {
        label: t`Validate`,
        optional: false,
      },
      [EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES]: {
        label: t`Select sequence files`,
        optional: true,
      },
      [EPI_UPLOAD_STEP.MAP_SEQUENCES]: {
        label: t`Map sequences`,
        optional: true,
      },
      [EPI_UPLOAD_STEP.CREATE_CASES]: {
        label: t`Upload`,
        optional: false,
      },
    } satisfies Record<EPI_UPLOAD_STEP, { label: string; optional: boolean }>;
  }, [t]);

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
      <Container>
        <Stepper activeStep={activeStep}>
          {STEP_ORDER.map((step) => {
            const stepProps: { completed?: boolean } = {};
            const labelProps: {
              optional?: ReactNode;
            } = {};
            if (activeStep > step) {
              stepProps.completed = true;
            }
            if (steps[step].optional) {
              labelProps.optional = (
                <Typography variant={'caption'}>
                  {'Optional'}
                </Typography>
              );
            }
            return (
              <Step
                key={step}
                {...stepProps}
              >
                <StepLabel {...labelProps}>
                  {steps[step].label}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Container>
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
