import type {
  ReactElement,
  SyntheticEvent,
} from 'react';
import {
  useCallback,
  useRef,
} from 'react';
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch as MuiSwitch,
} from '@mui/material';
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

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type SwitchPropsProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: boolean) => void;
  readonly required?: boolean;
  readonly warningMessage?: boolean | string;
};

export const Switch = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  loading = false,
  name,
  onChange: onChangeProp,
  warningMessage,
}: SwitchPropsProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;

  const onMuiSwitchChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: SyntheticEvent, checked: boolean) => {
      if (onChangeProp) {
        onChangeProp(checked);
      }
      onChange(checked);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    return (
      <FormControl
        {...TestIdUtil.createAttributes('Select', { label, name })}
        fullWidth
      >
        <FormControlLabel
          control={(
            <MuiSwitch
              checked={!!value}
              color={'primary'}
              slotProps={{
                input: {
                  ref: inputRef,
                },
              }}
            />
          )}
          disabled={disabled}
          label={label}
          onBlur={onBlur}
          onChange={onMuiSwitchChange(onChange)}
        />
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
        { !!loading && <FormFieldLoadingIndicator />}
      </FormControl>

    );
  }, [disabled, errorMessage, hasWarning, label, loading, name, onMuiSwitchChange, warningMessage]);

  return (

    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />

  );
};
