import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { EpiUploadSelectFile } from './EpiUploadSelectFile';
import type { EpiUploadSettingsFormFields } from './EpiUploadSettings';
import EpiUploadSettings from './EpiUploadSettings';


export const EpiUpload = () => {
  const [t] = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [t`Select file`, t`Define settings`, t`Map data`, t`Upload`];
  const [rawData, setRawData] = useState<string[][] | null>(null);
  const [formData, setFormData] = useState<EpiUploadSettingsFormFields | null>(null);

  const onFileChange = useCallback((data: string[][]) => {
    setRawData(data);
  }, []);

  const onEpiUploadSettingsBack = useCallback(() => {
    setActiveStep(0);
  }, []);

  const onEpiUploadSettingsProceed = useCallback((data: EpiUploadSettingsFormFields) => {
    setFormData(data);
  }, []);

  useEffect(() => {
    if (rawData) {
      setActiveStep(1);
    }
    if (formData) {
      setActiveStep(2);
    }
  }, [formData, rawData]);

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
          const labelProps: {
            optional?: ReactNode;
          } = {};
          return (
            <Step
              key={label}
              {...stepProps}
            >
              <StepLabel {...labelProps}>
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Box>
        {activeStep === 0 && (
          <EpiUploadSelectFile onFileChange={onFileChange} />
        )}
        {activeStep === 1 && (
          <Box marginY={2}>
            <EpiUploadSettings
              onBack={onEpiUploadSettingsBack}
              onProceed={onEpiUploadSettingsProceed}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};
