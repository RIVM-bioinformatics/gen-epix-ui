import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  TextField as MuiTextField,
  FormControl,
  IconButton,
  InputAdornment,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
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
import classnames from 'classnames';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { NumberUtil } from '../../../../utils/NumberUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type NumberFieldProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: number) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly autocomplete?: string;
};

export const NumberField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  placeholder,
  warningMessage,
  autocomplete,
}: NumberFieldProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<string>('');
  const [triggerValue, setTriggerValue] = useState(0);

  const onMuiTextFieldChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      valueRef.current = value;
      onChange(NumberUtil.parse(value));
    }
  , []);

  const onMuiTextFieldBlur = useCallback((onBlur: ControllerRenderProps<TFieldValues, TName>['onBlur'], onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    () => {
      console.log('blurring with value', valueRef.current);
      const value = valueRef.current;
      const parsedValue = NumberUtil.parse(value);

      if (isNaN(parsedValue)) {
        valueRef.current = undefined;
        onChange(undefined);
        if (onChangeProp) {
          onChangeProp(undefined);
        }
      } else {
        valueRef.current = parsedValue.toString().replace('.', ','); // Update the input value to the parsed number with comma as decimal separator
        onChange(parsedValue);
        if (onChangeProp) {
          onChangeProp(parsedValue);
        }
      }
      setTriggerValue(prev => prev + 1); // Trigger re-render to update the displayed value based on the parsed number
      onBlur();
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
    console.log('rendering controller with value', value, 'and valueRef', valueRef.current);
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });

    const onResetButtonClick = () => {
      onChange('');
    };

    return (
      <MuiTextField
        data-trigger={triggerValue}
        disabled={disabled || loading}
        error={hasError}
        helperText={(
          <FormFieldHelperText
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        )}
        inputRef={inputRef}
        variant={'outlined'}
        label={label}
        placeholder={placeholder}
        slotProps={{
          formHelperText: {
            className: classnames({ 'Mui-warning': hasWarning }),
          },
          input: {
            inputProps: {
              autoComplete: autocomplete ?? name,
            },
            className: classnames({ 'Mui-warning': hasWarning }),
            endAdornment: disabled ? undefined : (
              <InputAdornment position={'end'}>
                <IconButton
                  {...TestIdUtil.createAttributes('TextField-reset')}
                  sx={{
                    '& svg': {
                      fontSize: '16px',
                    },
                  }}
                  tabIndex={-1}
                  aria-label={`Clear text field`}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={onResetButtonClick}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
          inputLabel: {
            required: required && !disabled,
            className: classnames({ 'Mui-warning': hasWarning }),
          },
        }}
        value={valueRef.current ?? value ?? '' as string}
        onBlur={onMuiTextFieldBlur(onBlur, onChange)}
        onChange={onMuiTextFieldChange(onChange)}
      />
    );
  }, [triggerValue, disabled, loading, hasError, errorMessage, warningMessage, label, placeholder, hasWarning, autocomplete, name, required, onMuiTextFieldBlur, onMuiTextFieldChange]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('NumberField', { label, name: name as string })}
      fullWidth
      sx={{
        button: {
          display: 'none',
        },
        '&:hover button, &:focus-within button': {
          display: 'initial',
        },
      }}
    >
      <Controller
        control={control}
        defaultValue={'' as PathValue<TFieldValues, TName>}
        name={name}
        render={renderController}
      />
      { loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
