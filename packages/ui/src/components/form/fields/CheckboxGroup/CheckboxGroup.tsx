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
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Checkbox as MuiCheckbox,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
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
import { useTranslation } from 'react-i18next';

import type { CheckboxOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


export type CheckboxGroupProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: CheckBoxGroupValue) => void;
  readonly options: CheckboxOption[];
  readonly required?: boolean;
  readonly row?: boolean;
  readonly warningMessage?: boolean | string;
};

type CheckBoxGroupValue = Array<number | string>;

export const CheckboxGroup = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  label,
  loading,
  name,
  onChange: onChangeProp,
  options,
  required,
  row,
  warningMessage,
}: CheckboxGroupProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!errorMessage;

  const onMuiCheckboxChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange'], itemValue: number | string, currentValue: CheckBoxGroupValue) =>
    (_event: ChangeEvent<unknown>, checked: boolean) => {
      const newValue = currentValue.filter(x => x !== itemValue);
      if (checked) {
        newValue.push(itemValue);
      }

      if (onChangeProp) {
        onChangeProp(newValue);
      }
      onChange(newValue);
    }
  , [onChangeProp]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
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
        {...TestIdUtil.createAttributes('CheckboxGroup', { label, name })}
        fullWidth
        sx={{
          '&:hover legend button, &:focus-within legend button': {
            display: 'initial',
          },
          'legend button': {
            display: 'none',
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
              aria-label={t`Clear checkbox selection`}
              // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
              onClick={onResetButtonClick}
              sx={{
                '& svg': {
                  fontSize: '16px',
                },
                position: 'absolute',
                top: '-10px',
              }}
              tabIndex={-1}
            >
              <ClearIcon />
            </IconButton>
          )}
        </FormLabel>
        { !loading && (
          <FormGroup
            aria-labelledby={id}
            onBlur={onBlur}
            row={row}
          >
            { options.map((option, index) => {
              return (
                <FormControlLabel
                  key={option.value.toString()}
                  {...TestIdUtil.createAttributes('CheckboxGroup-option', { label: option.label, value: option.value.toString() })}
                  checked={(value as CheckBoxGroupValue)?.includes(option.value)}
                  control={(
                    <MuiCheckbox
                      slotProps={{
                        input: {
                          name: `${name}-${option.value.toString()}`,
                          ref: index === 0 ? inputRef : undefined,
                        },
                      }}
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
        { !!loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, label, name, disabled, loading, id, required, t, row, options, errorMessage, warningMessage, onMuiCheckboxChange]);

  return (
    <Controller
      control={control}
      defaultValue={null}
      name={name}
      render={renderController}
    />

  );
};
