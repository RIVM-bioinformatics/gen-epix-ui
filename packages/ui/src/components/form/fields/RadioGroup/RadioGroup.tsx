import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useId,
  useRef,
} from 'react';
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  RadioGroup as MuiRadioGroup,
  Radio,
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

import type { RadioButtonOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type RadioGroupProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean; // NOT USED YET
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly options: RadioButtonOption[];
  readonly required?: boolean;
  readonly row?: boolean;
  readonly warningMessage?: boolean | string;
};

export const RadioGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  name,
  onChange: onChangeProp,
  options,
  required,
  row,
  warningMessage,
}: RadioGroupProps<TFieldValues, TName>): ReactElement => {
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onMuiRadioGroupChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: ChangeEvent<unknown>, value: string) => {
      if (onChangeProp) {
        onChangeProp(value as TFieldValues[TName]);
      }
      onChange(value);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    return (
      <MuiRadioGroup
        aria-labelledby={id}
        onBlur={onBlur}
        onChange={onMuiRadioGroupChange(onChange)}
        row={row}
        value={value as string}
      >
        { options.map((option, index) => {
          return (
            <FormControlLabel
              key={option.value.toString()}
              {...TestIdUtil.createAttributes('RadioGroup-option', { code: option.value.toString(), description: option.label })}
              control={(
                <Radio
                  slotProps={{
                    input: {
                      ref: index === 0 ? inputRef : undefined,
                    },
                  }}
                />
              )}
              disabled={disabled}
              label={option.label}
              value={option.value}
            />
          );
        })}
      </MuiRadioGroup>
    );
  }, [id, onMuiRadioGroupChange, row, options, disabled]);

  return (
    <FormControl
      error={hasError}
      {...TestIdUtil.createAttributes('RadioGroup', { label, name: name as string })}
      fullWidth
    >
      <FormLabel
        component={'legend'}
        id={id}
        required={required}
      >
        {label}
      </FormLabel>
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
