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


export const EpiUpload = () => {
  const [t] = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [t`Select file`, t`Define settings`, t`Map data`, t`Upload`];
  const [rawData, setRawData] = useState<string[][] | null>(null);

  const onFileChange = useCallback((data: string[][]) => {
    setRawData(data);
  }, []);

  useEffect(() => {
    if (rawData) {
      setActiveStep(1);
    }
  }, [rawData]);

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
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box>
        {activeStep === 0 && (
          <EpiUploadSelectFile onFileChange={onFileChange} />
        )}
      </Box>
    </Box>
  );
};
