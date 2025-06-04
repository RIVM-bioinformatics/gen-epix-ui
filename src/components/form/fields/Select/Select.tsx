import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  Select as MuiSelect,
  FormControl,
  FormHelperText,
  MenuItem,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type {
  UseControllerReturn,
  FieldValues,
  ControllerRenderProps,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';

import type {
  FormFieldBaseProps,
  SelectOption,
} from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


type Value = string | number | boolean;

export interface SelectProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean | undefined> extends FormFieldBaseProps<TFieldValues, TName, string> {
  readonly groupValues?: boolean;
  readonly options: SelectOption[];
  readonly multiple?: TMultiple;
  readonly loading?: boolean;
}

export const Select = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean | undefined = false>({
  disabled = false,
  groupValues = false,
  label,
  loading = false,
  name,
  onChange: onChangeProp,
  options,
  required = false,
  warningMessage,
  multiple,
}: SelectProps<TFieldValues, TName, TMultiple>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;

  if (groupValues) {
    throw Error('groupValues is currently not supported');
  }

  if (multiple) {
    throw Error('multiple is currently not supported');
  }

  const mappedOptions = useMemo<Map<Value, SelectOption>>(() => {
    const mapped = new Map<Value, SelectOption>();
    options.forEach(option => {
      mapped.set(option.value, option);
    });
    return mapped;
  }, [options]);

  const getIsOptionDisabled = useCallback((value: SelectOption['value']): boolean => mappedOptions.get(value)?.disabled, [mappedOptions]);
  const getOptionLabel = useCallback((value: SelectOption['value']) => mappedOptions.get(value)?.label, [mappedOptions]);

  const onMuiSelectChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: SelectChangeEvent<string>) => {
      if (onChangeProp) {
        onChangeProp(event.target.value as TFieldValues[TName]);
      }
      onChange(event.target.value);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    return (
      <FormControl
        {...TestIdUtil.createAttributes('Select', { label, name: name as string })}
        fullWidth
      >
        <InputLabel
          className={classnames({ 'Mui-warning': hasWarning })}
          htmlFor={id}
          required={required && !disabled}
        >
          {label}
        </InputLabel>
        <MuiSelect<TFieldValues[TName]>
          disabled={disabled || loading}
          id={id}
          inputProps={{
            className: classnames({
              'Mui-warning': hasWarning,
            }),
          }}
          label={label}
          multiple={multiple}
          onBlur={onBlur}
          onChange={onMuiSelectChange(onChange)}
          renderValue={getOptionLabel}
          required={required}
          value={value ?? ''}
        >
          { options.map((option) => {
            return (
              <MenuItem
                disabled={getIsOptionDisabled(option.value)}
                key={option.value.toString()}
                value={option.value as string}
              >
                {option.label}
              </MenuItem>
            );
          })}
        </MuiSelect>
        <FormHelperText
          className={classnames({ 'Mui-warning': hasWarning })}
          sx={{ ml: 0 }}
        >
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
        { loading && <FormFieldLoadingIndicator />}
      </FormControl>
    );
  }, [disabled, errorMessage, getIsOptionDisabled, getOptionLabel, hasWarning, id, label, loading, multiple, name, onMuiSelectChange, options, required, warningMessage]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />
  );
};
