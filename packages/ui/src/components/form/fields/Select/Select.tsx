import type { ReactElement } from 'react';
import {
  useCallback,
  useId,
  useMemo,
  useRef,
} from 'react';
import {
  Checkbox,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  Select as MuiSelect,
  OutlinedInput,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import type { SelectOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type SelectProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly multiple?: TMultiple;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly options: SelectOption[];
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

type Value = boolean | number | string;

export const Select = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean = false>({
  disabled = false,
  label,
  loading = false,
  multiple,
  name,
  onChange: onChangeProp,
  options,
  required = false,
  warningMessage,
}: SelectProps<TFieldValues, TName, TMultiple>): ReactElement => {
  const { t } = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const labelId = useId();
  const helperTextId = useId();

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
        onChangeProp(event.target.value);
      }
      onChange(event.target.value);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    const onResetButtonClick = () => {
      onMuiSelectChange(onChange)({ target: { value: multiple ? [] : '' } } as SelectChangeEvent<string>);
    };

    return (
      <>
        <InputLabel
          className={classnames({ 'Mui-warning': hasWarning })}
          error={hasError}
          htmlFor={id}
          id={labelId}
          required={required && !disabled}
        >
          {label}
        </InputLabel>
        <MuiSelect<TFieldValues[TName]>
          disabled={disabled || loading}
          error={hasError}
          input={(
            <OutlinedInput
              endAdornment={disabled ? undefined : (
                <InputAdornment
                  position={'start'}
                  sx={{
                    position: 'absolute',
                    right: theme => theme.spacing(2),
                  }}
                >
                  <IconButton
                    {...TestIdUtil.createAttributes('TextField-reset')}
                    aria-label={t`Clear selection`}
                    // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
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
              )}
              label={label}
            />
          )}
          inputProps={{
            'aria-describedby': helperTextId,
            'aria-label': label,
            'aria-labelledby': labelId,
            className: classnames({
              'Mui-warning': hasWarning,
            }),
            id,
            ref: inputRef,
            required: required && !disabled,
          }}
          multiple={multiple}
          onBlur={onBlur}
          onChange={onMuiSelectChange(onChange)}
          renderValue={renderValue}
          required={required}
          value={value ?? (multiple ? [] : '') as TFieldValues[TName]}
        >
          { options.map((option) => {
            return (
              <MenuItem
                disabled={getIsOptionDisabled(option.value)}
                key={option.value.toString()}
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
          id={helperTextId}
          sx={{ ml: 0 }}
        >
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </>
    );
  }, [disabled, errorMessage, getIsOptionDisabled, t, hasError, hasWarning, helperTextId, id, label, labelId, loading, multiple, onMuiSelectChange, options, renderValue, required, warningMessage]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('Select', { label, name })}
      fullWidth
    >
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
      { !!loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
