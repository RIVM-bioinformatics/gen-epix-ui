import type { BoxProps } from '@mui/material';
import {
  Box,
  Divider,
  useTheme,
  StepIcon,
  Typography,
} from '@mui/material';
import { useCallback } from 'react';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { TestIdUtil } from '../../../utils/TestIdUtil';

export type Step = {
  key: string;
  label: string;
  optional?: boolean;
};

export type StepperProps = {
  readonly steps: Step[];
  readonly activeStep: string;
} & BoxProps;

export const Stepper = ({ steps, activeStep, ...boxProps }: StepperProps) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const isFirstStep = useCallback((key: string) => {
    return steps.findIndex((step) => step.key === key) === 0;
  }, [steps]);

  const isLastStep = useCallback((key: string) => {
    return steps.findIndex((step) => step.key === key) === steps.length - 1;
  }, [steps]);

  const isCompletedStep = useCallback((key: string) => {
    const activeStepIndex = steps.findIndex((step) => step.key === activeStep);
    const stepIndex = steps.findIndex((step) => step.key === key);
    return stepIndex < activeStepIndex;
  }, [activeStep, steps]);

  const isActiveStep = useCallback((key: string) => {
    return key === activeStep;
  } , [activeStep]);

  return (
    <Box
      {...TestIdUtil.createAttributes('Stepper', { activeStep })}
      {...omit(boxProps, ['sx'])}
      sx={{
        width: '100%',
        position: 'relative',
        ...boxProps.sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: 0,
        }}
        component={'ol'}
      >
        {steps.map((step, index) => (
          <Box
            key={step.key}
            component={'li'}
            sx={{
              background: theme.palette.background.default,
              paddingLeft: isFirstStep(step.key) ? 0 : 2,
              paddingRight: isLastStep(step.key) ? 0 : 2,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box>
              <StepIcon
                completed={isCompletedStep(step.key)}
                active={isActiveStep(step.key)}
                icon={index + 1}
              />
            </Box>
            <Box>
              {isActiveStep(step.key) && (
                <Typography
                  sx={visuallyHidden}
                  component={'span'}
                >
                  {t`Current: `}
                </Typography>
              )}
              {isCompletedStep(step.key) && (
                <Typography
                  sx={visuallyHidden}
                  component={'span'}
                >
                  {t`Completed: `}
                </Typography>
              )}
              <Typography
                component={'span'}
              >
                {step.label}
              </Typography>
              {step.optional && (
                <Typography
                  variant={'caption'}
                  color={'text.secondary'}
                  component={'span'}
                  sx={{
                    display: 'block',
                  }}
                >
                  {t`Optional`}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
      <Box>
        <Divider />
      </Box>
    </Box>
  );
};
