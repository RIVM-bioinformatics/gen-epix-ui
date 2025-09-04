import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import {
  useCallback,
  useState,
} from 'react';

import { EpiUploadSelectFile } from './EpiUploadSelectFile';


export const EpiUpload = () => {
  const [t] = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [t`Select file`, t`Map data`, t`Upload`];

  const onNextButtonClick = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  }, []);

  const onPreviousButtonClick = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const onResetButtonClick = useCallback(() => {
    setActiveStep(0);
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'max-content max-content auto max-content',
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
        <Typography
          marginY={1}
          variant={'h4'}
        >
          {activeStep === steps.length ? t`All steps completed - you're finished` : t('Step {{activeStep}}', { activeStep: activeStep + 1 })}
        </Typography>
      </Box>

      <Box>
        {activeStep === 0 && (
          <EpiUploadSelectFile />
        )}
      </Box>

      <Box>
        {activeStep === steps.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={onResetButtonClick}>{t`Reset`}</Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'row', paddingTop: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={onPreviousButtonClick}
              sx={{ mr: 1 }}
            >
              {t`Back`}
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={onNextButtonClick}>
              {activeStep === steps.length - 1 ? t`Finish` : t`Next`}
            </Button>
          </Box>
        )}
      </Box>

    </Box>
  );
};
