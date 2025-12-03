import { useCallback } from 'react';
import {
  set,
  type Path,
  type UseFormGetValues,
} from 'react-hook-form';
import type {
  ObjectSchema,
  ValidationError,
} from 'yup';

const useIsFormFieldRequiredFromSchema = <TFormFields, TName extends Path<TFormFields>>(schema: ObjectSchema<TFormFields, TFormFields>, getFormValues: UseFormGetValues<TFormFields>): (fieldName: TName) => boolean => {
  return useCallback((fieldName: TName) => {
    try {
      const values = structuredClone(getFormValues());
      set(values, fieldName, undefined);

      schema.validateSyncAt(fieldName as string, values, {
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
