import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Slider,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';
import isNumber from 'lodash/isNumber';
import isFinite from 'lodash/isFinite';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type NumberRangeInputProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly max: number;
  readonly min: number;
  readonly name: TName;
  readonly onChange?: (value: number | number[]) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const NumberRangeInput = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  loading = false,
  max,
  min,
  name,
  onChange: onChangeProp,
  required = false,
  warningMessage = '',
}: NumberRangeInputProps<TFieldValues, TName>): ReactElement => {
  const shouldShowSlider = isFinite(min) && isFinite(max);
  const theme = useTheme();

  const { t } = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const outerValue = useWatch({ control, name }) as number[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((newValue: number[], onChange: (...event: any[]) => void) => {
    if (isEqual(outerValue, newValue)) {
      return;
    }
    if (onChangeProp) {
      onChangeProp(newValue);
    }
    onChange(newValue);
  }, [onChangeProp, outerValue]);

  const onMuiRangeSliderChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: Event, newValue: number | number[]) => {
      handleChange(newValue as number[], onChange);
    }
  , [handleChange]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const leftValue = (value as [number, number])?.[0];
    const rightValue = (value as [number, number])?.[1];

    const onLeftValueChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        handleChange([null, rightValue], onChange);
      } else if (isFinite(+event.target.value)) {
        handleChange([+event.target.value, rightValue], onChange);
      }
    };
    const onRightValueChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.value === '') {
        handleChange([leftValue, null], onChange);
      } else if (isFinite(+event.target.value)) {
        handleChange([leftValue, +event.target.value], onChange);
      }
    };

    const onLeftValueBlur = () => {
      if (leftValue === null || !isFinite(leftValue)) {
        handleChange([null, rightValue], onChange);
      } else if (leftValue < min) {
        handleChange([min, rightValue], onChange);
      } else if (leftValue > max) {
        handleChange([max, max], onChange);
      } else if (isNumber(rightValue) && leftValue > rightValue) {
        handleChange([rightValue, leftValue], onChange);
      }

      onBlur();
    };
    const onRightValueBlur = () => {
      if (rightValue === null || !isFinite(rightValue)) {
        handleChange([leftValue, null], onChange);
      } else if (rightValue > max) {
        handleChange([leftValue, max], onChange);
      } else if (rightValue < min) {
        handleChange([min, min], onChange);
      } else if (isNumber(leftValue) && rightValue < leftValue) {
        handleChange([rightValue, leftValue], onChange);
      }

      onBlur();
    };

    const onResetButtonClick = () => {
      handleChange([null, null], onChange);
    };

    return (
      <Box
        {...TestIdUtil.createAttributes('RangeSlider', { label, name: name as string })}
        sx={{
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
          'legend button': {
            display: 'none',
          },
        }}
      >
        { !loading && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'max-content auto max-content',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                marginTop: 4,
                width: theme.spacing(shouldShowSlider ? 6 : 16),
              }}
            >
              <Input
                fullWidth
                inputProps={{
                  ...TestIdUtil.createAttributes('RangeSlider-from-input'),
                  'aria-labelledby': id,
                  name: `${name}-from}`,
                  variant: 'outlined',
                }}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onBlur={onLeftValueBlur}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onChange={onLeftValueChange}
                placeholder={t`From`}
                size={'small'}
                value={leftValue ?? ''}
              />
            </Box>
            <FormControl
              error={hasError}
              fullWidth
              sx={{
                position: 'initial',
              }}
            >
              <FormLabel
                component={'legend'}
                disabled={disabled || loading}
                id={id}
                required={required}
                sx={{
                  left: 0,
                  position: 'absolute',
                }}
              >
                {label}
                {!disabled && (
                  <IconButton
                    {...TestIdUtil.createAttributes('RangeSlider-reset')}
                    aria-label={t`Clear number range`}
                    // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                    onClick={onResetButtonClick}
                    sx={{
                      '& svg': {
                        fontSize: '16px',
                      },
                      position: 'absolute',
                      top: '-10px',
                    }}
                    tabIndex={-1}
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </FormLabel>
              <Box
                sx={{
                  marginTop: 4,
                  marginX: 3,
                }}
              >
                {shouldShowSlider && (
                  <Slider
                    color={'primary'}
                    max={max}
                    min={min}
                    onBlur={onBlur}
                    onChange={onMuiRangeSliderChange(onChange)}
                    slotProps={{
                      input: {
                        'aria-label': t`Value`,
                      },
                    }}
                    value={value as [number, number]}
                    valueLabelDisplay={'off'}
                  />
                )}
              </Box>
            </FormControl>
            <Box
              sx={{
                marginTop: 4,
                width: theme.spacing(shouldShowSlider ? 6 : 16),
              }}
            >
              <Input
                fullWidth
                inputProps={{
                  ...TestIdUtil.createAttributes('RangeSlider-to-input'),
                  'aria-labelledby': id,
                  name: `${name}-to}`,
                  variant: 'outlined',
                }}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onBlur={onRightValueBlur}
                // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                onChange={onRightValueChange}
                placeholder={t`To`}
                size={'small'}
                value={rightValue ?? ''}
              />
            </Box>
          </Box>
        )}
        { !!loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </Box>
    );
  }, [disabled, errorMessage, handleChange, hasError, id, label, loading, max, min, name, onMuiRangeSliderChange, required, shouldShowSlider, t, warningMessage, theme]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />
  );
};
