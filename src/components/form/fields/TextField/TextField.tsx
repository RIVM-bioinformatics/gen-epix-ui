import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactElement,
} from 'react';
import {
  useCallback,
  useRef,
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
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type TextFieldProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly required?: boolean;
  readonly warningMessage?: string | boolean;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly type?: InputHTMLAttributes<unknown>['type'];
  readonly loading?: boolean;
  readonly placeholder?: string;
};

export const TextField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled = false,
  label,
  rows = 3,
  multiline = false,
  name,
  onChange: onChangeProp,
  loading = false,
  required = false,
  placeholder,
  type = 'text',
  warningMessage,
}: TextFieldProps<TFieldValues, TName>): ReactElement => {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);

  const onMuiTextFieldChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = type === 'number' ? (event.target as { valueAsNumber: number }).valueAsNumber ?? '' : event.target.value;
      if (onChangeProp) {
        onChangeProp(value as string);
      }
      onChange(value);
    }
  , [onChangeProp, type]);

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
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
        disabled={disabled || loading}
        error={hasError}
        helperText={(
          <FormFieldHelperText
            errorMessage={errorMessage}
            warningMessage={warningMessage}
          />
        )}
        inputRef={inputRef}
        label={label}
        multiline={multiline}
        placeholder={placeholder}
        rows={rows}
        slotProps={{
          formHelperText: {
            className: classnames({ 'Mui-warning': hasWarning }),
          },
          input: {
            className: classnames({ 'Mui-warning': hasWarning }),
            endAdornment: (
              <InputAdornment position={'end'}>
                <IconButton
                  {...TestIdUtil.createAttributes('TextField-reset')}
                  sx={{
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
              </InputAdornment>
            ),
          },
          inputLabel: {
            required: required && !disabled,
            className: classnames({ 'Mui-warning': hasWarning }),
          },
        }}
        type={type}
        value={value ?? '' as string}
        onBlur={onBlur}
        onChange={onMuiTextFieldChange(onChange)}
      />
    );
  }, [hasWarning, required, disabled, loading, hasError, errorMessage, warningMessage, label, multiline, onMuiTextFieldChange, placeholder, rows, type]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('TextField', { label, name: name as string })}
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
