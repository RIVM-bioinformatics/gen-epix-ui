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
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormHelperText,
  FormGroup,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
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

import type { CheckboxOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


type CheckBoxGroupValue = Array<string | number>;

export type CheckboxGroupProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: CheckBoxGroupValue) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly row?: boolean;
  readonly options: CheckboxOption[];
  readonly loading?: boolean;
};

export const CheckboxGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  name,
  options,
  required,
  row,
  loading,
  warningMessage,
  onChange: onChangeProp,
}: CheckboxGroupProps<TFieldValues, TName>): ReactElement => {
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onMuiCheckboxChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange'], itemValue: string | number, currentValue: CheckBoxGroupValue) =>
    (_event: ChangeEvent<unknown>, checked: boolean) => {
      const newValue = currentValue.filter(x => x !== itemValue);
      if (checked) {
        newValue.push(itemValue);
      }

      if (onChangeProp) {
        onChangeProp(newValue as TFieldValues[TName]);
      }
      onChange(newValue);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange([]);
    };
    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('CheckboxGroup', { label, name: name as string })}
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
          {!disabled && (
            <IconButton
              {...TestIdUtil.createAttributes('DateRangePicker-reset')}
              sx={{
                position: 'absolute',
                top: '-10px',
                '& svg': {
                  fontSize: '16px',
                },
              }}
              tabIndex={-1}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={onResetButtonClick}
            >
              <ClearIcon />
            </IconButton>
          )}
        </FormLabel>
        { !loading && (
          <FormGroup
            aria-labelledby={id}
            row={row}
            onBlur={onBlur}
          >
            { options.map((option, index) => {
              return (
                <FormControlLabel
                  {...TestIdUtil.createAttributes('CheckboxGroup-option', { value: option.value.toString(), label: option.label })}
                  key={option.value.toString()}
                  checked={(value as CheckBoxGroupValue)?.includes(option.value)}
                  control={(
                    <MuiCheckbox
                      inputRef={index === 0 ? inputRef : undefined}
                      sx={{
                        padding: '0 9px',
                      }}
                    />
                  )}
                  disabled={loading || disabled}
                  label={option.label}
                  onChange={onMuiCheckboxChange(onChange, option.value, value)}
                />
              );
            })}
          </FormGroup>
        )}
        { loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            noIndent
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, label, name, disabled, loading, id, required, row, options, errorMessage, warningMessage, onMuiCheckboxChange]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />

  );
};
