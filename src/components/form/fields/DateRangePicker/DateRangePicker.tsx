import type { ReactElement } from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
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
import type {
  DateTimePickerProps as MuiDateTimePickerProps,
  DatePickerProps as MuiDatePickerProps,
} from '@mui/x-date-pickers';
import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  DateTimePicker as MuiDateTimePicker,
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
import { WindowManager } from '../../../../classes/managers/WindowManager';


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
  const [key, setKey] = useState(0);

  useEffect(() => {
    // There is a bug in MuiDatePicker and MuiDateTimePicker where the pickers don't work correctly in a controlled state (having a value prop).
    // The workaround is to use the pickers in an uncontrolled state. But then the problem is that the defaultValue is not set correctly on the first render.
    // The default value is always [null, null] on first render. Updating the key prop of the Controller will force a re-render and set the default value correctly.
    const setKeyTimeout = WindowManager.instance.window.setTimeout(() => {
      setKey(1);
    }, 0);
    return () => {
      WindowManager.instance.window.clearTimeout(setKeyTimeout);
    };
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

  const MuiComponent = useMemo(() => dateFormat === DATE_FORMAT.DATE_TIME ? MuiDateTimePicker : MuiDatePicker, [dateFormat]);

  const referenceDate = useMemo(() => {
    return new Date();
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

  const sanitizeValue = useCallback((value: [Date, Date]): [Date, Date] => {
    const sanitizedValue: [Date, Date] = [value[0], value[1]];
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
        sanitizedValue[1] = value[1] ? lastDayOfMonth(set(value[1], { date: 1, hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })) : null;
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

  const handleChange = useCallback((onChange: (value: [Date, Date]) => void, shouldReRender: boolean, focusTo: boolean, value: [Date, Date]) => {
    const sanitizedValue = sanitizeValue(value);

    if (isEqual(sanitizedValue, outerValue)) {
      return;
    }
    onChange(sanitizedValue);
    if (onChangeProp) {
      onChangeProp(sanitizedValue);
    }
    if (shouldReRender) {
      setKey(prevKey => prevKey + 1); // Force re-render
    }
    if (focusTo) {
      // Focus the "to" input after the change. Must be done in a timeout to ensure the input is (re-)rendered before focusing.
      setTimeout(() => {
        toInputRef.current?.focus();
      }, 0);
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

    const onFromValueAccept = (newFromValue: Date) => {
      handleChange(onChange, false, false, [newFromValue, toValue]);
    };

    const onToValueAccept = (newToValue: Date) => {
      handleChange(onChange, false, false, [fromValue, newToValue]);
    };

    const onFromBlur = () => {
      const fromInputValue = inputValueToDate(fromInputRef.current.value);
      let newValue: [Date, Date] = [null, null];

      if (!isValid(fromInputValue)) {
        newValue = [null, toValue];
      } else if (fromInputValue < minDate) {
        newValue = [minDate, toValue];
      } else if (fromInputValue > maxDate) {
        newValue = [maxDate, maxDate];
      } else if (toValue && fromInputValue > toValue) {
        newValue = [toValue, fromInputValue];
      } else {
        newValue = [fromInputValue, toValue];
      }

      handleChange(onChange, fromInputValue !== newValue[0], fromInputValue !== newValue[0], newValue);
      onBlur();
    };

    const onToBlur = () => {
      const toInputValue = inputValueToDate(toInputRef.current.value);
      let newValue: [Date, Date] = [null, null];

      if (!isValid(toInputValue)) {
        newValue = [fromValue, null];
      } else if (toInputValue > maxDate) {
        newValue = [fromValue, maxDate];
      } else if (toInputValue < minDate) {
        newValue = [minDate, minDate];
      } else if (fromValue && toInputValue < fromValue) {
        newValue = [toInputValue, fromValue];
      } else {
        newValue = [fromValue, toInputValue];
      }

      handleChange(onChange, toInputValue !== newValue[1], false, newValue);
      onBlur();
    };

    const onResetButtonClick = () => {
      onChange([null, null]);
      setKey(prevKey => prevKey + 1); // Force re-render
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
            <MuiComponent
              defaultValue={fromValue}
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={fromInputRef}
              label={t`From`}
              loading={loading}
              maxDate={maxDate}
              minDate={minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onAccept={onFromValueAccept}
              openTo={dateFormat === DATE_FORMAT.DATE_TIME ? undefined : 'year'}
              referenceDate={referenceDate}
              slotProps={{
                field: { clearable: true },
                textField: {
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
              views={views as MuiDateTimePickerProps['views'] & MuiDatePickerProps['views']}
            />
            <MuiComponent
              defaultValue={toValue}
              disableFuture
              disabled={disabled || loading}
              enableAccessibleFieldDOMStructure={false}
              inputRef={toInputRef}
              label={t`To`}
              loading={loading}
              maxDate={maxDate}
              minDate={minDate}
              // eslint-disable-next-line react/jsx-no-bind
              onAccept={onToValueAccept}
              openTo={dateFormat === DATE_FORMAT.DATE_TIME ? undefined : 'year'}
              referenceDate={referenceDate}
              slotProps={{
                field: { clearable: true },
                textField: {
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
              views={views as MuiDateTimePickerProps['views'] & MuiDatePickerProps['views']}
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
  }, [hasError, label, name, disabled, loading, id, required, customLocale, theme, MuiComponent, t, maxDate, minDate, dateFormat, referenceDate, hasWarning, views, errorMessage, warningMessage, handleChange, inputValueToDate]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      key={key} // Force re-render on mount
      name={name}
      render={renderController}
    />

  );
};
