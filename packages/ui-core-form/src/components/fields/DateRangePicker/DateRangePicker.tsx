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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';

import { FormUtil } from '../../../utils/FormUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


export type DateRangePickerProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly dateFormat: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  readonly disabled?: boolean;
  readonly infoMessage?: string;
  readonly label: string;
  readonly loading?: boolean;
  readonly maxDate?: Date;
  readonly minDate?: Date;
  readonly name: TName;
  readonly onChange?: ((value: [Date, Date]) => void) | ((value: [Date | null, Date | null]) => void);
  readonly required?: boolean;
  readonly warningMessage?: string;
};

type DateRangeValue = [Date | null, Date | null];

const getFromPickerMaxDate = (maxDate: Date | undefined, toValue: Date | null): Date | null => {
  return toValue && maxDate ? new Date(Math.min(maxDate.getTime(), toValue.getTime())) : toValue ?? maxDate;
};

const getToPickerMinDate = (minDate: Date | undefined, fromValue: Date | null): Date | null => {
  return fromValue && minDate ? new Date(Math.max(minDate.getTime(), fromValue.getTime())) : fromValue ?? minDate;
};

const getRangeAfterFromBlur = (fromInputValue: Date | null, toValue: Date | null, minDate: Date | undefined, maxDate: Date | undefined): DateRangeValue => {
  if (!isValid(fromInputValue)) {
    return [null, toValue];
  }
  if (fromInputValue < minDate) {
    return [minDate, toValue];
  }
  if (fromInputValue > maxDate) {
    return [maxDate, maxDate];
  }
  if (toValue && fromInputValue > toValue) {
    return [toValue, fromInputValue];
  }
  return [fromInputValue, toValue];
};

const getRangeAfterToBlur = (toInputValue: Date | null, fromValue: Date | null, minDate: Date | undefined, maxDate: Date | undefined): DateRangeValue => {
  if (!isValid(toInputValue)) {
    return [fromValue, null];
  }
  if (toInputValue > maxDate) {
    return [fromValue, maxDate];
  }
  if (toInputValue < minDate) {
    return [minDate, minDate];
  }
  if (fromValue && toInputValue < fromValue) {
    return [toInputValue, fromValue];
  }
  return [fromValue, toInputValue];
};

const getDateRangePickerViews = (dateFormat: DateRangePickerProps<FieldValues>['dateFormat']): MuiDateTimePickerProps['views'] => {
  switch (dateFormat) {
    case DATE_FORMAT.DATE:
    case DATE_FORMAT.DATE_TIME:
      return undefined;
    case DATE_FORMAT.YEAR:
      return ['year'];
    case DATE_FORMAT.YEAR_MONTH:
      return ['year', 'month'];
    default:
      throw new Error(`Unsupported date format: ${String(dateFormat)}`);
  }
};

const sanitizeDateRangeValue = (value: DateRangeValue, dateFormat: DateRangePickerProps<FieldValues>['dateFormat']): DateRangeValue => {
  const sanitizedValue: DateRangeValue = [null, null];
  // The views switch rejects runtime-invalid formats before this function can run.
  // eslint-disable-next-line default-case
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
  }
  return sanitizedValue;
};

const parseDateInputValue = (inputValue: string, dateFormat: DateRangePickerProps<FieldValues>['dateFormat']): Date | null => {
  if (!inputValue) {
    return null;
  }
  return dateFormat === DATE_FORMAT.YEAR_MONTH
    ? parse(inputValue, 'MMMM yyyy', new Date())
    : parseISO(inputValue);
};

export const DateRangePicker = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  dateFormat = DATE_FORMAT.DATE,
  disabled = false,
  infoMessage,
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
  const isFieldDisabled = disabled || loading;
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const id = useId();
  const { t } = useTranslation();

  const defaultFromDate = useMemo(() => {
    const now = new Date();
    return subMonths(now, 3);
  }, []);

  const views = useMemo<MuiDateTimePickerProps['views']>(() => getDateRangePickerViews(dateFormat), [dateFormat]);

  const customLocale = useMemo<Locale>(() => {
    /**
     * Use everything from enUS, but format dates the Swedish way (ISO 8601)
     */
    return {
      ...enUS,
      formatLong: sv.formatLong,
    };
  }, []);

  const outerValue = useWatch({ control, name }) as DateRangeValue;

  const handleChange = useCallback((onChange: (value: DateRangeValue) => void, value: DateRangeValue) => {
    const sanitizedValue = sanitizeDateRangeValue(value, dateFormat);
    if (isEqual(sanitizedValue, outerValue)) {
      return;
    }
    onChange(sanitizedValue);
    if (onChangeProp) {
      (onChangeProp)(sanitizedValue);
    }
  }, [dateFormat, onChangeProp, outerValue]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        fromInputRef?.current?.focus();
      },
    });

    const [fromValue, toValue] = value as DateRangeValue;

    const onFromValueChange = (newFromValue: Date | null) => {
      handleChange(onChange, [newFromValue, toValue]);
    };

    const onToValueChange = (newToValue: Date | null) => {
      handleChange(onChange, [fromValue, newToValue]);
    };

    const onFromBlur = () => {
      const fromInputValue = parseDateInputValue(fromInputRef.current.value, dateFormat);
      handleChange(onChange, getRangeAfterFromBlur(fromInputValue, toValue, minDate, maxDate));
      onBlur();
    };

    const onToBlur = () => {
      const toInputValue = parseDateInputValue(toInputRef.current.value, dateFormat);
      handleChange(onChange, getRangeAfterToBlur(toInputValue, fromValue, minDate, maxDate));
      onBlur();
    };

    const onResetButtonClick = () => {
      onChange([null, null]);
    };

    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('DateRangePicker', { label, name })}
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
          disabled={isFieldDisabled}
          id={id}
          required={required}
          sx={{
            marginBottom: theme.spacing(1),
          }}
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
              disabled={isFieldDisabled}
              disableFuture
              inputRef={fromInputRef}
              label={t`From`}
              loading={loading}
              maxDate={getFromPickerMaxDate(maxDate, toValue)}
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
              disabled={isFieldDisabled}
              disableFuture
              inputRef={toInputRef}
              label={t`To`}
              loading={loading}
              maxDate={maxDate}
              minDate={getToPickerMinDate(minDate, fromValue)}
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
        {!!loading && <FormFieldLoadingIndicator />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            infoMessage={infoMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, infoMessage, label, name, disabled, loading, isFieldDisabled, id, required, customLocale, theme, t, maxDate, minDate, defaultFromDate, hasWarning, views, errorMessage, warningMessage, handleChange, dateFormat]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />

  );
};
