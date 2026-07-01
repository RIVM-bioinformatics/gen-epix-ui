import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  DeepRequired,
  FieldErrorsImpl,
  FieldValues,
} from 'react-hook-form';

import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import type { FormFieldDefinition } from '../../models/form';

import { FormUtil } from './FormUtil';

/** Build a minimal FormFieldDefinition fixture without needing all component props. */
const fd = <TFormFields extends FieldValues>(
  definition: FORM_FIELD_DEFINITION_TYPE,
  name: string,
  extra: Record<string, unknown> = {},
): FormFieldDefinition<TFormFields> => {
  return { definition, name, ...extra } as unknown as FormFieldDefinition<TFormFields>;
};

describe('FormUtil', () => {
  describe('areFormValuesValid', () => {
    it('returns false when values is a non-object primitive', () => {
      expect(FormUtil.areFormValuesValid([], 'string')).toBe(false);
      expect(FormUtil.areFormValuesValid([], 42)).toBe(false);
    });

    it('returns false when values is null', () => {
      expect(FormUtil.areFormValuesValid([], null)).toBe(false);
    });

    it('returns true when definitions are empty', () => {
      expect(FormUtil.areFormValuesValid([], {})).toBe(true);
    });

    it('returns true for BOOLEAN field with a boolean value', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      expect(FormUtil.areFormValuesValid(defs, { active: true })).toBe(true);
    });

    it('returns false for BOOLEAN field with a non-boolean value', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      expect(FormUtil.areFormValuesValid(defs, { active: 'yes' })).toBe(false);
    });

    it('returns true for BOOLEAN_SWITCH field with a boolean value', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH, 'active')];
      expect(FormUtil.areFormValuesValid(defs, { active: false })).toBe(true);
    });

    it('returns false for BOOLEAN_SWITCH field with a non-boolean value', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH, 'active')];
      expect(FormUtil.areFormValuesValid(defs, { active: null })).toBe(false);
    });

    it('returns true for DATE field with a string value', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      expect(FormUtil.areFormValuesValid(defs, { date: '2023-01-01' })).toBe(true);
    });

    it('returns true for DATE field with a null value', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      expect(FormUtil.areFormValuesValid(defs, { date: null })).toBe(true);
    });

    it('returns false for DATE field with a non-string/non-null value', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      expect(FormUtil.areFormValuesValid(defs, { date: 42 })).toBe(false);
    });

    it('returns true for HIDDEN field with a string value', () => {
      const defs = [fd<{ h: string }>(FORM_FIELD_DEFINITION_TYPE.HIDDEN, 'h')];
      expect(FormUtil.areFormValuesValid(defs, { h: 'val' })).toBe(true);
    });

    it('returns true for RICH_TEXT field with a null value', () => {
      const defs = [fd<{ rt: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'rt')];
      expect(FormUtil.areFormValuesValid(defs, { rt: null })).toBe(true);
    });

    it('returns false for RICH_TEXT field with a non-string/non-null value', () => {
      const defs = [fd<{ rt: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'rt')];
      expect(FormUtil.areFormValuesValid(defs, { rt: 42 })).toBe(false);
    });

    it('returns true for TEXTFIELD field with a string value', () => {
      const defs = [fd<{ name: string }>(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, 'name')];
      expect(FormUtil.areFormValuesValid(defs, { name: 'John' })).toBe(true);
    });

    it('returns true for NUMBER field with a number value', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      expect(FormUtil.areFormValuesValid(defs, { count: 5 })).toBe(true);
    });

    it('returns true for NUMBER field with a null value', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      expect(FormUtil.areFormValuesValid(defs, { count: null })).toBe(true);
    });

    it('returns false for NUMBER field with a non-number/non-null value', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      expect(FormUtil.areFormValuesValid(defs, { count: '5' })).toBe(false);
    });

    it('returns true for default-branch field type (AUTOCOMPLETE) when value is defined', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags')];
      expect(FormUtil.areFormValuesValid(defs, { tags: [] })).toBe(true);
    });

    it('returns false for default-branch field type (AUTOCOMPLETE) when value is undefined', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags')];
      expect(FormUtil.areFormValuesValid(defs, {})).toBe(false);
    });
  });

  describe('createBooleanOptions', () => {
    it('returns Yes/No options with boolean values', () => {
      const t = (strings: TemplateStringsArray) => strings[0];
      const options = FormUtil.createBooleanOptions(t as Parameters<typeof FormUtil.createBooleanOptions>[0]);
      expect(options).toEqual([
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ]);
    });
  });

  describe('createFormValues', () => {
    it('returns item value for AUTOCOMPLETE (non-multiple) when present', () => {
      const defs = [fd<{ tag: string }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tag', { multiple: false })];
      expect(FormUtil.createFormValues(defs, { tag: 'value' }).tag).toBe('value');
    });

    it('returns null for AUTOCOMPLETE (non-multiple) when item value is absent', () => {
      const defs = [fd<{ tag: string }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tag', { multiple: false })];
      expect(FormUtil.createFormValues(defs, {}).tag).toBeNull();
    });

    it('returns item value for AUTOCOMPLETE (multiple) when present', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags', { multiple: true })];
      expect(FormUtil.createFormValues(defs, { tags: ['a', 'b'] }).tags).toEqual(['a', 'b']);
    });

    it('returns empty array for AUTOCOMPLETE (multiple) when item value is absent', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags', { multiple: true })];
      expect(FormUtil.createFormValues(defs, {}).tags).toEqual([]);
    });

    it('returns item value for SELECT (non-multiple) when present', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choice', { multiple: false })];
      expect(FormUtil.createFormValues(defs, { choice: 'a' }).choice).toBe('a');
    });

    it('returns null for SELECT (non-multiple) when item value is absent', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choice', { multiple: false })];
      expect(FormUtil.createFormValues(defs, {}).choice).toBeNull();
    });

    it('returns item value for SELECT (multiple) when present', () => {
      const defs = [fd<{ choices: string[] }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choices', { multiple: true })];
      expect(FormUtil.createFormValues(defs, { choices: ['x'] }).choices).toEqual(['x']);
    });

    it('returns empty array for SELECT (multiple) when item value is absent', () => {
      const defs = [fd<{ choices: string[] }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choices', { multiple: true })];
      expect(FormUtil.createFormValues(defs, {}).choices).toEqual([]);
    });

    it('returns item value for BOOLEAN when present', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      expect(FormUtil.createFormValues(defs, { active: true }).active).toBe(true);
    });

    it('returns empty string for BOOLEAN when item value is absent', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      expect(FormUtil.createFormValues(defs, {}).active).toBe('');
    });

    it('returns item value for RICH_TEXT when present', () => {
      const defs = [fd<{ content: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'content')];
      expect(FormUtil.createFormValues(defs, { content: '<p>hi</p>' }).content).toBe('<p>hi</p>');
    });

    it('returns empty string for RICH_TEXT when item value is absent', () => {
      const defs = [fd<{ content: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'content')];
      expect(FormUtil.createFormValues(defs, {}).content).toBe('');
    });

    it('returns item value for TEXTFIELD when present', () => {
      const defs = [fd<{ name: string }>(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, 'name')];
      expect(FormUtil.createFormValues(defs, { name: 'John' }).name).toBe('John');
    });

    it('returns empty string for TEXTFIELD when item value is absent', () => {
      const defs = [fd<{ name: string }>(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, 'name')];
      expect(FormUtil.createFormValues(defs, {}).name).toBe('');
    });

    it('returns a Date object for DATE field with a valid ISO string', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      const result = FormUtil.createFormValues(defs, { date: '2023-06-15' });
      expect(result.date).toBeInstanceOf(Date);
    });

    it('returns null for DATE field with an invalid date string', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      const result = FormUtil.createFormValues(defs, { date: 'not-a-date' });
      expect(result.date).toBeNull();
    });

    it('returns null for DATE field when the value causes parseISO to throw', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      // item is an empty object so item?.['date'] === undefined, which causes parseISO to throw
      const result = FormUtil.createFormValues(defs, {} as unknown as { date: string });
      expect(result.date).toBeNull();
    });

    it('returns item value for NUMBER when present', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      expect(FormUtil.createFormValues(defs, { count: 42 }).count).toBe(42);
    });

    it('returns null for NUMBER when item value is absent', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      expect(FormUtil.createFormValues(defs, {}).count).toBeNull();
    });

    it('returns item value for TRANSFER_LIST when present', () => {
      const defs = [fd<{ items: string[] }>(FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST, 'items')];
      expect(FormUtil.createFormValues(defs, { items: ['x'] }).items).toEqual(['x']);
    });

    it('returns empty array for TRANSFER_LIST when item value is absent', () => {
      const defs = [fd<{ items: string[] }>(FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST, 'items')];
      expect(FormUtil.createFormValues(defs, {}).items).toEqual([]);
    });

    it('does not set a value for the default branch (BOOLEAN_SWITCH)', () => {
      const defs = [fd<{ sw: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH, 'sw')];
      const result = FormUtil.createFormValues(defs, { sw: true });
      expect(result.sw).toBeUndefined();
    });
  });

  describe('createStringValuesFromFormValues', () => {
    it('passes through value for TEXTFIELD', () => {
      const defs = [fd<{ name: string }>(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, 'name')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { name: 'John' }).name).toBe('John');
    });

    it('passes through value for BOOLEAN', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      const result = FormUtil.createStringValuesFromFormValues(
        defs,
        { active: true },
      );
      expect(result.active).toBe(true);
    });

    it('passes through value for NUMBER', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      const result = FormUtil.createStringValuesFromFormValues(
        defs,
        { count: 5 },
      );
      expect(result.count).toBe(5);
    });

    it('passes through value for RICH_TEXT', () => {
      const defs = [fd<{ content: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'content')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { content: '<p>hi</p>' }).content).toBe('<p>hi</p>');
    });

    it('passes through value for AUTOCOMPLETE', () => {
      const defs = [fd<{ tag: string }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tag')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { tag: 'option1' }).tag).toBe('option1');
    });

    it('passes through value for SELECT', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choice')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { choice: 'a' }).choice).toBe('a');
    });

    it('passes through value for TRANSFER_LIST', () => {
      const defs = [fd<{ items: string[] }>(FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST, 'items')];
      const result = FormUtil.createStringValuesFromFormValues(
        defs,
        { items: ['a', 'b'] },
      );
      expect(result.items).toEqual(['a', 'b']);
    });

    it('formats a valid DATE value using the default format (yyyy-MM-dd)', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { date: '2023-06-15' }).date).toBe('2023-06-15');
    });

    it('formats a valid DATE value using a custom dateFormat', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date', { dateFormat: 'dd/MM/yyyy' })];
      expect(FormUtil.createStringValuesFromFormValues(defs, { date: '2023-06-15' }).date).toBe('15/06/2023');
    });

    it('returns null for DATE field with an invalid date string', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      expect(FormUtil.createStringValuesFromFormValues(defs, { date: 'not-a-date' }).date).toBeNull();
    });

    it('returns null for DATE field when the value causes parseISO to throw', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      // empty object so formValues['date'] === undefined, causing parseISO to throw
      const result = FormUtil.createStringValuesFromFormValues(
        defs,
        {} as unknown as { date: string },
      );
      expect(result.date).toBeNull();
    });

    it('does not include the field for the default branch (BOOLEAN_SWITCH)', () => {
      const defs = [fd<{ sw: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH, 'sw')];
      const result = FormUtil.createStringValuesFromFormValues(
        defs,
        { sw: true },
      );
      expect(result.sw).toBeUndefined();
    });
  });

  describe('createYupSchemaFromFormFieldDefinitions', () => {
    it('creates a string schema for AUTOCOMPLETE (non-multiple) that transforms empty string to null', () => {
      const defs = [fd<{ tag: string }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tag', { multiple: false })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ tag: '' }).tag).toBeNull();
    });

    it('creates a string schema for AUTOCOMPLETE (non-multiple) that preserves non-empty string', () => {
      const defs = [fd<{ tag: string }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tag', { multiple: false })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ tag: 'value' }).tag).toBe('value');
    });

    it('creates an array schema for AUTOCOMPLETE (multiple) that transforms empty array to null', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags', { multiple: true })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ tags: [] }).tags).toBeNull();
    });

    it('creates an array schema for AUTOCOMPLETE (multiple) that preserves non-empty array', () => {
      const defs = [fd<{ tags: string[] }>(FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE, 'tags', { multiple: true })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ tags: ['a'] }).tags).toEqual(['a']);
    });

    it('creates a boolean schema for BOOLEAN that preserves true', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ active: true }).active).toBe(true);
    });

    it('creates a boolean schema for BOOLEAN that transforms null to null', () => {
      const defs = [fd<{ active: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN, 'active')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ active: null }).active).toBeNull();
    });

    it('creates a string schema for DATE that transforms a valid Date to an ISO string', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      const date = new Date('2023-06-15T00:00:00.000Z');
      const result = schema.cast({ date });
      expect(typeof result.date).toBe('string');
      expect(result.date).toBe(date.toISOString());
    });

    it('creates a string schema for DATE that transforms an invalid date to null', () => {
      const defs = [fd<{ date: string }>(FORM_FIELD_DEFINITION_TYPE.DATE, 'date')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ date: null }).date).toBeNull();
    });

    it('returns the schema unchanged for FILE (no field schema added)', () => {
      const defs = [fd<{ file: unknown }>(FORM_FIELD_DEFINITION_TYPE.FILE, 'file')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({})).toBeDefined();
    });

    it('creates a string schema for HIDDEN that transforms empty string to null', () => {
      const defs = [fd<{ h: string }>(FORM_FIELD_DEFINITION_TYPE.HIDDEN, 'h')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ h: '' }).h).toBeNull();
    });

    it('creates a string schema for HIDDEN that preserves a non-empty string', () => {
      const defs = [fd<{ h: string }>(FORM_FIELD_DEFINITION_TYPE.HIDDEN, 'h')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ h: 'hidden-value' }).h).toBe('hidden-value');
    });

    it('creates a string schema for RICH_TEXT that transforms empty string to null', () => {
      const defs = [fd<{ rt: string }>(FORM_FIELD_DEFINITION_TYPE.RICH_TEXT, 'rt')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ rt: '' }).rt).toBeNull();
    });

    it('creates a string schema for TEXTFIELD that transforms empty string to null', () => {
      const defs = [fd<{ name: string }>(FORM_FIELD_DEFINITION_TYPE.TEXTFIELD, 'name')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ name: '' }).name).toBeNull();
    });

    it('creates a number schema for NUMBER that preserves a number', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ count: 5 }).count).toBe(5);
    });

    it('creates a number schema for NUMBER that transforms null to null', () => {
      const defs = [fd<{ count: number }>(FORM_FIELD_DEFINITION_TYPE.NUMBER, 'count')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ count: null }).count).toBeNull();
    });

    it('creates a string schema for RADIO_GROUP that transforms empty string to null', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.RADIO_GROUP, 'choice')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ choice: '' }).choice).toBeNull();
    });

    it('creates a string schema for SELECT (non-multiple) that transforms empty string to null', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choice', { multiple: false })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ choice: '' }).choice).toBeNull();
    });

    it('creates a string schema for SELECT (non-multiple) that preserves non-empty string', () => {
      const defs = [fd<{ choice: string }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choice', { multiple: false })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ choice: 'opt' }).choice).toBe('opt');
    });

    it('creates an array schema for SELECT (multiple) that transforms empty array to null', () => {
      const defs = [fd<{ choices: string[] }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choices', { multiple: true })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ choices: [] }).choices).toBeNull();
    });

    it('creates an array schema for SELECT (multiple) that preserves non-empty array', () => {
      const defs = [fd<{ choices: string[] }>(FORM_FIELD_DEFINITION_TYPE.SELECT, 'choices', { multiple: true })];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ choices: ['opt'] }).choices).toEqual(['opt']);
    });

    it('creates an array schema for TRANSFER_LIST that transforms empty array to null', () => {
      const defs = [fd<{ items: string[] }>(FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST, 'items')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ items: [] }).items).toBeNull();
    });

    it('creates an array schema for TRANSFER_LIST that preserves non-empty array', () => {
      const defs = [fd<{ items: string[] }>(FORM_FIELD_DEFINITION_TYPE.TRANSFER_LIST, 'items')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({ items: ['x'] }).items).toEqual(['x']);
    });

    it('returns the schema unchanged for the default branch (BOOLEAN_SWITCH)', () => {
      const defs = [fd<{ sw: boolean }>(FORM_FIELD_DEFINITION_TYPE.BOOLEAN_SWITCH, 'sw')];
      const schema = FormUtil.createYupSchemaFromFormFieldDefinitions(defs);
      expect(schema.cast({})).toBeDefined();
    });
  });

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
