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
import type { RadioGroupProps } from '../components/form/fields/RadioGroup';
import type { NumberFieldProps } from '../components/form/fields/NumberField';


export enum FORM_FIELD_DEFINITION_TYPE {
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  FILE = 'FILE',
  HIDDEN = 'HIDDEN',
  NUMBER = 'NUMBER',
  RADIO_GROUP = 'RADIO_GROUP',
  RICH_TEXT = 'RICH_TEXT',
  SELECT = 'SELECT',
  TEXTFIELD = 'TEXTFIELD',
  TRANSFER_LIST = 'TRANSFER_LIST',
}

export interface AutoCompleteOption<TValue = void> extends OptionBase<TValue extends void ? (number | string) : TValue> {
  groupBySortOrderValue?: number;
  groupByValue?: string;
}
export type CheckboxOption = OptionBase<number | string>;
export type FormFieldDefinition<TFormFields extends FieldValues> =
  FormFieldDefinitionAutocomplete<TFormFields> |
  FormFieldDefinitionAutocompleteMultiple<TFormFields> |
  FormFieldDefinitionBoolean<TFormFields> |
  FormFieldDefinitionDate<TFormFields> |
  FormFieldDefinitionFile<TFormFields> |
  FormFieldDefinitionHidden<TFormFields> |
  FormFieldDefinitionNumber<TFormFields> |
  FormFieldDefinitionRadioGroup<TFormFields> |
  FormFieldDefinitionRichText<TFormFields> |
  FormFieldDefinitionSelect<TFormFields> |
  FormFieldDefinitionSelectMultiple<TFormFields> |
  FormFieldDefinitionTextField<TFormFields> |
  FormFieldDefinitionTransferList<TFormFields>;
export type FormFieldDefinitionAutocomplete<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: false } & AutocompleteProps<TFormFields, Path<TFormFields>, false>;
export type FormFieldDefinitionAutocompleteMultiple<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE; multiple?: true } & AutocompleteProps<TFormFields, Path<TFormFields>, true>;
export type FormFieldDefinitionBoolean<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.BOOLEAN } & Omit<SelectProps<TFormFields, Path<TFormFields>, false>, 'options'>;
export type FormFieldDefinitionDate<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.DATE } & DatePickerProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionFile<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.FILE } & UploadButtonProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionHidden<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.HIDDEN } & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionNumber<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.NUMBER } & NumberFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionRadioGroup<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP } & RadioGroupProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionRichText<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.RICH_TEXT } & RichTextEditorProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionSelect<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.SELECT; multiple?: false } & SelectProps<TFormFields, Path<TFormFields>, false>;
export type FormFieldDefinitionSelectMultiple<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.SELECT; multiple?: true } & SelectProps<TFormFields, Path<TFormFields>, true>;
export type FormFieldDefinitionTextField<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TEXTFIELD } & TextFieldProps<TFormFields, Path<TFormFields>>;
export type FormFieldDefinitionTransferList<TFormFields extends FieldValues> = { definition: FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST } & TransferListProps<TFormFields, Path<TFormFields>>;
export interface OptionBase<TValue> {
  disabled?: boolean;
  label?: string;
  value?: TValue;
}
export type RadioButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;
export type SelectOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;
export type ToggleButtonOption<TValue = void> = OptionBase<TValue extends void ? (boolean | number | string) : TValue>;

export type TransferListOption = OptionBase<string>;
