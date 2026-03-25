import {
  describe,
  it,
  expect,
} from 'vitest';
import type {
  FieldErrorsImpl,
  DeepRequired,
} from 'react-hook-form';

import { FormUtil } from './FormUtil';

describe('FormUtil', () => {
  describe('getFieldErrorMessage', () => {
    it('should return the error message for the given field name', () => {
      const fieldErrors: Partial<FieldErrorsImpl<DeepRequired<{ name: string }>>> = {
        name: { message: 'Name is required', type: 'required' },
      };

      const errorMessage = FormUtil.getFieldErrorMessage(fieldErrors, 'name');
      expect(errorMessage).toBe('Name is required');
    });

    it('should return null if there is no error message for the given field name', () => {
      const fieldErrors: Partial<FieldErrorsImpl<DeepRequired<{ name: string }>>> = {};

      const errorMessage = FormUtil.getFieldErrorMessage(fieldErrors, 'name');
      expect(errorMessage).toBeNull();
    });

    it('should return null if the fieldErrors object is undefined', () => {
      const errorMessage = FormUtil.getFieldErrorMessage(undefined, 'name');
      expect(errorMessage).toBeNull();
    });
  });
});
