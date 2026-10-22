import {
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Loadable } from '../../models/data-hooks.models';

import { DataHookUtil } from './DataHookUtil';

interface TestItem {
  id: string;
  name: string;
  rank: number;
}

const createLoadable = (overrides: Partial<Loadable> = {}): Loadable => ({
  error: null,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  ...overrides,
});

const createQueryResult = <TItem,>(items: TItem[] | undefined, enabled = true): UseQueryResult<TItem[]> => {
  const queryClient = new QueryClient();
  const queryObserver = new QueryObserver<TItem[]>(queryClient, {
    enabled,
    initialData: items,
    queryFn: async () => Promise.resolve(items ?? []),
    queryKey: ['DataHookUtil'],
  });
  const queryResult = queryObserver.getCurrentResult();

  queryObserver.destroy();
  queryClient.clear();

  return queryResult;
};

const createItems = (): TestItem[] => [
  { id: 'z', name: 'Zulu', rank: 1 },
  { id: 'a', name: 'Alpha', rank: 3 },
  { id: 'm', name: 'Mike', rank: 2 },
];

describe('DataHookUtil.createUseMapDataHook', () => {
  it('maps array responses by ID and reports the empty-loadable state', () => {
    const items = createItems();

    const result = DataHookUtil.createUseMapDataHook(items, item => item.id);

    expect([...result.map.entries()]).toEqual(items.map(item => [item.id, item]));
    expect(result).toMatchObject({
      error: null,
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
    });
  });

  it('uses data from a query response and keeps the last item for duplicate IDs', () => {
    const items = createItems();
    const duplicateItems = [items[0], { ...items[1], id: items[0].id }];
    const queryResult = createQueryResult(duplicateItems);

    const result = DataHookUtil.createUseMapDataHook(queryResult, item => item.id);

    expect(result.map.size).toBe(1);
    expect(result.map.get(items[0].id)).toBe(duplicateItems[1]);
    expect(result.isEnabled).toBe(true);
  });

  it('returns an empty map while any enabled loadable is loading', () => {
    const loadable = createLoadable({
      isFetching: true,
      isLoading: true,
      isPending: true,
    });

    const result = DataHookUtil.createUseMapDataHook(createItems(), item => item.id, [loadable]);

    expect(result.map.size).toBe(0);
    expect(result).toMatchObject({
      error: null,
      isEnabled: true,
      isFetching: true,
      isLoading: true,
      isPending: true,
    });
  });

  it('returns the first enabled error without creating a map', () => {
    const disabledError = new Error('disabled failure');
    const enabledError = new Error('request failure');
    const result = DataHookUtil.createUseMapDataHook(
      createItems(),
      item => item.id,
      [
        createLoadable({ error: disabledError, isEnabled: false }),
        createLoadable({ error: enabledError, isFetching: true }),
      ],
    );

    expect(result.error).toBe(enabledError);
    expect(result.map.size).toBe(0);
    expect(result.isEnabled).toBe(false);
    expect(result.isFetching).toBe(true);
  });

  it('handles malformed responses and non-array loadables when an error short-circuits mapping', () => {
    const error = new Error('load failed');
    const errorLoadable = createLoadable({ error });
    const malformedResponses: unknown[] = [
      null,
      'not a response',
      {},
      { isLoading: false },
      { isFetching: false, isLoading: false },
      { isFetching: false, isLoading: false, isPending: false },
      { isEnabled: true, isFetching: false, isLoading: false, isPending: false },
    ];

    for (const response of malformedResponses) {
      const result = DataHookUtil.createUseMapDataHook(
        response as TestItem[] | UseQueryResult<TestItem[]>,
        item => item.id,
        [errorLoadable],
      );
      expect(result.error).toBe(error);
    }

    const result = DataHookUtil.createUseMapDataHook<TestItem>(
      null,
      item => item.id,
      null,
    );
    expect(result.map.size).toBe(0);
    expect(result.isEnabled).toBe(true);
  });
});

