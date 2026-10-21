import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';

import { useQueryMemo } from './useQueryMemo';

const createQueryClient = (): QueryClient => new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      retry: false,
      staleTime: Infinity,
    },
  },
});

const createWrapper = (queryClient: QueryClient) => ({ children }: PropsWithChildren) => createElement(
  QueryClientProvider,
  { client: queryClient },
  children,
);

describe('useQueryMemo', () => {
  it('returns query results through the React query lifecycle and memoizes unchanged results', async () => {
    const queryClient = createQueryClient();
    const queryFn = vi.fn(async () => Promise.resolve({ value: 'loaded' }));
    const { rerender, result, unmount } = renderHook(() => useQueryMemo({
      queryFn,
      queryKey: ['memo-query'],
    }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const previousResult = result.current;
    rerender();

    expect(result.current).toBe(previousResult);
    expect(result.current.data).toEqual({ value: 'loaded' });
    expect(queryFn).toHaveBeenCalledOnce();

    unmount();
    queryClient.clear();
  });

  it('returns fresh metadata when the cached data stays equal but its update time changes', async () => {
    const queryClient = createQueryClient();
    const queryKey = ['timestamp-query'];
    const data = { value: 'unchanged' };
    const initialUpdatedAt = Date.now() - 10000;
    queryClient.setQueryData(queryKey, data, { updatedAt: initialUpdatedAt });
    const { result, unmount } = renderHook(() => useQueryMemo({
      queryFn: async () => Promise.resolve(data),
      queryKey,
    }), { wrapper: createWrapper(queryClient) });

    expect(result.current.dataUpdatedAt).toBe(initialUpdatedAt);

    const updatedAt = initialUpdatedAt + 5000;
    act(() => {
      queryClient.setQueryData(queryKey, data, { updatedAt });
    });

    await waitFor(() => {
      expect(result.current.dataUpdatedAt).toBe(updatedAt);
    });

    unmount();
    queryClient.clear();
  });

  it('supports data that cannot be JSON-stringified', async () => {
    const queryClient = createQueryClient();
    const bigintData = { value: 1n };
    const { result, unmount } = renderHook(() => useQueryMemo({
      queryFn: async () => Promise.resolve(bigintData),
      queryKey: ['bigint-query'],
    }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(bigintData);

    unmount();
    queryClient.clear();
  });

  it('exposes query errors', async () => {
    const queryClient = createQueryClient();
    const error = new Error('query failed');
    const { result, unmount } = renderHook(() => useQueryMemo({
      queryFn: async () => Promise.reject(error),
      queryKey: ['error-query'],
    }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    queryClient.clear();
  });

  it('uses an explicitly provided query client without a provider', async () => {
    const queryClient = createQueryClient();
    const queryFn = vi.fn(async () => Promise.resolve({ value: 'provided client' }));
    const { result, unmount } = renderHook(() => useQueryMemo({
      queryFn,
      queryKey: ['explicit-client'],
    }, queryClient));

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 'provided client' });
    });

    expect(queryFn).toHaveBeenCalledOnce();

    unmount();
    queryClient.clear();
  });
});
