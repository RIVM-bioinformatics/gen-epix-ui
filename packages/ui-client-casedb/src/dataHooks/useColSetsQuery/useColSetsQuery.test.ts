import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
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
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { CaseDbColSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useColSetMapQuery,
  useColSetOptionsQuery,
  useColSetsQuery,
} from './useColSetsQuery';

const createColSet = (id: string, name: string): CaseDbColSet => ({ id, name });

const createHookContext = (colSets: CaseDbColSet[], error?: Error) => {
  const colSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: colSets, signal });
  });
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(CaseDbCaseApi, { colSetsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    colSetsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useColSetsQuery', () => {
  it('loads column sets and passes the abort signal to the API', async () => {
    const colSets = [createColSet('set-1', 'Column set one')];
    const { colSetsGetAll, dispose, wrapper } = createHookContext(colSets);
    const { result, unmount } = renderHook(() => useColSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(colSets);
    expect(colSetsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(colSetsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Column sets unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useColSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useColSetMapQuery', () => {
  it('maps column sets by ID', async () => {
    const colSets = [createColSet('set-1', 'Column set one'), createColSet('set-2', 'Column set two')];
    const { dispose, wrapper } = createHookContext(colSets);
    const { result, unmount } = renderHook(() => useColSetMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('set-1')).toEqual(colSets[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Column sets unavailable'));
    const { result, unmount } = renderHook(() => useColSetMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useColSetOptionsQuery', () => {
  it('creates options sorted by column-set name', async () => {
    const colSets = [createColSet('set-2', 'Zulu set'), createColSet('set-1', 'Alpha set')];
    const { dispose, wrapper } = createHookContext(colSets);
    const { result, unmount } = renderHook(() => useColSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha set', value: 'set-1' },
      { label: 'Zulu set', value: 'set-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Column sets unavailable'));
    const { result, unmount } = renderHook(() => useColSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