describe('DataHookUtil.createUseNameFactoryHook', () => {
  it('returns the provided name factory when no loadables are supplied', () => {
    const getName = (item: TestItem) => item.name;
    const result = DataHookUtil.createUseNameFactoryHook(getName);

    expect(result.getName).toBe(getName);
    expect(result).toMatchObject({
      error: null,
      isEnabled: false,
      isFetching: false,
      isLoading: false,
      isPending: false,
    });
  });

  it('returns an empty name while a loadable is loading', () => {
    const getName = (item: TestItem) => item.name;
    const result = DataHookUtil.createUseNameFactoryHook(getName, [
      createLoadable({ isFetching: true, isLoading: true, isPending: true }),
    ]);

    expect(result.getName(createItems()[0])).toBe('');
    expect(result).toMatchObject({
      isEnabled: true,
      isFetching: true,
      isLoading: true,
      isPending: true,
    });
  });

  it('returns an enabled error state while preserving the name factory', () => {
    const getName = (item: TestItem) => item.name;
    const error = new Error('name dependency failed');
    const result = DataHookUtil.createUseNameFactoryHook(getName, [
      createLoadable({
        error,
        isFetching: true,
        isLoading: true,
        isPending: true,
      }),
    ]);

    expect(result.getName).toBe(getName);
    expect(result.error).toBe(error);
    expect(result).toMatchObject({
      isEnabled: true,
      isFetching: false,
      isLoading: false,
      isPending: false,
    });
  });

  it('ignores errors from disabled loadables and treats an empty loadable list as enabled', () => {
    const getName = (item: TestItem) => item.name;
    const disabledError = new Error('disabled');
    const disabledResult = DataHookUtil.createUseNameFactoryHook(getName, [
      createLoadable({ error: disabledError, isEnabled: false }),
    ]);
    const emptyResult = DataHookUtil.createUseNameFactoryHook(getName, []);

    expect(disabledResult.error).toBeUndefined();
    expect(disabledResult.isEnabled).toBe(false);
    expect(emptyResult.error).toBeUndefined();
    expect(emptyResult.isEnabled).toBe(true);
  });
});

describe('DataHookUtil.createUseOptionsDataHook', () => {
  it('creates default-sorted options without mutating the input array', () => {
    const items = createItems();
    const originalOrder = [...items];

    const result = DataHookUtil.createUseOptionsDataHook(
      items,
      item => item.id,
      item => item.name,
    );

    expect(result.options).toEqual([
      { label: 'Alpha', value: 'a' },
      { label: 'Mike', value: 'm' },
      { label: 'Zulu', value: 'z' },
    ]);
    expect(items).toEqual(originalOrder);
    expect(result.isEnabled).toBe(true);
  });

  it('uses query data and a caller-provided comparator', () => {
    const items = createItems();
    const queryResult = createQueryResult(items);

    const result = DataHookUtil.createUseOptionsDataHook(
      queryResult,
      item => item.id,
      item => item.name,
      [],
      (firstItem, secondItem) => secondItem.rank - firstItem.rank,
    );

    expect(result.options.map(option => option.value)).toEqual(['a', 'm', 'z']);
    expect(result.isEnabled).toBe(true);
  });

  it('returns no options while loading', () => {
    const result = DataHookUtil.createUseOptionsDataHook(
      createItems(),
      item => item.id,
      item => item.name,
      [createLoadable({ isFetching: true, isLoading: true, isPending: true })],
    );

    expect(result.options).toEqual([]);
    expect(result.isLoading).toBe(true);
    expect(result.isFetching).toBe(true);
    expect(result.isPending).toBe(true);
  });

  it('returns an empty option list when an enabled loadable has an error', () => {
    const error = new Error('options failed');
    const result = DataHookUtil.createUseOptionsDataHook(
      createItems(),
      item => item.id,
      item => item.name,
      [createLoadable({ error })],
    );

    expect(result.options).toEqual([]);
    expect(result.error).toBe(error);
    expect(result.isEnabled).toBe(true);
  });

  it('returns no options when query data is not yet available', () => {
    const queryResult = createQueryResult<TestItem>(undefined, false);

    const result = DataHookUtil.createUseOptionsDataHook(
      queryResult,
      item => item.id,
      item => item.name,
    );

    expect(result.options).toEqual([]);
    expect(result.isEnabled).toBe(false);
    expect(result.isPending).toBe(false);
  });
});
