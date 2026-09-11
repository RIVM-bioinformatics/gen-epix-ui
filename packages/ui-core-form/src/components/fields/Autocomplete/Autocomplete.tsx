import type {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  SyntheticEvent,
} from 'react';
import {
  useCallback,
  useEffect,
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
  TextFieldVariants,
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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import type {
  AutoCompleteOption,
  AutocompleteSelectAllContextData,
} from '../../../models/form';
import { FormUtil } from '../../../utils/FormUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';

import { AutocompleteSelectAllPaper } from './AutocompleteSelectAllPaper';
import { AutocompleteSelectAllContext } from './AutocompleteSelectAllContext';


// A multi-select field's own value is already the array, so it must not be re-wrapped by `AutocompleteValue`'s `Multiple` handling.
export type AutocompleteChangeValue<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean> = TMultiple extends true ? TFieldValues[TName] : AutocompleteValue<TFieldValues[TName], false, false, false>;

export type AutocompleteProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean> = {
  readonly disabled?: boolean;
  readonly groupValues?: boolean;
  readonly hideSelectAll?: boolean;
  readonly infoMessage?: string;
  readonly label: string;
  readonly loading?: boolean;
  readonly multiple?: TMultiple;
  readonly name: TName;
  readonly onChange?: (value: AutocompleteChangeValue<TFieldValues, TName, TMultiple>) => void;
  readonly options: AutoCompleteOption[];
  readonly required?: boolean;
  readonly shouldSortOptions?: boolean;
  readonly textFieldVariant?: TextFieldVariants;
  readonly warningMessage?: string;
};
type MultipleRenderValueItemProps = ReturnType<AutocompleteRenderValueGetItemProps<true>>;

type Value = number | string;

export const Autocomplete = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean = false>({
  disabled = false,
  groupValues = false,
  hideSelectAll = false,
  infoMessage,
  label,
  loading = false,
  multiple,
  name,
  onChange: onChangeProp,
  options,
  required = false,
  shouldSortOptions,
  textFieldVariant = 'outlined',
  warningMessage,
}: AutocompleteProps<TFieldValues, TName, TMultiple>): ReactElement => {
  const { t } = useTranslation();
  const { control, formState: { errors }, setValue, watch } = useFormContext<TFieldValues>();
  const errorMessage = FormUtil.getFieldErrorMessage(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const onChangePropRef = useRef(onChangeProp);
  useEffect(() => {
    onChangePropRef.current = onChangeProp;
  }, [onChangeProp]);

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
  const getOptionKey = useCallback((value: AutoCompleteOption['value']): string => String(mappedOptions.get(value)?.value), [mappedOptions]);

  const renderOption = useCallback((props: HTMLAttributes<HTMLLIElement>, option: TFieldValues[TName], state: AutocompleteRenderOptionState): ReactNode => {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
      <li
        aria-disabled={props['aria-disabled']}
        aria-selected={props['aria-selected']}
        className={props.className}
        data-option-index={(props as { 'data-option-index': string })['data-option-index']}
        id={props.id}
        key={getOptionKey(option)}
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
  }, [getOptionKey, getOptionLabel]);

  const onMuiAutocompleteInputChange = useCallback((_event: SyntheticEvent, value: string) => {
    setInputValue(value);
  }, []);

  const renderInput = useCallback((params: AutocompleteRenderInputParams) => {
    const helperText = (
      <FormFieldHelperText
        errorMessage={errorMessage}
        infoMessage={infoMessage}
        warningMessage={warningMessage}
      />
    );

    return (
      <TextField
        disabled={disabled || loading}
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
        variant={textFieldVariant}
      />
    );
  }, [disabled, errorMessage, hasError, hasWarning, infoMessage, label, loading, required, textFieldVariant, warningMessage]);

  const renderValue = useCallback((values: AutocompleteValue<TFieldValues[TName], TMultiple, false, false>, getItemProps: AutocompleteRenderValueGetItemProps<TMultiple>) => {
    const selectedValues = (Array.isArray(values) ? values : [values]) as Value[];

    return (
      <Stack
        direction={'row'}
        sx={{
          flexWrap: 'wrap',
        }}
      >
        {selectedValues.map((value: Value, index: number) => {
          const props = getItemProps({ index }) as MultipleRenderValueItemProps;
          const option = mappedOptions.get(value);

          return (
            <Chip
              {...props}
              // eslint-disable-next-line @eslint-react/jsx-no-key-after-spread
              key={String(value)}
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
        onChangeProp(value as unknown as AutocompleteChangeValue<TFieldValues, TName, TMultiple>);
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

  const enabledOptionValues = useMemo(() =>
    optionValues.filter(v => !mappedOptions.get(v)?.disabled)
  , [optionValues, mappedOptions]);

  const watchedValue = watch(name);
  const currentValues = useMemo(() =>
    multiple && Array.isArray(watchedValue) ? watchedValue as Value[] : []
  , [multiple, watchedValue]);

  const handleSelectAll = useCallback((isCurrentlyAll: boolean, curValues: Value[]) => {
    const newValue = isCurrentlyAll
      ? curValues.filter(v => mappedOptions.get(v)?.disabled)
      : [...new Set([...curValues, ...enabledOptionValues])];
    onChangePropRef.current?.(newValue as unknown as AutocompleteChangeValue<TFieldValues, TName, TMultiple>);
    setValue(name, newValue as TFieldValues[TName], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [enabledOptionValues, mappedOptions, name, setValue]);

  const selectAllContextValue = useMemo<AutocompleteSelectAllContextData>(() => ({
    currentValues,
    enabledOptionValues,
    handleSelectAll,
    selectAllLabel: t`Select all`,
  }), [currentValues, enabledOptionValues, handleSelectAll, t]);

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
        getOptionKey={getOptionKey}
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
        slots={(multiple && !hideSelectAll) ? { paper: AutocompleteSelectAllPaper } : undefined}
        value={value}
      />
    );
  }, [required, multiple, hideSelectAll, disabled, loading, filterOptions, getIsOptionDisabled, getOptionKey, getOptionLabel, groupValues, groupBy, inputValue, getIsOptionEqualToValue, t, onMuiAutocompleteChange, onMuiAutocompleteInputChange, optionValues, renderInput, renderOption, renderValue]);

  return (
    <AutocompleteSelectAllContext value={multiple ? selectAllContextValue : null}>
      <FormControl
        {...TestIdUtil.createAttributes('Autocomplete', { label, name })}
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
    </AutocompleteSelectAllContext>
  );
};
