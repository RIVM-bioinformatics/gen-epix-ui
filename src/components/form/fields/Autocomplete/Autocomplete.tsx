import type {
  ChangeEvent,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Autocomplete as MuiAutocomplete,
  TextField,
  FormControl,
  Checkbox,
  Chip,
  Stack,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type {
  AutocompleteRenderInputParams,
  FilterOptionsState,
  AutocompleteValue,
  AutocompleteRenderOptionState,
  AutocompleteRenderGetTagProps,
} from '@mui/material';
import type {
  UseControllerReturn,
  FieldValues,
  ControllerRenderProps,
  Path,
} from 'react-hook-form';
import {
  Controller,
  useFormContext,
} from 'react-hook-form';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import type {
  FormFieldBaseProps,
  AutoCompleteOption,
} from '../../../../models/form';
import { FormUtil } from '../../../../utils/FormUtil';
import { TestIdUtil } from '../../../../utils/TestIdUtil';
import { FormFieldHelperText } from '../../helpers/FormFieldHelperText';
import { FormFieldLoadingIndicator } from '../../helpers/FormFieldLoadingIndicator';


type Value = string | number;

export interface AutocompleteProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TMultiple extends boolean | undefined> extends FormFieldBaseProps<TFieldValues, TName, AutocompleteValue<TFieldValues[TName], TMultiple, false, false>> {
  readonly groupValues?: boolean;
  readonly options: AutoCompleteOption[];
  readonly multiple?: TMultiple;
  readonly shouldSortOptions?: boolean;
  readonly loading?: boolean;
}

export const Autocomplete = <TFieldValues extends FieldValues, TName extends Path<TFieldValues> = Path<TFieldValues>, TMultiple extends boolean | undefined = false>({
  disabled = false,
  groupValues = false,
  label,
  loading = false,
  name,
  onChange: onChangeProp,
  options,
  required = false,
  warningMessage,
  multiple,
  shouldSortOptions,
}: AutocompleteProps<TFieldValues, TName, TMultiple>): ReactElement => {
  const [t] = useTranslation();
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
      optionValues: values,
      mappedOptions: mapped,
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
          padding: 0,
          margin: 0,
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

  const onInputValueChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
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
        {...params}
        error={hasError}
        helperText={helperText}
        inputRef={inputRef}
        label={label}
        onChange={multiple ? onInputValueChange : undefined}
        slotProps={{
          formHelperText: { className: classnames({ 'Mui-warning': hasWarning }) },
          inputLabel: {
            required: required && !disabled,
            className: classnames({ 'Mui-warning': hasWarning }),
          },
          input: {
            ...params.InputProps,
            className: classnames(params?.InputProps?.className, {
              'Mui-warning': hasWarning,
            }),
          },
        }}
      />
    );
  }, [disabled, errorMessage, hasError, hasWarning, label, multiple, onInputValueChange, required, warningMessage]);

  const renderTags = useCallback((values: TFieldValues[TName][], getTagProps: AutocompleteRenderGetTagProps) => {
    return (
      <Stack
        direction="row"
        flexWrap={'wrap'}
        spacing={1}
      >
        {values.map((value, index) => {
          const props = getTagProps({ index });
          const option = mappedOptions.get(value);
          if (option?.disabled) {
            delete props.onDelete;
          }
          return (
            <Chip
              {...props}
              key={value}
              label={getOptionLabel(value)}
              size="small"
            />
          );
        })}
      </Stack>
    );
  }, [getOptionLabel, mappedOptions]);

  const onMuiAutocompleteChange = useCallback((onChange: ControllerRenderProps<TFieldValues, TName>['onChange']) =>
    (_event: ChangeEvent<unknown>, value: AutocompleteValue<TFieldValues[TName], TMultiple, false, false>) => {
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

  const renderController = useCallback(({ field: { onChange, onBlur, value, ref } }: UseControllerReturn<TFieldValues, TName>) => {
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
        options={optionValues as TFieldValues[TName]}
        renderInput={renderInput}
        renderOption={multiple ? renderOption : undefined}
        renderTags={multiple ? renderTags : undefined}
        value={value}
      />
    );
  }, [required, multiple, disabled, loading, filterOptions, getIsOptionDisabled, getOptionLabel, groupValues, groupBy, inputValue, getIsOptionEqualToValue, t, onMuiAutocompleteChange, optionValues, renderInput, renderOption, renderTags]);

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
      {loading && <FormFieldLoadingIndicator />}
    </FormControl>
  );
};
