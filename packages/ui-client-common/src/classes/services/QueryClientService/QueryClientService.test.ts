import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { QueryClientService } from './QueryClientService';

const createService = (queryKeyDependencies: Array<Record<string, string[]>> = []): QueryClientService => new QueryClientService({
  config: {
    queryClient: {
      retry: () => false,
      retryDelay: () => 0,
    },
  },
  queryKeyDependencies,
});

describe('QueryClientService', () => {
  it('creates query caches and applies configured query defaults', () => {
    const retry = vi.fn(() => false);
    const retryDelay = vi.fn(() => 250);
    const service = new QueryClientService({
      config: {
        queryClient: { retry, retryDelay },
      },
      queryKeyDependencies: [],
    });

    expect(service.queryCache).toBe(service.queryClient.getQueryCache());
    expect(service.mutationCache).toBe(service.queryClient.getMutationCache());
    expect(service.queryClient.getDefaultOptions().queries).toMatchObject({
      gcTime: Infinity,
      retry,
      retryDelay,
      staleTime: Infinity,
    });
  });

  it('merges dependency maps and removes duplicate dependency keys', () => {
    const service = createService([
      { users: ['organizations', 'organizations'] },
      { profiles: ['users'], users: ['licenses'] },
    ]);

    expect(service.queryKeyDependencies).toEqual({
      profiles: ['users'],
      users: ['organizations', 'licenses'],
    });
  });

  it('creates generic keys for omitted, undefined, and falsey arguments', () => {
    const service = createService();

    expect(service.getGenericKey('users')).toEqual(['users']);
    expect(service.getGenericKey('users', undefined)).toEqual(['users']);
    expect(service.getGenericKey('users', '')).toEqual(['users', '']);
    expect(service.getGenericKey('users', 0)).toEqual(['users', '0']);
    expect(service.getGenericKey('users', false)).toEqual(['users', 'false']);
    expect(service.getGenericKey('users', null)).toEqual(['users', 'null']);
    expect(service.getGenericKey('users', 'user-id')).toEqual(['users', 'user-id']);
    expect(service.getGenericKey('users', { limit: 5 })).toEqual(['users', '{"limit":5}']);
  });

  it('throws rather than adding an unserializable argument to a query key', () => {
    const service = createService();

    expect(() => service.getGenericKey('users', Symbol('key'))).toThrowError(
      new TypeError('Query key argument cannot be serialized.'),
    );
  });

  it('returns item data by id and handles missing cache entries or ids', () => {
    const service = createService();
    const users = [
      { id: 'user-1' },
      { id: 'user-2' },
    ];
    service.queryClient.setQueryData(['users'], users);

    expect(service.getItemFromCache<{ id: string }>('users', 'user-2')).toEqual({ id: 'user-2' });
    expect(service.getItemFromCache<{ id: string }>('users', 'missing')).toBeUndefined();
    expect(service.getItemFromCache<{ id: string }>('organizations', 'org-1')).toBeUndefined();
  });

  it('returns valid query data and hides data after invalidation', async () => {
    const service = createService();
    service.queryClient.setQueryData(['users'], [{ id: 'user-1' }]);

    expect(service.getValidQueryData(['users'])).toEqual([{ id: 'user-1' }]);
    expect(service.getValidQueryData(['missing'])).toBeUndefined();

    await service.queryClient.invalidateQueries({ queryKey: ['users'] });

    expect(service.getValidQueryData(['users'])).toBeUndefined();
  });

  it('finds direct and transitive dependents while excluding the source key', () => {
    const service = createService([
      { users: ['organizations'] },
      { profiles: ['users'] },
      { settings: ['users'] },
      { audit: ['profiles'] },
      { organizations: ['audit'] },
    ]);

    expect(service.getQueryKeyDependencies(['organizations']).sort((left, right) => String(left[0]).localeCompare(String(right[0])))).toEqual([
      ['audit'],
      ['profiles'],
      ['settings'],
      ['users'],
    ]);
  });

  it('includes requested keys and deduplicates dependency results', () => {
    const service = createService([
      { users: ['organizations'] },
      { profiles: ['users'] },
    ]);

    expect(service.getQueryKeyDependencies(['organizations'], true)).toEqual([
      ['organizations'],
      ['users'],
      ['profiles'],
    ]);
    expect(service.getQueryKeyDependencies([], true)).toEqual([]);
  });

  it('deduplicates exact query keys without conflating different segments', () => {
    const service = createService();

    expect(service.getUniqueQueryKeys([
      ['a-b', 'c'],
      ['a', 'b-c'],
      ['a-b', 'c'],
    ])).toEqual([
      ['a-b', 'c'],
      ['a', 'b-c'],
    ]);
  });

  it('cancels unique query keys and accepts an empty nullish list', async () => {
    const service = createService();
    const cancelSpy = vi.spyOn(service.queryClient, 'cancelQueries');

    await service.cancelQueries([['users'], ['users'], ['organizations']]);
    expect(cancelSpy).toHaveBeenCalledTimes(2);

    await service.cancelQueries(undefined);
    expect(cancelSpy).toHaveBeenCalledTimes(2);
  });

  it('invalidates each unique query and removes requested query data', async () => {
    const service = createService();
    service.queryClient.setQueryData(['users'], [{ id: 'user-1' }]);
    service.queryClient.setQueryData(['organizations'], [{ id: 'org-1' }]);

    await service.invalidateQueryKeys([['users'], ['users']]);

    expect(service.getValidQueryData(['users'])).toBeUndefined();
    expect(service.getValidQueryData(['organizations'])).toEqual([{ id: 'org-1' }]);

    service.removeQueries([['users'], ['users']]);

    expect(service.queryClient.getQueryData(['users'])).toBeUndefined();
    expect(service.queryClient.getQueryData(['organizations'])).toEqual([{ id: 'org-1' }]);
  });

  it('accepts an empty nullish invalidation and removal list', async () => {
    const service = createService();

    await service.invalidateQueryKeys(null);
    expect(() => service.removeQueries(null)).not.toThrow();
  });
});
