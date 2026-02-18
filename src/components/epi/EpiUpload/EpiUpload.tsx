import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import {
  useContext,
  useMemo,
} from 'react';
import {
  Container,
  useTheme,
} from '@mui/material';
import { useStore } from 'zustand';

import {
  EpiUploadStoreContext,
  STEP_ORDER,
} from '../../../stores/epiUploadStore';
import { EPI_UPLOAD_STEP } from '../../../models/epi';
import type { Step } from '../../ui/Stepper';
import { Stepper } from '../../ui/Stepper';

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

  const stepLabels = useMemo<Record<EPI_UPLOAD_STEP, string>>(() => {
    return {
      [EPI_UPLOAD_STEP.SELECT_FILE]: t`Select file`,
      [EPI_UPLOAD_STEP.MAP_COLUMNS]: t`Map columns`,
      [EPI_UPLOAD_STEP.VALIDATE]: t`Validate`,
      [EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES]: t`Select sequence files`,
      [EPI_UPLOAD_STEP.MAP_SEQUENCES]: t`Map sequences`,
      [EPI_UPLOAD_STEP.CREATE_CASES]: t`Upload`,
    };
  }, [t]);

  const optionalSteps = useMemo<EPI_UPLOAD_STEP[]>(() => {
    return [
      EPI_UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      EPI_UPLOAD_STEP.MAP_SEQUENCES,
    ];
  }, []);

  const steps = useMemo<Step[]>(() => {
    return STEP_ORDER.map((step) => ({
      key: String(step),
      label: stepLabels[step],
      optional: optionalSteps.includes(step),
    }));
  }, [optionalSteps, stepLabels]);

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
        <Stepper
          steps={steps}
          activeStep={String(activeStep)}
          marginY={2}
        />
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
