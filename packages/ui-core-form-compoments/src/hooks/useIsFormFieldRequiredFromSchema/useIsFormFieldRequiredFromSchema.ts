import { useCallback } from 'react';
import { set } from 'react-hook-form';
import type {
  FieldValues,
  Path,
  UseFormGetValues,
} from 'react-hook-form';
import type {
  ObjectSchema,
  ValidationError,
} from 'yup';

const useIsFormFieldRequiredFromSchema = <TFormFields extends FieldValues, TName extends Path<TFormFields>>(schema: ObjectSchema<TFormFields, TFormFields>, getFormValues: UseFormGetValues<TFormFields>): (fieldName: TName) => boolean => {
  return useCallback((fieldName: TName) => {
    try {
      const values = structuredClone(getFormValues());
      set(values, fieldName, undefined);

      schema.validateSyncAt(fieldName, values, {
        abortEarly: true,
        strict: false,
      });
      return false;
    } catch (error) {
      return (error as ValidationError)?.type === 'required' || (error as ValidationError)?.type === 'optionality';
    }
  }, [getFormValues, schema]);
};

export {
  useIsFormFieldRequiredFromSchema,
};
