import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Loadable } from '../../models/dataHooks';

import { LoadableUtil } from './LoadableUtil';

const createLoadable = (partial: Partial<Loadable>): Loadable => ({
  error: undefined,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  ...partial,
});

describe('LoadableUtil', () => {
  describe('findFirstError', () => {
    it('should return the error from the first enabled loadable with an error', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('first error'), isEnabled: true }),
        createLoadable({ error: new Error('second error'), isEnabled: true }),
      ];

      const result = LoadableUtil.findFirstError(loadables);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('first error');
    });

    it('should skip disabled loadables with errors', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('disabled error'), isEnabled: false }),
        createLoadable({ error: new Error('enabled error'), isEnabled: true }),
      ];

      const result = LoadableUtil.findFirstError(loadables);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('enabled error');
    });

    it('should return undefined when no loadable has an error', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.findFirstError(loadables)).toBeUndefined();
    });

    it('should return undefined when enabled loadables have no error', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: undefined, isEnabled: true }),
        createLoadable({ error: null, isEnabled: true }),
      ];

      expect(LoadableUtil.findFirstError(loadables)).toBeUndefined();
    });

    it('should return undefined for an empty array', () => {
      expect(LoadableUtil.findFirstError([])).toBeUndefined();
    });

    it('should return the first enabled error even if earlier loadables are disabled with errors', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('disabled 1'), isEnabled: false }),
        createLoadable({ error: new Error('disabled 2'), isEnabled: false }),
        createLoadable({ error: new Error('first enabled'), isEnabled: true }),
      ];

      const result = LoadableUtil.findFirstError(loadables);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('first enabled');
    });

    it('should return non-Error truthy values as errors', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: 'string error', isEnabled: true }),
      ];

      expect(LoadableUtil.findFirstError(loadables)).toBe('string error');
    });
  });

  describe('hasSomeError', () => {
    it('should return true when any enabled loadable has an error', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('error'), isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(true);
    });

    it('should return false when no enabled loadable has an error', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(false);
    });

    it('should ignore disabled loadables with errors', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('disabled'), isEnabled: false }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(LoadableUtil.hasSomeError([])).toBe(false);
    });

    it('should return true when all enabled loadables have errors', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('error 1'), isEnabled: true }),
        createLoadable({ error: new Error('error 2'), isEnabled: true }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(true);
    });

    it('should handle mixed enabled/disabled loadables correctly', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('disabled'), isEnabled: false }),
        createLoadable({ isEnabled: true }),
        createLoadable({ error: new Error('disabled 2'), isEnabled: false }),
        createLoadable({ error: 'some error', isEnabled: true }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(true);
    });
  });

  describe('isAllEnabled', () => {
    it('should return true when all loadables are enabled', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isAllEnabled(loadables)).toBe(true);
    });

    it('should return false when any loadable is disabled', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: false }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isAllEnabled(loadables)).toBe(false);
    });

    it('should return true for an empty array', () => {
      expect(LoadableUtil.isAllEnabled([])).toBe(true);
    });

    it('should return false when all loadables are disabled', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: false }),
        createLoadable({ isEnabled: false }),
      ];

      expect(LoadableUtil.isAllEnabled(loadables)).toBe(false);
    });
  });

  describe('isSomeFetching', () => {
    it('should return true when any enabled loadable is fetching', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeFetching(loadables)).toBe(true);
    });

    it('should return false when no enabled loadable is fetching', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeFetching(loadables)).toBe(false);
    });

    it('should ignore disabled loadables that are fetching', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: false, isFetching: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeFetching(loadables)).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(LoadableUtil.isSomeFetching([])).toBe(false);
    });

    it('should return true when multiple enabled loadables are fetching', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: false }),
        createLoadable({ isEnabled: true, isFetching: true }),
        createLoadable({ isEnabled: true, isFetching: true }),
      ];

      expect(LoadableUtil.isSomeFetching(loadables)).toBe(true);
    });
  });

  describe('isSomeLoading', () => {
    it('should return true when any enabled loadable is loading', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isLoading: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeLoading(loadables)).toBe(true);
    });

    it('should return false when no enabled loadable is loading', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeLoading(loadables)).toBe(false);
    });

    it('should ignore disabled loadables that are loading', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: false, isLoading: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomeLoading(loadables)).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(LoadableUtil.isSomeLoading([])).toBe(false);
    });

    it('should not conflate isFetching with isLoading', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: true, isLoading: false }),
      ];

      expect(LoadableUtil.isSomeLoading(loadables)).toBe(false);
    });
  });

  describe('isSomePending', () => {
    it('should return true when any enabled loadable is pending', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isPending: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomePending(loadables)).toBe(true);
    });

    it('should return false when no enabled loadable is pending', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomePending(loadables)).toBe(false);
    });

    it('should ignore disabled loadables that are pending', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: false, isPending: true }),
        createLoadable({ isEnabled: true }),
      ];

      expect(LoadableUtil.isSomePending(loadables)).toBe(false);
    });

    it('should return false for an empty array', () => {
      expect(LoadableUtil.isSomePending([])).toBe(false);
    });

    it('should not conflate isFetching with isPending', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: true, isPending: false }),
      ];

      expect(LoadableUtil.isSomePending(loadables)).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should correctly identify errors while some loadables are fetching', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: true }),
        createLoadable({ error: new Error('fetch failed'), isEnabled: true }),
        createLoadable({ isEnabled: false }),
      ];

      expect(LoadableUtil.hasSomeError(loadables)).toBe(true);
      expect(LoadableUtil.isSomeFetching(loadables)).toBe(true);
      expect(LoadableUtil.isAllEnabled(loadables)).toBe(false);
    });

    it('should handle a realistic multi-loadable dashboard state', () => {
      const loadables: Loadable[] = [
        createLoadable({ isEnabled: true, isFetching: false, isLoading: false, isPending: false }),
        createLoadable({ isEnabled: true, isFetching: true, isLoading: true, isPending: true }),
        createLoadable({ error: new Error('skipped'), isEnabled: false }),
        createLoadable({ error: undefined, isEnabled: true }),
      ];

      expect(LoadableUtil.isAllEnabled(loadables)).toBe(false);
      expect(LoadableUtil.hasSomeError(loadables)).toBe(false);
      expect(LoadableUtil.isSomeFetching(loadables)).toBe(true);
      expect(LoadableUtil.isSomeLoading(loadables)).toBe(true);
      expect(LoadableUtil.isSomePending(loadables)).toBe(true);
      expect(LoadableUtil.findFirstError(loadables)).toBeUndefined();
    });

    it('should handle all loadables disabled gracefully', () => {
      const loadables: Loadable[] = [
        createLoadable({ error: new Error('error 1'), isEnabled: false }),
        createLoadable({ isEnabled: false, isFetching: true }),
        createLoadable({ isEnabled: false, isLoading: true }),
      ];

      expect(LoadableUtil.isAllEnabled(loadables)).toBe(false);
      expect(LoadableUtil.hasSomeError(loadables)).toBe(false);
      expect(LoadableUtil.isSomeFetching(loadables)).toBe(false);
      expect(LoadableUtil.isSomeLoading(loadables)).toBe(false);
      expect(LoadableUtil.findFirstError(loadables)).toBeUndefined();
    });
  });
});
