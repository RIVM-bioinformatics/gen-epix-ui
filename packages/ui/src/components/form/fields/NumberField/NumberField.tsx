import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField as MuiTextField,
  Slider,
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
  readonly autocomplete?: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly max?: number;
  readonly min?: number;
  readonly name: TName;
  readonly onChange?: (value: number) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly showSlider?: boolean;
  readonly step?: number;
  readonly warningMessage?: boolean | string;
};

const MAX_NUMBER_OF_SLIDER_STEPS = 250;

export const NumberField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  autocomplete,
  disabled = false,
  label,
  loading = false,
  max,
  min,
  name,
  onChange: onChangeProp,
  placeholder,
  required = false,
  showSlider = false,
  step,
  warningMessage,
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
  const [hasInputValue, setHasInputValue] = useState(false);

  const updateInputValue = useCallback((value: number) => {
    if (inputRef.current) {
      const inputValue = (value ?? '').toString().replace('.', ',');
      inputRef.current.value = inputValue;
      setHasInputValue(!!inputValue);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe({
      callback: ({ name: changedName, values }) => {
        if (changedName !== name) {
          return;
        }
        setInternalValue(values[name]);
        setExternalValue(values[name]);
        updateInputValue(values[name]);
      },
      formState: {
        values: true,
      },
      name,
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
          name,
          value: newValue,
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
        name,
        value: parsedValue,
      },
      type: 'blur',
    });
  }, [emitValue, name, registration]);

  const onMuiSliderBlur = useCallback(async () => {
    const parsedValue = NumberUtil.parse(inputRef.current.value);

    await emitValue(parsedValue);
    await registration.onBlur({
      target: {
        name,
        value: parsedValue,
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
      defaultValue={internalValue ?? ''}
      disabled={disabled || loading}
      error={hasError}
      inputRef={inputRef}
      label={label}
      onBlur={onMuiTextFieldBlur}
      placeholder={placeholder}
      slotProps={{
        formHelperText: {
          className: classnames({ 'Mui-warning': hasWarning }),
        },
        input: {
          className: classnames({ 'Mui-warning': hasWarning }),
          endAdornment: disabled ? undefined : (
            <InputAdornment position={'end'}>
              <IconButton
                {...TestIdUtil.createAttributes('TextField-reset')}
                aria-label={t`Clear text field`}
                onClick={onResetButtonClick}
                sx={{
                  '& svg': {
                    fontSize: '16px',
                  },
                }}
                tabIndex={-1}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
          inputProps: {
            autoComplete: autocomplete ?? name,
          },
        },
        inputLabel: {
          className: classnames({ 'Mui-warning': hasWarning }),
          required: required && !disabled,
          shrink: hasInputValue,
        },
      }}
      variant={'outlined'}
    />
  ), [autocomplete, disabled, hasError, hasInputValue, hasWarning, internalValue, label, loading, name, onMuiTextFieldBlur, onResetButtonClick, placeholder, required, t]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('NumberField', { label, name: name as string })}
      fullWidth
      ref={formControlRef}
      sx={{
        '&:hover button, &:focus-within button': {
          display: 'initial',
        },
        button: {
          display: 'none',
        },
      }}
    >
      {!shouldShowSlider && textField}
      {shouldShowSlider && (
        <Box
          sx={{
            alignItems: 'center',
            display: 'grid',
            gap: 2,
            gridTemplateColumns: theme => `${theme.spacing(24)} auto`,
          }}
        >
          {textField}
          <Slider
            color={'primary'}
            marks
            max={max}
            min={min}
            onBlur={onMuiSliderBlur}
            onChange={onMuiRangeSliderChange}
            slotProps={{
              input: {
                'aria-label': t`Value`,
              },
            }}
            step={step}
            value={sliderValue}
            valueLabelDisplay={'auto'}
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
