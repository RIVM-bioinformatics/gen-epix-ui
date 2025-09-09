import type {
  FieldValues,
  Path,
} from 'react-hook-form';

import type { RichTextEditorProps } from '../components/form/fields/RichTextEditor';
import type { TransferListProps } from '../components/form/fields/TransferList';
import type { AutocompleteProps } from '../components/form/fields/Autocomplete';
import type { TextFieldProps } from '../components/form/fields/TextField';
import type { SelectProps } from '../components/form/fields/Select';
import type { DatePickerProps } from '../components/form/fields/DatePicker';
import type { UploadButtonProps } from '../components/form/fields/UploadButton/UploadButton';


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

export enum FORM_FIELD_DEFINITION_TYPE {
  TRANSFER_LIST = 'TRANSFER_LIST',
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  FILE = 'FILE',
  TEXTFIELD = 'TEXTFIELD',
  RICH_TEXT = 'RICH_TEXT',
  BOOLEAN = 'BOOLEAN',
  HIDDEN = 'HIDDEN',
  DATE = 'DATE',
}

export type FormFieldDefinitionAutocomplete<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: false } & AutocompleteProps<TFormFields, Path<TFormFields>, false>;
export type FormFieldDefinitionAutocompleteMultiple<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: true } & AutocompleteProps<TFormFields, Path<TFormFields>, true>;
export type FormFieldDefinitionTextField<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD } & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionBoolean<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN } & Omit<SelectProps<TFormFields, Path<TFormFields>, false>, 'options'>;
export type FormFieldDefinitionTransferList<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST } & TransferListProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionHidden<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.HIDDEN } & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionRichText<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT } & RichTextEditorProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionDate<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.DATE } & DatePickerProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionFile<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.FILE } & UploadButtonProps<TFormFields, Path<TFormFields>>;

export type FormFieldDefinition<TFormFields> =
  FormFieldDefinitionAutocomplete<TFormFields> |
  FormFieldDefinitionAutocompleteMultiple<TFormFields> |
  FormFieldDefinitionTextField<TFormFields> |
  FormFieldDefinitionBoolean<TFormFields> |
  FormFieldDefinitionTransferList<TFormFields> |
  FormFieldDefinitionHidden<TFormFields> |
  FormFieldDefinitionRichText<TFormFields> |
  FormFieldDefinitionDate<TFormFields> |
  FormFieldDefinitionFile<TFormFields>;
