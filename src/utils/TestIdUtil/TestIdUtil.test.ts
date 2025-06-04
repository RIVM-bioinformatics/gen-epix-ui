// @vitest-environment node

import { TestIdUtil } from './TestIdUtil';

describe('TestIdUtil', () => {
  describe('validate', () => {
    it('should create a test id', () => {
      expect(TestIdUtil.createAttributes('mock')).toEqual({ 'data-testid': 'mock' });
      expect(TestIdUtil.createAttributes('mock', { foo: 'bar' })).toEqual({ 'data-testid': 'mock', 'data-testid-prop-foo': 'bar' });
    });
  });
});
