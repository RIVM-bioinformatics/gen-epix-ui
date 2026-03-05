import type { BoxProps } from '@mui/material';
import {
  Box,
  useTheme,
  StepIcon,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { STEPPER_DIRECTION } from './stepperModel';

export type Step = {
  key: string;
  label: string;
  optional?: boolean;
  content?: ReactNode;
  index?: string;
};

export type StepperProps = {
  readonly steps: Step[];
  readonly activeStep: string;
  readonly direction?: STEPPER_DIRECTION;
  readonly hideCompletedIndicator?: boolean;
} & BoxProps;

// NOTE: This Stepper component is an alternative for the MUI Stepper component, because it is more accessibility friendly

export const Stepper = ({ steps, activeStep, direction = STEPPER_DIRECTION.HORIZONTAL, hideCompletedIndicator = false, ...boxProps }: StepperProps) => {
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
      {...TestIdUtil.createAttributes('Stepper', { 'active-step': activeStep })}
      {...omit(boxProps, ['sx'])}
      sx={{
        position: 'relative',
        ...boxProps.sx,
      }}
      role={'presentation'}
    >
      <Box
        sx={direction === STEPPER_DIRECTION.HORIZONTAL ? {
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
        } : {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          position: 'relative',
          padding: 0,
          margin: 0,
        }}
        component={'ol'}
      >
        {steps.map((step, index) => (
          <Box
            key={step.key}
            component={'li'}
            sx={{
              background: theme.palette.background.default,
              paddingLeft: direction === STEPPER_DIRECTION.VERTICAL || isFirstStep(step.key) ? 0 : 2,
              paddingRight: direction === STEPPER_DIRECTION.VERTICAL || isLastStep(step.key) ? 0 : 2,
              display: 'flex',
              flexDirection: 'row',
              alignItems: direction === STEPPER_DIRECTION.HORIZONTAL ? 'center' : 'flex-start',
              gap: 1,
              zIndex: 2,
              position: 'relative',
            }}
            aria-current={isActiveStep(step.key) ? 'step' : undefined}
          >
            <Box>
              <StepIcon
                completed={hideCompletedIndicator ? false : isCompletedStep(step.key)}
                active={isActiveStep(step.key)}
                icon={step.index ?? index + 1}
                aria-hidden={'true'}
              />
            </Box>
            {direction === STEPPER_DIRECTION.VERTICAL && (
              <Box
                role={'presentation'}
                sx={{
                  width: '1px',
                  height: '100%',
                  position: 'absolute',
                  background: isLastStep(step.key) ? theme.palette.background.default : theme.palette.divider,
                  marginLeft: theme.spacing(1.5),
                  top: theme.spacing(1.5),
                  zIndex: -1,
                }}
              />
            )}
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
                sx={{
                  fontWeight: isActiveStep(step.key) ? 'bold' : 'normal',
                }}
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
              {step.content && (
                <Box
                  sx={{
                    marginTop: 1,
                  }}
                >
                  {step.content}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
      {direction === STEPPER_DIRECTION.HORIZONTAL && (
        <Box
          role={'presentation'}
          sx={{
            background: theme.palette.divider,
            height: '1px',
            width: '100%',
          }}
        />
      )}
    </Box>
  );
};
