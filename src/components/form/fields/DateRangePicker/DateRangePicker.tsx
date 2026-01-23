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
import type {
  DateTimePickerProps as MuiDateTimePickerProps,
  DatePickerProps as MuiDatePickerProps,
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
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: [Date, Date]) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly loading?: boolean;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
};

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
  dateFormat = DATE_FORMAT.DATE,
}: DateRangePickerProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const id = useId();
  const [t] = useTranslation();

  const defaultFromDate = useMemo(() => {
    const now = new Date();
    return subMonths(now, 3);
  }, []);

  const views = useMemo<MuiDateTimePickerProps['views']>(() => {
    switch (dateFormat) {
      case DATE_FORMAT.DATE:
      case DATE_FORMAT.DATE_TIME:
        return undefined;
      case DATE_FORMAT.YEAR_MONTH:
        return ['year', 'month'];
      case DATE_FORMAT.YEAR:
        return ['year'];
      default:
        throw new Error(`Unsupported date format: ${dateFormat}`);
    }
  }, [dateFormat]);

  const sanitizeValue = useCallback((value: [Date, Date]): [Date, Date] => {
    const sanitizedValue: [Date, Date] = [null, null];
    switch (dateFormat) {
      case DATE_FORMAT.DATE:
        sanitizedValue[0] = value[0] ? set(value[0], { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }) : null;
        break;
      case DATE_FORMAT.DATE_TIME:
        sanitizedValue[0] = value[0] ? set(value[0], { seconds: 0, milliseconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { seconds: 59, milliseconds: 999 }) : null;
        break;
      case DATE_FORMAT.YEAR_MONTH:
        sanitizedValue[0] = value[0] ? set(value[0], { date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(lastDayOfMonth(value[1]), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }) : null;
        break;
      case DATE_FORMAT.YEAR:
        sanitizedValue[0] = value[0] ? set(value[0], { month: 0, date: 1, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) : null;
        sanitizedValue[1] = value[1] ? set(value[1], { month: 11, date: 31, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }) : null;
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

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
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
          {!disabled && (
            <IconButton
              {...TestIdUtil.createAttributes('DateRangePicker-reset')}
              sx={{
                position: 'absolute',
                top: '-10px',
                '& svg': {
                  fontSize: '16px',
                },
              }}
              tabIndex={-1}
              aria-label={t`Clear date range`}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={onResetButtonClick}
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
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing(1),
            }}
          >
            <MuiDatePicker
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={fromInputRef}
              label={t`From`}
              loading={loading}
              maxDate={toValue ? new Date(Math.min.apply(null, [maxDate, toValue] as unknown as number[])) : maxDate}
              referenceDate={defaultFromDate}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  className: classNames({ 'Mui-warning': hasWarning }),
                  onBlur: onFromBlur,
                  error: hasError,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  InputLabelProps: {
                    ...TestIdUtil.createAttributes('DateRangePicker-from-input'),
                    required,
                  },
                },
              }}
              value={fromValue ?? null}
              views={views as MuiDatePickerProps['views']}
              minDate={minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={onFromValueChange}
            />
            <MuiDatePicker
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={toInputRef}
              label={t`To`}
              loading={loading}
              maxDate={maxDate}
              referenceDate={maxDate}
              slotProps={{
                textField: {
                  variant: 'outlined',
                  className: classNames({ 'Mui-warning': hasWarning }),
                  onBlur: onToBlur,
                  error: hasError,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  InputLabelProps: {
                    ...TestIdUtil.createAttributes('DateRangePicker-to-input'),
                    required,
                  },
                },
              }}
              value={toValue ?? null}
              views={views as MuiDatePickerProps['views']}
              minDate={fromValue ? new Date(Math.max.apply(null, [minDate, fromValue] as unknown as number[])) : minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onChange={onToValueChange}
            />
          </Box>
        </LocalizationProvider>
        { loading && <FormFieldLoadingIndicator />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            noIndent
            errorMessage={errorMessage}
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
