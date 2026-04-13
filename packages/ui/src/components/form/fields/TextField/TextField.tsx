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
  FormControl,
  IconButton,
  InputAdornment,
  TextField as MuiTextField,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import type {
  ControllerRenderProps,
  FieldValues,
  Path,
  PathValue,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

export type TextFieldProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly autocomplete?: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly multiline?: boolean;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly rows?: number;
  readonly type?: InputHTMLAttributes<unknown>['type'];
  readonly warningMessage?: boolean | string;
};

export const TextField = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  autocomplete,
  disabled = false,
  label,
  loading = false,
  multiline = false,
  name,
  onChange: onChangeProp,
  placeholder,
  required = false,
  rows = 3,
  type = 'text',
  warningMessage,
}: TextFieldProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;
  const inputRef = useRef<HTMLInputElement>(null);

  const onMuiTextFieldChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (onChangeProp) {
        onChangeProp(value);
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
        onBlur={onBlur}
        onChange={onMuiTextFieldChange(onChange)}
        placeholder={placeholder}
        rows={rows}
        slotProps={{
          formHelperText: {
            className: classnames({ 'Mui-warning': hasWarning }),
          },
          input: {
            className: classnames({ 'Mui-warning': hasWarning }),
            endAdornment: disabled ? undefined : (
              <InputAdornment position={'end'}>
                <IconButton
                  {...TestIdUtil.createAttributes('TextField-reset')}
                  aria-label={t`Clear text field`}
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
            ),
            inputProps: {
              autoComplete: autocomplete ?? name,
              type,
            },
          },
          inputLabel: {
            className: classnames({ 'Mui-warning': hasWarning }),
            required: required && !disabled,
          },
        }}
        value={value ?? '' as string}
        variant={'outlined'}
      />
    );
  }, [disabled, loading, hasError, errorMessage, warningMessage, label, multiline, placeholder, rows, hasWarning, autocomplete, name, type, t, required, onMuiTextFieldChange]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('TextField', { label, name: name as string })}
      fullWidth
      sx={{
        '&:hover button, &:focus-within button': {
          display: 'initial',
        },
        button: {
          display: 'none',
        },
      }}
    >
      <Controller
        control={control}
        defaultValue={'' as PathValue<TFieldValues, TName>}
        name={name}
        render={renderController}
      />
      { !!loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
