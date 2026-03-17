import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  TextField as MuiTextField,
  FormControl,
  IconButton,
  InputAdornment,
  Box,
  Slider,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  ControllerRenderProps,
  UseControllerReturn,
  PathValue,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';
import isNumber from 'lodash/isNumber';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { NumberUtil } from '../../../../utils/NumberUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type NumberSliderProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: number) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly autocomplete?: string;
  readonly step: number;
  readonly min: number;
  readonly max: number;
  readonly showSlider?: boolean;
};

const MAX_NUMBER_OF_SLIDER_STEPS = 250;

export const NumberSlider = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  placeholder,
  warningMessage,
  autocomplete,
  step,
  min,
  max,
  showSlider = false,
}: NumberSliderProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<string>('');
  const [triggerValue, setTriggerValue] = useState(0);

  const shouldShowSlider = useMemo(() => {
    if (!showSlider) {
      return false;
    }
    if (!isFinite(min) || !isFinite(max) || !isFinite(step) || min >= max) {
      return false;
    }
    if ((max - min) / step > MAX_NUMBER_OF_SLIDER_STEPS) {
      return false;
    }
    return true;
  }, [showSlider, min, max, step]);

  const onMuiTextFieldChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      valueRef.current = value;

      const parsedValue = NumberUtil.parse(value);
      const newValue = isNaN(parsedValue) ? '' : parsedValue;

      onChange(newValue);
    }
  , []);

  const onMuiRangeSliderChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: unknown, sliderValue: number | number[]) => {
      const value = String(Array.isArray(sliderValue) ? sliderValue[0] : sliderValue);

      valueRef.current = String(value);

      const parsedValue = NumberUtil.parse(value);
      const newValue = isNaN(parsedValue) ? '' : parsedValue;

      onChange(newValue);
    }
  , []);

  const onMuiTextFieldBlur = useCallback((onBlur: ControllerRenderProps<TFieldValues, TName>['onBlur'], onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    () => {
      const value = isNumber(valueRef.current) ? valueRef.current : inputRef.current.value;
      const parsedValue = NumberUtil.parse(value);

      if (isNaN(parsedValue)) {
        valueRef.current = undefined;
        onChange(undefined);
        if (onChangeProp) {
          onChangeProp(undefined);
        }
      } else {
        valueRef.current = parsedValue.toString().replace('.', ','); // Update the input value to the parsed number with comma as decimal separator
        onChange(parsedValue);
        if (onChangeProp) {
          onChangeProp(parsedValue);
        }
      }
      setTriggerValue(prev => prev + 1); // Trigger re-render to update the displayed value based on the parsed number
      onBlur();
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      inputRef.current.value = '';
      onChange('');
    };

    let sliderValue = NumberUtil.parse(valueRef.current) ?? (value ?? null) as number;
    if (isNaN(sliderValue)) {
      sliderValue = null;
    } else if (sliderValue < min) {
      sliderValue = min;
    } else if (sliderValue > max) {
      sliderValue = max;
    }
    const inputValue = valueRef.current ?? (value ?? '') as string;

    const textField = (
      <MuiTextField
        data-trigger={triggerValue}
        disabled={disabled || loading}
        error={hasError}
        helperText={(
          <FormFieldHelperText
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        )}
        inputRef={inputRef}
        variant={'outlined'}
        label={label}
        placeholder={placeholder}
        slotProps={{
          formHelperText: {
            className: classnames({ 'Mui-warning': hasWarning }),
          },
          input: {
            inputProps: {
              autoComplete: autocomplete ?? name,
            },
            className: classnames({ 'Mui-warning': hasWarning }),
            endAdornment: disabled ? undefined : (
              <InputAdornment position={'end'}>
                <IconButton
                  {...TestIdUtil.createAttributes('TextField-reset')}
                  sx={{
                    '& svg': {
                      fontSize: '16px',
                    },
                  }}
                  tabIndex={-1}
                  aria-label={`Clear text field`}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={onResetButtonClick}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
          inputLabel: {
            required: required && !disabled,
            className: classnames({ 'Mui-warning': hasWarning }),
          },
        }}
        value={inputValue}
        onBlur={onMuiTextFieldBlur(onBlur, onChange)}
        onChange={onMuiTextFieldChange(onChange)}
      />
    );

    if (!shouldShowSlider) {
      return textField;
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: theme => `2fr ${theme.spacing(24)}`,
          alignItems: 'center',
        }}
      >
        <Slider
          marks
          valueLabelDisplay={'auto'}
          color={'primary'}
          max={max}
          min={min}
          step={step}
          slotProps={{
            input: {
              'aria-label': t`Value`,
            },
          }}
          value={sliderValue}
          onBlur={onBlur}
          onChange={onMuiRangeSliderChange(onChange)}
        />
        {textField}
      </Box>
    );
  }, [min, max, triggerValue, disabled, loading, hasError, errorMessage, warningMessage, label, placeholder, hasWarning, autocomplete, name, required, onMuiTextFieldBlur, onMuiTextFieldChange, shouldShowSlider, step, t, onMuiRangeSliderChange]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('NumberField', { label, name: name as string })}
      fullWidth
      sx={{
        button: {
          display: 'none',
        },
        '&:hover button, &:focus-within button': {
          display: 'initial',
        },
      }}
    >
      <Controller
        control={control}
        defaultValue={'' as PathValue<TFieldValues, TName>}
        name={name}
        render={renderController}
      />
      { !!loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
