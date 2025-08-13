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
  FormLabel,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import type {
  UseControllerReturn,
  FieldValues,
  Path,
  ControllerRenderProps,
} from 'react-hook-form';

import type { RadioButtonOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';

export type RadioGroupProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly row?: boolean;
  readonly options: RadioButtonOption[];
};

export const RadioGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  name,
  options,
  required,
  row,
  warningMessage,
  onChange: onChangeProp,
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

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
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
              {...TestIdUtil.createAttributes('RadioGroup-option', { code: option.value.toString(), description: option.label })}
              control={<Radio inputRef={index === 0 ? inputRef : undefined} />}
              disabled={disabled}
              key={option.value.toString()}
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
