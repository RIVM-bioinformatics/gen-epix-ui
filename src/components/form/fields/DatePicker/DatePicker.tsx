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
import {
  LocalizationProvider,
  DatePicker as MuiDatePicker,
  DateTimePicker as MuiDateTimePicker,
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import classNames from 'classnames';
import { type Locale } from 'date-fns';
import {
  enUS,
  sv,
} from 'date-fns/locale';

import type { FormFieldBaseProps } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


export interface DatePickerProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> extends FormFieldBaseProps<TFieldValues, TName, Date> {
  readonly loading?: boolean;
  readonly withTime?: boolean;
}

export const DatePicker = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  warningMessage,
  withTime = false,
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

  const MuiComponent = withTime ? MuiDateTimePicker : MuiDatePicker;

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    return (
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
          slotProps={{
            textField: {
              className: classNames({ 'Mui-warning': hasWarning }),
              onBlur,
              error: hasError,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              InputLabelProps: {
                required,
              },
            },
          }}
          value={value}
        />
      </LocalizationProvider>
    );
  }, [MuiComponent, customLocale, disabled, hasError, hasWarning, label, loading, onMuiDatePickerChange, required]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('DatePicker', { label, name: name as string })}
      fullWidth
    >
      <Controller
        control={control}
        defaultValue={'' as PathValue<TFieldValues, TName>}
        name={name}
        render={renderController}
      />
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
};
