import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  FieldValues,
  UseControllerReturn,
  PathValue,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import {
  isValid,
  parseISO,
  subMonths,
} from 'date-fns';
import {
  enUS,
  sv,
} from 'date-fns/locale';
import isEqual from 'lodash/isEqual';

import type { FormFieldBaseProps } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


export interface DateRangePickerProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName, [Date, Date]> {
  readonly loading?: boolean;
  readonly minDate?: Date;
  readonly maxDate?: Date;
}

export const DateRangePicker = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  warningMessage,
  minDate,
  maxDate,
}: DateRangePickerProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const id = useId();
  const [t] = useTranslation();

  const defaultFromDate = useMemo(() => {
    const now = new Date();
    return subMonths(now, 3);
  }, []);

  const customLocale = useMemo<Locale>(() => {
    /**
     * Use everything from enUS, but format dates the Swedish way (ISO 8601)
     */
    return {
      ...enUS,
      formatLong: sv.formatLong,
    };
  }, []);

  const outerValue = useWatch({ control, name }) as [Date, Date];

  console.log('DateRangePicker outerValue', outerValue);

  const handleChange = useCallback((onChange: (value: [Date, Date]) => void, value: [Date, Date]) => {
    if (isEqual(value, outerValue)) {
      return;
    }
    console.log('DateRangePicker handleChange', value);
    onChange(value);
    if (onChangeProp) {
      onChangeProp(value);
    }
  }, [onChangeProp, outerValue]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        leftInputRef?.current?.focus();
      },
    });

    const leftValue = (value as [Date, Date])[0];
    const rightValue = (value as [Date, Date])[1];

    const onLeftValueChange = (newLeftValue: Date) => {
      console.log('DateRangePicker onLeftValueChange', newLeftValue, rightValue);
      handleChange(onChange, [newLeftValue, rightValue]);
    };

    const onRightValueChange = (newRightValue: Date) => {
      console.log('DateRangePicker onRightValueChange', leftValue, newRightValue);
      handleChange(onChange, [leftValue, newRightValue]);
    };

    const onLeftBlur = () => {
      const leftInputValue = parseISO(leftInputRef.current.value);

      if (!isValid(leftInputValue)) {
        handleChange(onChange, [null, rightValue]);
      } else if (leftInputValue < minDate) {
        handleChange(onChange, [minDate, rightValue]);
      } else if (leftInputValue > maxDate) {
        handleChange(onChange, [maxDate, maxDate]);
      } else if (rightValue && leftInputValue > rightValue) {
        handleChange(onChange, [rightValue, leftInputValue]);
      } else {
        handleChange(onChange, [leftInputValue, rightValue]);
      }
      onBlur();
    };

    const onRightBlur = () => {
      const rightInputValue = parseISO(rightInputRef.current.value);

      if (!isValid(rightInputValue)) {
        handleChange(onChange, [leftValue, null]);
      } else if (rightInputValue > maxDate) {
        handleChange(onChange, [leftValue, maxDate]);
      } else if (rightInputValue < minDate) {
        handleChange(onChange, [minDate, minDate]);
      } else if (leftValue && rightInputValue < leftValue) {
        handleChange(onChange, [rightInputValue, leftValue]);
      } else {
        handleChange(onChange, [leftValue, rightInputValue]);
      }
      onBlur();
    };

    const onResetButtonClick = () => {
      onChange([null, null]);
    };

    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('DateRangePicker', { label, name: name as string })}
        fullWidth
        sx={{
          'legend button': {
            display: 'none',
          },
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
        }}
      >
        <FormLabel
          component={'legend'}
          disabled={disabled || loading}
          id={id}
          required={required}
        >
          {label}
          <IconButton
            {...TestIdUtil.createAttributes('DateRangePicker-reset')}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={onResetButtonClick}
            sx={{
              position: 'absolute',
              top: '-10px',
              '& svg': {
                fontSize: '16px',
              },
            }}
            tabIndex={-1}
          >
            <ClearIcon />
          </IconButton>
        </FormLabel>
        <LocalizationProvider
          adapterLocale={customLocale}
          dateAdapter={AdapterDateFns}
        >
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing(1),
          }}
          >
            <MuiDatePicker
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={leftInputRef}
              label={t`From`}
              loading={loading}
              maxDate={rightValue ? new Date(Math.min.apply(null, [maxDate, rightValue] as unknown as number[])) : maxDate}
              minDate={minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onAccept={onLeftValueChange}
              referenceDate={defaultFromDate}
              slotProps={{
                textField: {
                  className: classNames({ 'Mui-warning': hasWarning }),
                  onBlur: onLeftBlur,
                  error: hasError,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  InputLabelProps: {
                    ...TestIdUtil.createAttributes('DateRangePicker-from-input'),
                    required,
                  },
                },
              }}
              value={leftValue ?? null}
            />
            <MuiDatePicker
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={rightInputRef}
              label={t`To`}
              loading={loading}
              maxDate={maxDate}
              minDate={leftValue ? new Date(Math.max.apply(null, [minDate, leftValue] as unknown as number[])) : minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onAccept={onRightValueChange}
              referenceDate={maxDate}
              slotProps={{
                textField: {
                  className: classNames({ 'Mui-warning': hasWarning }),
                  onBlur: onRightBlur,
                  error: hasError,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  InputLabelProps: {
                    ...TestIdUtil.createAttributes('DateRangePicker-to-input'),
                    required,
                  },
                },
              }}
              value={rightValue ?? null}
            />
          </Box>
        </LocalizationProvider>
        { loading && <FormFieldLoadingIndicator />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [disabled, errorMessage, hasError, hasWarning, id, label, loading, maxDate, minDate, name, handleChange, required, t, theme, warningMessage, defaultFromDate, customLocale]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />

  );
};
