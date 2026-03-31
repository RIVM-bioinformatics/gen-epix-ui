import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
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
  FormHelperText,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  Path,
} from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { NumberUtil } from '../../../../utils/NumberUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type NumberFieldProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: number) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly autocomplete?: string;
  readonly step?: number;
  readonly min?: number;
  readonly max?: number;
  readonly showSlider?: boolean;
};

const MAX_NUMBER_OF_SLIDER_STEPS = 250;

export const NumberField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
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
}: NumberFieldProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const { formState: { errors }, register, subscribe } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState<number>(null);
  const [externalValue, setExternalValue] = useState<number>(null);
  const formControlRef = useRef<HTMLDivElement>(null);

  const updateInputValue = useCallback((value: number) => {
    if (inputRef.current) {
      inputRef.current.value = (value ?? '').toString().replace('.', ',');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe({
      formState: {
        values: true,
      },
      name,
      callback: ({ values, name: changedName }) => {
        if (changedName !== name) {
          return;
        }
        setInternalValue(values[name]);
        setExternalValue(values[name]);
        updateInputValue(values[name]);
      },
    });
    return () => {
      unsubscribe();
    };
  }, [name, subscribe, updateInputValue]);

  const registration = useMemo(() => register(name), [name, register]);

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

  const emitValue = useCallback(async (parsedValue: number) => {
    let newValue: number;

    if (isNaN(parsedValue)) {
      newValue = null;
    } else {
      newValue = parsedValue;
    }

    updateInputValue(newValue);

    if (newValue !== externalValue) {
      await registration.onChange({
        target: {
          value: newValue,
          name,
        },
      });
      if (onChangeProp) {
        onChangeProp(newValue);
      }
    }
  }, [externalValue, name, onChangeProp, registration, updateInputValue]);

  const onResetButtonClick = useCallback(async () => {
    await emitValue(null);
  }, [emitValue]);


  const onMuiTextFieldBlur = useCallback(async () => {
    const parsedValue = NumberUtil.parse(inputRef.current.value);

    await emitValue(parsedValue);
    await registration.onBlur({
      target: {
        value: parsedValue,
        name,
      },
      type: 'blur',
    });
  }, [emitValue, name, registration]);

  const onMuiSliderBlur = useCallback(async () => {
    const parsedValue = NumberUtil.parse(inputRef.current.value);

    await emitValue(parsedValue);
    await registration.onBlur({
      target: {
        value: parsedValue,
        name,
      },
      type: 'blur',
    });
  }, [emitValue, name, registration]);

  const onMuiRangeSliderChange = useCallback((_event: unknown, sliderValue: number | number[]) => {
    const value = Array.isArray(sliderValue) ? sliderValue[0] : sliderValue;
    updateInputValue(value);
    setInternalValue(value);
  }, [updateInputValue]);

  let sliderValue = NumberUtil.parse(internalValue);
  if (isNaN(sliderValue)) {
    sliderValue = null;
  } else if (sliderValue < min) {
    sliderValue = min;
  } else if (sliderValue > max) {
    sliderValue = max;
  }

  const textField = useMemo(() => (
    <MuiTextField
      disabled={disabled || loading}
      error={hasError}
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
                aria-label={t`Clear text field`}
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
      defaultValue={internalValue}
      onBlur={onMuiTextFieldBlur}
    />
  ), [autocomplete, disabled, hasError, hasWarning, internalValue, label, loading, name, onMuiTextFieldBlur, onResetButtonClick, placeholder, required, t]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('NumberField', { label, name: name as string })}
      ref={formControlRef}
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
      {!shouldShowSlider && textField}
      {shouldShowSlider && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: theme => `${theme.spacing(24)} auto`,
            alignItems: 'center',
          }}
        >
          {textField}
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
            onBlur={onMuiSliderBlur}
            onChange={onMuiRangeSliderChange}
          />
        </Box>
      )}
      { !!loading && <FormFieldLoadingIndicator />}
      <FormHelperText>
        <FormFieldHelperText
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
      </FormHelperText>
    </FormControl>
  );
};
