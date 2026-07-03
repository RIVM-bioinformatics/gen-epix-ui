import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import {
  use,
  useMemo,
} from 'react';
import {
  Container,
  useTheme,
} from '@mui/material';
import { useStore } from 'zustand';
import { Stepper } from '@gen-epix/ui';
import type { Step } from '@gen-epix/ui';

import { UploadStoreContext } from '../../../stores/uploadStore';
import { UPLOAD_STEP } from '../../../models/caseDb';

import { UploadSelectFile } from './UploadSelectFile';
import { UploadMapColumns } from './UploadMapColumns';
import { UploadPreview } from './UploadPreview';
import { UploadCreateCases } from './UploadCreateCases';
import { UploadSelectSequenceFiles } from './UploadSelectSequenceFiles';
import { UploadMapSequences } from './UploadMapSequences';

export const Upload = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const store = use(UploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const activeStep = useStore(store, (state) => state.activeStep);
  const stepOrder = useStore(store, (state) => state.stepOrder);

  const stepLabels = useMemo<Record<UPLOAD_STEP, string>>(() => {
    return {
      [UPLOAD_STEP.CREATE_CASES]: t`Submit`,
      [UPLOAD_STEP.MAP_COLUMNS]: t`Map columns`,
      [UPLOAD_STEP.MAP_SEQUENCES]: t`Map sequences`,
      [UPLOAD_STEP.PREVIEW]: t`Preview`,
      [UPLOAD_STEP.SELECT_FILE]: t`Select file`,
      [UPLOAD_STEP.SELECT_SEQUENCE_FILES]: t`Select sequence files`,
    };
  }, [t]);

  const optionalSteps = useMemo<UPLOAD_STEP[]>(() => {
    return [
      UPLOAD_STEP.SELECT_SEQUENCE_FILES,
      UPLOAD_STEP.MAP_SEQUENCES,
    ];
  }, []);

  const steps = useMemo<Step[]>(() => {
    return stepOrder.map((step) => ({
      key: String(step),
      label: stepLabels[step],
      optional: optionalSteps.includes(step),
    }));
  }, [optionalSteps, stepLabels, stepOrder]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        height: '100%',
        position: 'relative',
        width: '100%',
      }}
    >
      <Container>
        <Stepper
          activeStep={String(activeStep)}
          steps={steps}
          sx={{
            marginY: 2,
          }}
        />
      </Container>
      <Box
        sx={{
          height: `calc(100% - ${theme.spacing(4)})`,
          marginBottom: 2,
          marginTop: 2,
          position: 'relative',
        }}
      >
        {activeStep === UPLOAD_STEP.SELECT_FILE && (
          <UploadSelectFile />
        )}
        {activeStep === UPLOAD_STEP.MAP_COLUMNS && (
          <UploadMapColumns />
        )}
        {activeStep === UPLOAD_STEP.PREVIEW && (
          <UploadPreview
            caseTypeId={completeCaseType.id}
          />
        )}
        {activeStep === UPLOAD_STEP.SELECT_SEQUENCE_FILES && (
          <UploadSelectSequenceFiles />
        )}
        {activeStep === UPLOAD_STEP.MAP_SEQUENCES && (
          <UploadMapSequences />
        )}
        {activeStep === UPLOAD_STEP.CREATE_CASES && (
          <UploadCreateCases />
        )}
      </Box>
    </Box>
  );
};
