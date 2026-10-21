import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  object,
  string,
} from 'yup';
import type { InferType } from 'yup';

import { useIsFormFieldRequiredFromSchema } from './useIsFormFieldRequiredFromSchema';

const schema = object({
  customFailure: string().test('custom', 'custom failure', () => false),
  nested: object({
    value: string().required(),
  }),
  optional: string(),
  requiredBySchema: string().required(),
  requiredByTest: string().test('required', 'required field', () => false),
});

type FormValues = InferType<typeof schema>;

const defaultValues: FormValues = {
  customFailure: 'value',
  nested: {
    value: 'value',
  },
  optional: 'value',
  requiredBySchema: 'value',
  requiredByTest: 'value',
};

describe('useIsFormFieldRequiredFromSchema', () => {
  it('detects required fields, optional fields, nested paths, and other validation failures', () => {
    const { result } = renderHook(() => {
      const formMethods = useForm<FormValues>({ defaultValues });
      return useIsFormFieldRequiredFromSchema(schema, formMethods.getValues);
    });

    expect(result.current('requiredByTest')).toBe(true);
    expect(result.current('requiredBySchema')).toBe(true);
    expect(result.current('optional')).toBe(false);
    expect(result.current('nested.value')).toBe(true);
    expect(result.current('customFailure')).toBe(false);
  });

  it('returns false when the schema is missing', () => {
    const { result } = renderHook(() => {
      const formMethods = useForm<FormValues>({ defaultValues });
      return useIsFormFieldRequiredFromSchema(null, formMethods.getValues);
    });

    expect(result.current('requiredBySchema')).toBe(false);
  });

  it('returns false when reading form values throws', () => {
    const { result: formMethods } = renderHook(() => useForm<FormValues>({ defaultValues }));
    vi.spyOn(formMethods.current, 'getValues').mockImplementation(() => {
      throw new Error('Unable to read form values');
    });

    const { result } = renderHook(() =>
      useIsFormFieldRequiredFromSchema(schema, formMethods.current.getValues));

    expect(result.current('optional')).toBe(false);
  });
});
