import type {
  FieldValues,
  Path,
} from 'react-hook-form';

import type { MarkdownEditorProps } from '../components/form/fields/MarkdownEditor';
import type { TransferListProps } from '../components/form/fields/TransferList';
import type { AutocompleteProps } from '../components/form/fields/Autocomplete';
import type { TextFieldProps } from '../components/form/fields/TextField';
import type { SelectProps } from '../components/form/fields/Select';
import type { DatePickerProps } from '../components/form/fields/DatePicker';


export interface OptionBase<TValue> {
  value?: TValue;
  label?: string;
  disabled?: boolean;
}

export interface AutoCompleteOption<TValue = void> extends OptionBase<TValue extends void ? (string | number) : TValue> {
  groupBySortOrderValue?: number;
  groupByValue?: string;
}
export type RadioButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | string | number) : TValue>;
export type SelectOption<TValue = void> = OptionBase<TValue extends void ? (boolean | string | number) : TValue>;
export type ToggleButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | string | number) : TValue>;
export type CheckboxOption = OptionBase<string | number>;
export type TransferListOption = OptionBase<string>;

export interface FormFieldBaseProps<TFieldValues extends FieldValues, TName extends Path<TFieldValues>, TValue = string> {
  disabled?: boolean;
  label: string;
  name: TName;
  onChange?: (value: TValue) => void;
  required?: boolean;
  warningMessage?: string | boolean;
}


export enum FORM_FIELD_DEFINITION_TYPE {
  TRANSFER_LIST = 'TRANSFER_LIST',
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  TEXTFIELD = 'TEXTFIELD',
  MARKDOWN = 'MARKDOWN',
  BOOLEAN = 'BOOLEAN',
  HIDDEN = 'HIDDEN',
  DATE = 'DATE',
}

export type FormFieldDefinition<TFormFields> =
  ({ definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: false } & AutocompleteProps<TFormFields, Path<TFormFields>, false>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: true } & AutocompleteProps<TFormFields, Path<TFormFields>, true>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD } & TextFieldProps<TFormFields, Path<TFormFields>>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN } & Omit<SelectProps<TFormFields, Path<TFormFields>, false>, 'options'>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST } & TransferListProps<TFormFields, Path<TFormFields>>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.HIDDEN } & TextFieldProps<TFormFields, Path<TFormFields>>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.MARKDOWN } & MarkdownEditorProps<TFormFields, Path<TFormFields>>) |
  ({ definition: FORM_FIELD_DEFINITION_TYPE.DATE } & DatePickerProps<TFormFields, Path<TFormFields>>);
