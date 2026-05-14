import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  FormControl,
  FormHelperText,
} from '@mui/material';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  PathValue,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  DatePickerProps as MuiDatePickerProps,
  DateTimePickerProps as MuiDateTimePickerProps,
} from '@mui/x-date-pickers';
import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  DateTimePicker as MuiDateTimePicker,
} from '@mui/x-date-pickers';
import classNames from 'classnames';
import type { Locale } from 'date-fns';
import {
  enUS,
  sv,
} from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';
import { DATE_FORMAT } from '../../../../data/date';


export type DatePickerProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly dateFormat?: typeof DATE_FORMAT[keyof typeof DATE_FORMAT];
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: Date) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const DatePicker = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  dateFormat = DATE_FORMAT.DATE,
  disabled = false,
  label,
  loading = false,
  name,
  onChange: onChangeProp,
  required = false,
  warningMessage,
}: DatePickerProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);

  const onMuiDatePickerChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (newValue: Date) => {
      if (onChangeProp) {
        onChangeProp(newValue);
      }
      onChange(newValue);
    }
  , [onChangeProp]);

  const customLocale = useMemo<Locale>(() => {
    /**
     * Use everything from enUS, but format dates the Swedish way (ISO 8601)
     */
    return {
      ...enUS,
      formatLong: sv.formatLong,
    };
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

  const MuiComponent = dateFormat === DATE_FORMAT.DATE_TIME ? MuiDateTimePicker : MuiDatePicker;

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    return (
      <FormControl
        {...TestIdUtil.createAttributes('DatePicker', { label, name })}
        fullWidth
      >
        <LocalizationProvider
          adapterLocale={customLocale}
          dateAdapter={AdapterDateFns}
        >
          <MuiComponent
            disabled={disabled || loading}
            inputRef={inputRef}
            label={label}
            loading={loading}
            onChange={onMuiDatePickerChange(onChange)}
            openTo={dateFormat === DATE_FORMAT.DATE_TIME ? undefined : 'year'}
            slotProps={{
              textField: {
                className: classNames({ 'Mui-warning': hasWarning }),
                error: hasError,
                onBlur,
                slotProps: {
                  inputLabel: {
                    required,
                  },
                },
                variant: 'outlined',
              },
            }}
            value={value}
            views={views as MuiDatePickerProps['views']}
          />
        </LocalizationProvider>
        { !!loading && <FormFieldLoadingIndicator /> }
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [MuiComponent, customLocale, dateFormat, disabled, errorMessage, hasError, hasWarning, label, loading, name, onMuiDatePickerChange, required, views, warningMessage]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />
  );
};
