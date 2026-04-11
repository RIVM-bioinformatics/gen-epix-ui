import type {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  SyntheticEvent,
} from 'react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Checkbox,
  Chip,
  FormControl,
  Autocomplete as MuiAutocomplete,
  Stack,
  TextField,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type {
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
  AutocompleteRenderValueGetItemProps,
  AutocompleteValue,
  FilterOptionsState,
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
import { useTranslation } from 'react-i18next';

import type { AutoCompleteOption } from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


export type AutocompleteProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean> = {
  readonly disabled?: boolean;
  readonly groupValues?: boolean;
  readonly label: string;
  readonly loading?: boolean;
  readonly multiple?: TMultiple;
  readonly name: TName;
  readonly onChange?: (value: AutocompleteValue<TFieldValues[TName], TMultiple, false, false>) => void;
  readonly options: AutoCompleteOption[];
  readonly required?: boolean;
  readonly shouldSortOptions?: boolean;
  readonly warningMessage?: boolean | string;
};
type MultipleRenderValueItemProps = ReturnType<AutocompleteRenderValueGetItemProps<true>>;

type Value = number | string;

export const Autocomplete = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean = false>({
  disabled = false,
  groupValues = false,
  label,
  loading = false,
  multiple,
  name,
  onChange: onChangeProp,
  options,
  required = false,
  shouldSortOptions,
  warningMessage,
}: AutocompleteProps<TFieldValues, TName, TMultiple>): ReactElement => {
  const { t } = useTranslation();
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const hasError = !!errorMessage;
  const hasWarning = !!warningMessage && !hasError;

  const sortedOptions = useMemo(() => {
    if (!shouldSortOptions) {
      return options;
    }
    return structuredClone(options).sort((a, b) => a.label.localeCompare(b.label));
  }, [options, shouldSortOptions]);

  const { mappedOptions, optionValues }: { mappedOptions: Map<Value, AutoCompleteOption>; optionValues: Array<Value> } = useMemo(() => {
    const values: Array<Value> = [];
    const mapped = new Map<Value, AutoCompleteOption>();
    sortedOptions.forEach(option => {
      values.push(option.value);
      mapped.set(option.value, option);
    });
    return {
      mappedOptions: mapped,
      optionValues: values,
    };
  }, [sortedOptions]);

  const getOptionLabel = useCallback((value: AutoCompleteOption['value']) => loading ? t`Loading...` : mappedOptions.get(value)?.label, [loading, mappedOptions, t]);
  const getIsOptionEqualToValue = useCallback((optionValue: AutoCompleteOption['value'], value: AutoCompleteOption['value']) => optionValue === value, []);
  const getIsOptionDisabled = useCallback((value: AutoCompleteOption['value']): boolean => mappedOptions.get(value)?.disabled, [mappedOptions]);
  const groupBy = useCallback((value: AutoCompleteOption['value']): string => mappedOptions.get(value)?.groupByValue, [mappedOptions]);

  const renderOption = useCallback((props: HTMLAttributes<HTMLLIElement>, option: TFieldValues[TName], state: AutocompleteRenderOptionState): ReactNode => {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <li
        aria-disabled={props['aria-disabled']}
        aria-selected={props['aria-selected']}
        className={props.className}
        data-option-index={(props as { 'data-option-index': string })['data-option-index']}
        id={props.id}
        key={option}
        onClick={props.onClick}
        onMouseMove={props.onMouseMove}
        onTouchStart={props.onTouchStart}
        role={props.role}
        style={{
          margin: 0,
          padding: 0,
        }}
        tabIndex={props.tabIndex}
      >
        <Checkbox
          checked={state.selected}
          checkedIcon={<CheckBoxIcon />}
          icon={<CheckBoxOutlineBlankIcon />}
          style={{ marginRight: 8 }}
        />
        {getOptionLabel(option)}
      </li>
    );
  }, [getOptionLabel]);

  const onMuiAutocompleteInputChange = useCallback((_event: SyntheticEvent, value: string) => {
    setInputValue(value);
  }, []);

  const renderInput = useCallback((params: AutocompleteRenderInputParams) => {
    const helperText = (
      <FormFieldHelperText
        errorMessage={errorMessage}
        warningMessage={warningMessage}
      />
    );

    return (
      <TextField
        error={hasError}
        fullWidth={params.fullWidth}
        helperText={helperText}
        id={params.id}
        inputRef={inputRef}
        label={label}
        size={params.size}
        slotProps={{
          formHelperText: { className: classnames({ 'Mui-warning': hasWarning }) },
          htmlInput: {
            ...params.slotProps.htmlInput,
          },
          input: {
            ...params.slotProps.input,
            className: classnames(params.slotProps.input.className, {
              'Mui-warning': hasWarning,
            }),
          },
          inputLabel: {
            ...params.slotProps.inputLabel,
            className: classnames({ 'Mui-warning': hasWarning }),
            required: required && !disabled,
          },
        }}
        variant={'outlined'}
      />
    );
  }, [disabled, errorMessage, hasError, hasWarning, label, required, warningMessage]);

  const renderValue = useCallback((values: AutocompleteValue<TFieldValues[TName], TMultiple, false, false>, getItemProps: AutocompleteRenderValueGetItemProps<TMultiple>) => {
    const selectedValues = (Array.isArray(values) ? values : [values]) as Value[];

    return (
      <Stack
        direction={'row'}
        sx={{
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {selectedValues.map((value: Value, index: number) => {
          const props = getItemProps({ index }) as MultipleRenderValueItemProps;
          const option = mappedOptions.get(value);

          return (
            <Chip
              key={String(value)}
              {...props}
              label={getOptionLabel(value)}
              onDelete={option?.disabled ? undefined : props.onDelete}
              size={'small'}
            />
          );
        })}
      </Stack>
    );
  }, [getOptionLabel, mappedOptions]);

  const onMuiAutocompleteChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: SyntheticEvent, value: AutocompleteValue<TFieldValues[TName], TMultiple, false, false>) => {
      if (onChangeProp) {
        onChangeProp(value as TFieldValues[TName]);
      }
      onChange(value);
    }
  , [onChangeProp]);

  const filterOptions = useCallback((_filterableOptions: TFieldValues[TName][], filterState: FilterOptionsState<TFieldValues[TName]>): TFieldValues[TName][] => {
    if (filterState.inputValue) {
      return sortedOptions.filter(option => option.label.toLowerCase().includes(filterState.inputValue.toLowerCase())).map((option) => option.value) as TFieldValues[TName][];
    }
    return sortedOptions.map((option) => option.value) as TFieldValues[TName][];
  }, [sortedOptions]);

  const renderController = useCallback(({ field: { onBlur, onChange, ref, value } }: UseControllerReturn<TFieldValues, TName>) => {
    ref({
      focus: () => {
        inputRef?.current?.focus();
      },
    });
    return (
      <MuiAutocomplete<TFieldValues[TName], TMultiple>
        autoComplete
        autoHighlight
        disableClearable={required as undefined}
        disableCloseOnSelect={multiple}
        disabled={disabled || loading}
        filterOptions={filterOptions}
        getOptionDisabled={getIsOptionDisabled}
        getOptionLabel={getOptionLabel}
        groupBy={groupValues ? groupBy : undefined}
        inputValue={multiple ? inputValue : undefined}
        isOptionEqualToValue={getIsOptionEqualToValue}
        multiple={multiple}
        noOptionsText={t`No results`}
        onBlur={onBlur}
        onChange={onMuiAutocompleteChange(onChange)}
        onInputChange={multiple ? onMuiAutocompleteInputChange : undefined}
        options={optionValues as TFieldValues[TName]}
        renderInput={renderInput}
        renderOption={multiple ? renderOption : undefined}
        renderValue={multiple ? renderValue : undefined}
        value={value}
      />
    );
  }, [required, multiple, disabled, loading, filterOptions, getIsOptionDisabled, getOptionLabel, groupValues, groupBy, inputValue, getIsOptionEqualToValue, t, onMuiAutocompleteChange, onMuiAutocompleteInputChange, optionValues, renderInput, renderOption, renderValue]);

  return (
    <FormControl
      {...TestIdUtil.createAttributes('Autocomplete', { label, name: name as string })}
      fullWidth
    >
      <Controller
        control={control}
        defaultValue={null}
        name={name}
        render={renderController}
      />
      {!!loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
