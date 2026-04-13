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
  Path,
  PathValue,
  UseControllerReturn,
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
import type {
  DatePickerProps as MuiDatePickerProps,
  DateTimePickerProps as MuiDateTimePickerProps,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import {
  isValid,
  lastDayOfMonth,
  parse,
  parseISO,
  set,
  subMonths,
} from 'date-fns';
import {
  enUS,
  sv,
} from 'date-fns/locale';
import isEqual from 'lodash/isEqual';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';
import { DATE_FORMAT } from '../../../../data/date';


export type DateRangePickerProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly maxDate?: Date;
  readonly minDate?: Date;
  readonly name: TName;
  readonly onChange?: (value: [Date, Date]) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const DateRangePicker = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  dateFormat = DATE_FORMAT.DATE,
  disabled = false,
  label,
  loading = false,
  maxDate,
  minDate,
  name,
  onChange: onChangeProp,
  required = false,
  warningMessage,
}: DateRangePickerProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const id = useId();
  const { t } = useTranslation();

  const defaultFromDate = useMemo(() => {
    const now = new Date();
    return subMonths(now, 3);
  }, []);

  const views = useMemo<MuiDateTimePickerProps['views']>(() => {
    switch (dateFormat) {
      case DATE_FORMAT.DATE:
      case DATE_FORMAT.DATE_TIME:
        return undefined;
      case DATE_FORMAT.YEAR:
        return ['year'];
      case DATE_FORMAT.YEAR_MONTH:
        return ['year', 'month'];
      default:
        throw new Error(`Unsupported date format: ${dateFormat}`);
    }
  }, [dateFormat]);

  const sanitizeValue = useCallback((value: [Date, Date]): [Date, Date] => {
    const sanitizedValue: [Date, Date] = [null, null];
    switch (dateFormat) {
      case DATE_FORMAT.DATE:
        sanitizedValue[0] = value[0] ? set(value[0], { hours: 0, milliseconds: 0, minutes: 0, seconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { hours: 23, milliseconds: 999, minutes: 59, seconds: 59 }) : null;
        break;
      case DATE_FORMAT.DATE_TIME:
        sanitizedValue[0] = value[0] ? set(value[0], { milliseconds: 0, seconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { milliseconds: 999, seconds: 59 }) : null;
        break;
      case DATE_FORMAT.YEAR:
        sanitizedValue[0] = value[0] ? set(value[0], { date: 1, hours: 0, milliseconds: 0, minutes: 0, month: 0, seconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { date: 31, hours: 23, milliseconds: 999, minutes: 59, month: 11, seconds: 59 }) : null;
        break;
      case DATE_FORMAT.YEAR_MONTH:
        sanitizedValue[0] = value[0] ? set(value[0], { date: 1, hours: 0, milliseconds: 0, minutes: 0, seconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(lastDayOfMonth(value[1]), { hours: 23, milliseconds: 999, minutes: 59, seconds: 59 }) : null;
        break;
      default:
        throw new Error(`Unsupported date format: ${dateFormat}`);
    }
    return sanitizedValue;
  }, [dateFormat]);

  const inputValueToDate = useCallback((inputValue: string): Date | null => {
    if (!inputValue) {
      return null;
    }
    return dateFormat === DATE_FORMAT.YEAR_MONTH
      ? parse(inputValue, 'MMMM yyyy', new Date())
      : parseISO(inputValue);
  }, [dateFormat]);

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

  const handleChange = useCallback((onChange: (value: [Date, Date]) => void, value: [Date, Date]) => {
    const sanitizedValue = sanitizeValue(value);
    if (isEqual(sanitizedValue, outerValue)) {
      return;
    }
    onChange(sanitizedValue);
    if (onChangeProp) {
      onChangeProp(sanitizedValue);
    }
  }, [onChangeProp, outerValue, sanitizeValue]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        fromInputRef?.current?.focus();
      },
    });

    const fromValue = (value as [Date, Date])[0];
    const toValue = (value as [Date, Date])[1];

    const onFromValueChange = (newFromValue: Date) => {
      handleChange(onChange, [newFromValue, toValue]);
    };

    const onToValueChange = (newToValue: Date) => {
      handleChange(onChange, [fromValue, newToValue]);
    };

    const onFromBlur = () => {
      const fromInputValue = inputValueToDate(fromInputRef.current.value);

      if (!isValid(fromInputValue)) {
        handleChange(onChange, [null, toValue]);
      } else if (fromInputValue < minDate) {
        handleChange(onChange, [minDate, toValue]);
      } else if (fromInputValue > maxDate) {
        handleChange(onChange, [maxDate, maxDate]);
      } else if (toValue && fromInputValue > toValue) {
        handleChange(onChange, [toValue, fromInputValue]);
      } else {
        handleChange(onChange, [fromInputValue, toValue]);
      }
      onBlur();
    };

    const onToBlur = () => {
      const toInputValue = inputValueToDate(toInputRef.current.value);

      if (!isValid(toInputValue)) {
        handleChange(onChange, [fromValue, null]);
      } else if (toInputValue > maxDate) {
        handleChange(onChange, [fromValue, maxDate]);
      } else if (toInputValue < minDate) {
        handleChange(onChange, [minDate, minDate]);
      } else if (fromValue && toInputValue < fromValue) {
        handleChange(onChange, [toInputValue, fromValue]);
      } else {
        handleChange(onChange, [fromValue, toInputValue]);
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
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
          'legend button': {
            display: 'none',
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
          {!disabled && (
            <IconButton
              {...TestIdUtil.createAttributes('DateRangePicker-reset')}
              aria-label={t`Clear date range`}
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
        <LocalizationProvider
          adapterLocale={customLocale}
          dateAdapter={AdapterDateFns}
        >
          <Box
            sx={{
              display: 'grid',
              gap: theme.spacing(1),
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            <MuiDatePicker
              disabled={disabled || loading}
              disableFuture
              inputRef={fromInputRef}
              label={t`From`}
              loading={loading}
              maxDate={toValue ? new Date(Math.min.apply(null, [maxDate, toValue] as unknown as number[])) : maxDate}
              minDate={minDate}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onChange={onFromValueChange}
              referenceDate={defaultFromDate}
              slotProps={{
                textField: {
                  className: classNames({ 'Mui-warning': hasWarning }),
                  error: hasError,
                  onBlur: onFromBlur,
                  slotProps: {
                    inputLabel: {
                      ...TestIdUtil.createAttributes('DateRangePicker-from-input'),
                      required,
                    },
                  },
                  variant: 'outlined',
                },
              }}
              value={fromValue ?? null}
              views={views as MuiDatePickerProps['views']}
            />
            <MuiDatePicker
              disabled={disabled || loading}
              disableFuture
              inputRef={toInputRef}
              label={t`To`}
              loading={loading}
              maxDate={maxDate}
              minDate={fromValue ? new Date(Math.max.apply(null, [minDate, fromValue] as unknown as number[])) : minDate}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onChange={onToValueChange}
              referenceDate={maxDate}
              slotProps={{
                textField: {
                  className: classNames({ 'Mui-warning': hasWarning }),
                  error: hasError,
                  onBlur: onToBlur,
                  slotProps: {
                    inputLabel: {
                      ...TestIdUtil.createAttributes('DateRangePicker-to-input'),
                      required,
                    },
                  },
                  variant: 'outlined',
                },
              }}
              value={toValue ?? null}
              views={views as MuiDatePickerProps['views']}
            />
          </Box>
        </LocalizationProvider>
        { !!loading && <FormFieldLoadingIndicator />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, label, name, disabled, loading, id, required, customLocale, theme, t, maxDate, minDate, defaultFromDate, hasWarning, views, errorMessage, warningMessage, handleChange, inputValueToDate]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />

  );
};
