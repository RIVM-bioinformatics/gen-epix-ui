import type { BoxProps } from '@mui/material';
import {
  Box,
  StepIcon,
  Typography,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useCallback } from 'react';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { visuallyHidden } from '@mui/utils';

import { TestIdUtil } from '../../../utils/TestIdUtil';

import { STEPPER_DIRECTION } from './stepperModel';

export type Step = {
  content?: ReactNode;
  index?: string;
  key: string;
  label: string;
  optional?: boolean;
};

export type StepperProps = {
  readonly activeStep: string;
  readonly direction?: STEPPER_DIRECTION;
  readonly hideCompletedIndicator?: boolean;
  readonly steps: Step[];
} & BoxProps;

// NOTE: This Stepper component is an alternative for the MUI Stepper component, because it is more accessibility friendly

export const Stepper = ({ activeStep, direction = STEPPER_DIRECTION.HORIZONTAL, hideCompletedIndicator = false, steps, ...boxProps }: StepperProps) => {
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
  }, [activeStep]);

  return (
    <Box
      {...TestIdUtil.createAttributes('Stepper', { 'active-step': activeStep })}
      {...omit(boxProps, ['sx'])}
      role={'presentation'}
      sx={{
        position: 'relative',
        ...boxProps.sx,
      }}
    >
      <Box
        component={'ol'}
        sx={direction === STEPPER_DIRECTION.HORIZONTAL ? {
          alignItems: 'center',
          bottom: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          justifyContent: 'space-between',
          left: 0,
          margin: 0,
          padding: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        } : {
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          justifyContent: 'space-between',
          margin: 0,
          padding: 0,
          position: 'relative',
        }}
      >
        {steps.map((step, index) => (
          <Box
            aria-current={isActiveStep(step.key) ? 'step' : undefined}
            component={'li'}
            key={step.key}
            sx={{
              alignItems: direction === STEPPER_DIRECTION.HORIZONTAL ? 'center' : 'flex-start',
              background: theme.palette.background.default,
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              paddingLeft: direction === STEPPER_DIRECTION.VERTICAL || isFirstStep(step.key) ? 0 : 2,
              paddingRight: direction === STEPPER_DIRECTION.VERTICAL || isLastStep(step.key) ? 0 : 2,
              position: 'relative',
              zIndex: 2,
            }}
          >
            <Box>
              <StepIcon
                active={isActiveStep(step.key)}
                aria-hidden={'true'}
                completed={hideCompletedIndicator ? false : isCompletedStep(step.key)}
                icon={step.index ?? index + 1}
              />
            </Box>
            {direction === STEPPER_DIRECTION.VERTICAL && (
              <Box
                role={'presentation'}
                sx={{
                  background: isLastStep(step.key) ? theme.palette.background.default : theme.palette.divider,
                  height: '100%',
                  marginLeft: theme.spacing(1.5),
                  position: 'absolute',
                  top: theme.spacing(1.5),
                  width: '1px',
                  zIndex: -1,
                }}
              />
            )}
            <Box>
              {isActiveStep(step.key) && (
                <Typography
                  component={'span'}
                  sx={visuallyHidden}
                >
                  {t`Current: `}
                </Typography>
              )}
              {isCompletedStep(step.key) && (
                <Typography
                  component={'span'}
                  sx={visuallyHidden}
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
                  color={'text.secondary'}
                  component={'span'}
                  sx={{
                    display: 'block',
                  }}
                  variant={'caption'}
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
