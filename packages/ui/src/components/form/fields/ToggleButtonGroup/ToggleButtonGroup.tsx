import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useRef,
} from 'react';
import {
  FormControl,
  FormHelperText,
  ToggleButtonGroup as MuiToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  UseControllerReturn,
} from 'react-hook-form';

import type { ToggleButtonOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type ToggleButtonProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly options: ToggleButtonOption[];
  readonly required?: boolean;
  readonly row?: boolean;
  readonly warningMessage?: boolean | string;
};

export const ToggleButtonGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  name,
  onChange: onChangeProp,
  options,
  required,
  warningMessage,
}: ToggleButtonProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onMuiToggleButtonChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: ChangeEvent<unknown>, value: string) => {
      if (required && value === null) {
        return;
      }
      if (onChangeProp) {
        onChangeProp(value);
      }
      onChange(value);
    }
  , [onChangeProp, required]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    return (
      <MuiToggleButtonGroup
        color={'primary'}
        exclusive
        onBlur={onBlur}
        onChange={onMuiToggleButtonChange(onChange)}
        value={value}
      >
        { options.map((option) => {
          return (
            <ToggleButton
              key={option.value.toString()}
              {...TestIdUtil.createAttributes('ToggleButton-option', { code: option.value.toString(), description: option.label })}
              disabled={disabled}
              value={option.value}
            >
              {option.label}
            </ToggleButton>
          );
        })}
      </MuiToggleButtonGroup>
    );
  }, [onMuiToggleButtonChange, options, disabled]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('ToggleButtonGroup', { name })}
      fullWidth
    >
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
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
