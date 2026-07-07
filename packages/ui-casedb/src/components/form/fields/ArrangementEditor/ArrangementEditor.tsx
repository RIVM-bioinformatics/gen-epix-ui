/* eslint-disable react-hooks/immutability */
import type {
  ChangeEvent,
  ReactElement,
} from 'react';
import {
  Fragment,
  useCallback,
  useId,
} from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  RadioGroup as MuiRadioGroup,
  Radio,
  useTheme,
} from '@mui/material';
import type {
  FieldValues,
  Path,
  PathValue,
  UseControllerReturn,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  FormFieldHelperText,
  FormFieldLoadingIndicator,
  FormUtil,
  StringUtil,
  TestIdUtil,
} from '@gen-epix/ui';

import { DASHBOARD_ARRANGEMENT_ORIENTATION } from '../../../../models/dashboard';
import type { DashboardArrangement } from '../../../../models/dashboard';

export type ArrangementEditorProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>> = {
  readonly disabled?: boolean;
  readonly infoMessage?: string;
  readonly label: string;
  readonly loading?: boolean;
  readonly name: TName;
  readonly onChange?: (value: string) => void;
  readonly options: { [key: string]: DashboardArrangement };
  readonly required?: boolean;
  readonly warningMessage?: string;
};

export const ArrangementEditor = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>>({
  disabled,
  infoMessage,
  label,
  loading,
  name,
  onChange: onChangeProp,
  options,
  required,
  warningMessage,
}: ArrangementEditorProps<TFieldValues, TName>): ReactElement => {
  const { t } = useTranslation();
  const theme = useTheme();
  const id = useId();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const hasError = !!errorMessage;

  const renderArrangement = useCallback((option: DashboardArrangement) => {
    const direction: 'column' | 'row' = option.orientation === DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL ? 'row' : 'column';
    const gridTemplate = option.cells.map((cell) => `${cell.size}fr`).join(' ');

    return (
      <Box
        data-direction={direction}
        sx={{
          display: 'grid',
          gap: theme.spacing(0.5),
          gridTemplateColumns: direction === 'row' ? gridTemplate : undefined,
          gridTemplateRows: direction === 'column' ? gridTemplate : undefined,
          height: '100%',
          width: '100%',
        }}
      >
        {option.cells.map((subOption, subIndex) => (
          <Fragment
            key={StringUtil.createHash(JSON.stringify({ subIndex, subOption }))}
          >
            {'name' in subOption
              ? (
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 0.5,
                    height: '100%',
                    width: '100%',
                  }}
                />
              )
              : renderArrangement(subOption)}
          </Fragment>
        ))}
      </Box>
    );
  }, [theme]);

  const onRadioGroupChange = useCallback(
    (onChange: UseControllerReturn<TFieldValues, TName>['field']['onChange']) =>
      (_event: ChangeEvent<HTMLInputElement>, newValue: string) => {
        if (options[newValue] !== undefined) {
          if (onChangeProp) {
            onChangeProp(newValue);
          }
          onChange(newValue);
        }
      },
    [options, onChangeProp],
  );

  const renderController = useCallback(({ field: { onBlur, onChange, value } }: UseControllerReturn<TFieldValues, TName>) => {
    return (
      <FormControl
        component={'fieldset'}
        error={hasError}
        {...TestIdUtil.createAttributes('ArrangementEditor', { label, name })}
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
        </FormLabel>
        {!loading && (
          <MuiRadioGroup
            aria-labelledby={id}
            onBlur={onBlur}
            onChange={onRadioGroupChange(onChange)}
            row
            value={typeof value === 'string' ? value : ''}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                marginTop: 1,
              }}
            >
              {Object.entries(options).map(([key, option], index) => (
                <Box
                  key={key}
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      height: '90px',
                      width: '160px',
                    }}
                  >
                    {renderArrangement(option)}
                  </Box>
                  <FormControlLabel
                    control={<Radio />}
                    label={t('Option {{n}}', { n: index + 1 })}
                    sx={{ m: 0 }}
                    value={key}
                  />
                </Box>
              ))}
            </Box>
          </MuiRadioGroup>
        )}
        {!!loading && <FormFieldLoadingIndicator inline />}
        <FormHelperText sx={{ ml: 0 }}>
          <FormFieldHelperText
            errorMessage={errorMessage}
            infoMessage={infoMessage}
            noIndent
            warningMessage={warningMessage}
          />
        </FormHelperText>
      </FormControl>
    );
  }, [hasError, label, name, disabled, loading, id, required, t, options, errorMessage, infoMessage, warningMessage, renderArrangement, onRadioGroupChange]);

  return (
    <Controller
      control={control}
      defaultValue={'' as PathValue<TFieldValues, TName>}
      name={name}
      render={renderController}
    />
  );
};
