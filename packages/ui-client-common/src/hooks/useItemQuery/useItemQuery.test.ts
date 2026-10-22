import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { container } from 'tsyringe';

import type { GenericData } from '../../models/data.models';
import { QueryClientService } from '../../classes/services/QueryClientService';

import { useItemQuery } from './useItemQuery';

type TestItem = {
  name: string;
} & GenericData;

const createHookContext = () => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    queryClient: queryClientService.queryClient,
    wrapper,
  };
};

const createQueryOptions = (
  queryFn: () => Promise<TestItem>,
  enabled = true,
): Omit<UseQueryOptions<TestItem>, 'queryKey'> => ({
  enabled,
  queryFn,
  retry: false,
});

afterEach(() => {
  container.clearInstances();
});

describe('useItemQuery', () => {
  it('returns an item from the base list cache and suppresses the detail query', () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const cachedItem: TestItem = {
      id: 'item-1',
      name: 'Cached item',
    };
    const queryFn = vi.fn(async () => Promise.resolve({ id: 'item-1', name: 'Remote item' }));
    queryClient.setQueryData(['items'], [cachedItem]);
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    expect(result.current.data).toBe(cachedItem);
    expect(result.current.error).toBe(false);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('uses the detail query result when there is no cached list item', async () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const remoteItem: TestItem = {
      id: 'item-1',
      name: 'Remote item',
    };
    const queryFn = vi.fn(async () => Promise.resolve(remoteItem));
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(remoteItem);
    });

    expect(queryFn).toHaveBeenCalledOnce();
    expect(result.current.isEnabled).toBe(true);
    expect(queryClient.getQueryData(['items', 'item-1'])).toEqual(remoteItem);

    unmount();
    dispose();
  });

  it('returns the latest matching item when the base list cache changes', async () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const initialItem: TestItem = { id: 'item-1', name: 'Initial' };
    const updatedItem: TestItem = { id: 'item-1', name: 'Updated' };
    const remoteItem: TestItem = { id: 'item-1', name: 'Remote fallback' };
    const queryFn = vi.fn(async () => Promise.resolve(remoteItem));
    queryClient.setQueryData(['items'], [initialItem]);
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    act(() => {
      queryClient.setQueryData(['items'], [initialItem]);
    });
    expect(result.current.data).toBe(initialItem);

    act(() => {
      queryClient.setQueryData(['items'], [updatedItem]);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(updatedItem);
    });

    act(() => {
      queryClient.setQueryData(['items'], []);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(remoteItem);
    });
    expect(queryFn).toHaveBeenCalledOnce();

    unmount();
    dispose();
  });

  it('uses matching detail-cache updates and ignores detail data for another id', async () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const cachedItem: TestItem = { id: 'item-1', name: 'Cached' };
    const updatedItem: TestItem = { id: 'item-1', name: 'Detail update' };
    const queryFn = vi.fn(async () => Promise.resolve({ id: 'item-1', name: 'Remote' }));
    queryClient.setQueryData(['items'], [cachedItem]);
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    const equivalentDetailItem: TestItem = { id: 'item-1', name: 'Cached' };
    act(() => {
      queryClient.setQueryData(['items', 'item-1'], equivalentDetailItem);
    });
    expect(result.current.data).toBe(cachedItem);

    act(() => {
      queryClient.setQueryData(['items', 'item-1'], updatedItem);
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(updatedItem);
    });

    act(() => {
      queryClient.setQueryData(['items', 'item-1'], { id: 'other-id', name: 'Wrong item' });
      queryClient.setQueryData(['items', 'item-1', 'extra'], { id: 'extra', name: 'Extra key' });
      queryClient.setQueryData(['unrelated'], [{ id: 'item-1', name: 'Unrelated' }]);
    });

    expect(result.current.data).toEqual(updatedItem);
    expect(queryFn).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('ignores list-cache events without data', async () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const queryFn = vi.fn(async () => Promise.resolve({ id: 'item-1', name: 'Remote' }));
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn, false),
    }), { wrapper });
    let resolveList: ((items: TestItem[]) => void) | undefined;
    const listPromise = queryClient.fetchQuery({
      queryFn: async () => new Promise<TestItem[]>((resolve) => {
        resolveList = resolve;
      }),
      queryKey: ['items'],
      retry: false,
    });

    await waitFor(() => {
      expect(resolveList).toBeDefined();
    });
    expect(result.current.data).toBeUndefined();

    if (!resolveList) {
      throw new Error('Expected the base-list query to be pending');
    }
    resolveList([]);
    await listPromise;

    unmount();
    dispose();
  });

  it('clears the cached item when the base list query is removed', async () => {
    const { dispose, queryClient, wrapper } = createHookContext();
    const cachedItem: TestItem = { id: 'item-1', name: 'Cached' };
    const remoteItem: TestItem = { id: 'item-1', name: 'Remote' };
    const queryFn = vi.fn(async () => Promise.resolve(remoteItem));
    queryClient.setQueryData(['items'], [cachedItem]);
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    act(() => {
      queryClient.removeQueries({ exact: true, queryKey: ['items'] });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(remoteItem);
    });
    expect(queryFn).toHaveBeenCalledOnce();

    unmount();
    dispose();
  });

  it('respects a disabled detail query when no cached item is available', () => {
    const { dispose, wrapper } = createHookContext();
    const queryFn = vi.fn(async () => Promise.resolve({ id: 'item-1', name: 'Remote' }));
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn, false),
    }), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isEnabled).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('returns query errors when neither cache contains the item', async () => {
    const { dispose, wrapper } = createHookContext();
    const error = new Error('Item unavailable');
    const queryFn = vi.fn(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useItemQuery({
      baseQueryKey: 'items',
      itemId: 'item-1',
      useQueryOptions: createQueryOptions(queryFn),
    }), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    expect(result.current.data).toBeUndefined();

    unmount();
    dispose();
  });
});
