import type {
  FieldValues,
  FieldErrorsImpl,
  DeepRequired,
} from 'react-hook-form';
import {
  parseISO,
  isValid,
} from 'date-fns';
import type { TFunction } from 'i18next';

import type { FormFieldDefinition } from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';

export class FormUtil {
  public static getFieldErrorMessage<TFormFields extends FieldValues>(fieldErrors: Partial<FieldErrorsImpl<DeepRequired<TFormFields>>>, fieldName: string): string {
    const fieldError = fieldErrors?.[fieldName];
    return fieldError?.message as string || null;
  }

  public static createBooleanOptions(t: TFunction<'translation', undefined>): { label: string; value: boolean }[] {
    return [
      { value: true, label: t`Yes` }, // t`Yes`
      { value: false, label: t`No` }, // t`No`
    ];
  }

  public static createFormValues<TFormFields extends FieldValues, TData = TFormFields>(formFieldDefinitions: FormFieldDefinition<TFormFields>[], item: TData): TFormFields {
    const itemValues: { [key: string]: unknown } = {};
    formFieldDefinitions.forEach(formFieldDefinition => {
      switch (formFieldDefinition.definition) {
        case FORM_FIELD_DEFINITION_TYPE.TEXTFIELD:
        case FORM_FIELD_DEFINITION_TYPE.RICH_TEXT:
        case FORM_FIELD_DEFINITION_TYPE.BOOLEAN:
          itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? '';
          break;
        case FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST:
          itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? [] as TFormFields[keyof TFormFields];
          break;
        case FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE:
        case FORM_FIELD_DEFINITION_TYPE.SELECT:
          if (formFieldDefinition.multiple) {
            itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? [] as TFormFields[keyof TFormFields];
          } else {
            itemValues[formFieldDefinition.name] = item?.[formFieldDefinition.name as unknown as keyof typeof item] ?? null;
          }
          break;
        case FORM_FIELD_DEFINITION_TYPE.DATE:
          try {
            const dateValue = parseISO(item?.[formFieldDefinition.name as unknown as keyof typeof item] as string);
            itemValues[formFieldDefinition.name] = isValid(dateValue) ? dateValue as TFormFields[keyof TFormFields] : null;
          } catch (_error) {
            itemValues[formFieldDefinition.name] = null;
          }
          break;
        default:
          break;
      }
    });
    return itemValues as unknown as TFormFields;
  }

}
