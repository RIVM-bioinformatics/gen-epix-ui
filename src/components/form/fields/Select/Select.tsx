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
  ListItemText,
  Checkbox,
  OutlinedInput,
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

import type { SelectOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

type Value = string | number | boolean;

export type SelectProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly options: SelectOption[];
  readonly multiple?: TMultiple;
  readonly loading?: boolean;
};

export const Select = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean = false>({
  disabled = false,
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
  const labelId = useId();

  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;

  const mappedOptions = useMemo<Map<Value, SelectOption>>(() => {
    const mapped = new Map<Value, SelectOption>();
    options.forEach(option => {
      mapped.set(option.value, option);
    });
    return mapped;
  }, [options]);

  const getIsOptionDisabled = useCallback((value: SelectOption['value']): boolean => mappedOptions.get(value)?.disabled, [mappedOptions]);
  const renderValue = useCallback((value: string | string []) => {
    const values = Array.isArray(value) ? value : [value];
    return values.map(v => mappedOptions.get(v)?.label).join(', ');
  }, [mappedOptions]);

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
          error={hasError}
          className={classnames({ 'Mui-warning': hasWarning })}
          required={required && !disabled}
          id={labelId}
          htmlFor={id}
        >
          {label}
        </InputLabel>
        <MuiSelect<TFieldValues[TName]>
          error={hasError}
          disabled={disabled || loading}
          // variant={'outlined'}
          id={id}
          labelId={labelId}
          input={(
            <OutlinedInput
              label={label}
            />
          )}
          inputProps={{
            required: required && !disabled,
            className: classnames({
              'Mui-warning': hasWarning,
            }),
          }}
          multiple={multiple}
          renderValue={renderValue}
          required={required}
          value={value ?? ''}
          onBlur={onBlur}
          onChange={onMuiSelectChange(onChange)}
        >
          { options.map((option) => {
            return (
              <MenuItem
                key={option.value.toString()}
                disabled={getIsOptionDisabled(option.value)}
                value={option.value as string}
              >

                {multiple && (
                  <Checkbox
                    checked={(value as string[]).includes(option.value as string)}
                  />
                )}
                <ListItemText primary={option.label} />
              </MenuItem>
            );
          })}
        </MuiSelect>
        <FormHelperText
          className={classnames({ 'Mui-warning': hasWarning })}
          sx={{ ml: 0 }}
        >
          <FormFieldHelperText
            noIndent
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        </FormHelperText>
        { loading && <FormFieldLoadingIndicator />}
      </FormControl>
    );
  }, [label, name, hasWarning, required, disabled, labelId, hasError, loading, id, multiple, renderValue, onMuiSelectChange, options, errorMessage, warningMessage, getIsOptionDisabled]);

  return (
    <>
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
    </>
  );
};
