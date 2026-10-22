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
import {
  CaseDbCaseApi,
  CaseDbColType,
} from '@gen-epix/api-casedb';
import type { CaseDbRefCol } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useRefColMapQuery,
  useRefColOptionsQuery,
  useRefColsQuery,
} from './useRefColsQuery';

const createRefCol = (id: string, label: string, rank: number): CaseDbRefCol => ({
  code: id,
  col_type: CaseDbColType.TEXT,
  id,
  label,
  rank,
  ref_dim_id: 'dim-1',
});

const createHookContext = (refCols: CaseDbRefCol[], error?: Error) => {
  const refColsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: refCols, signal });
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
  container.registerInstance(CaseDbCaseApi, { refColsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    refColsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useRefColsQuery', () => {
  it('loads reference columns and passes the abort signal to the API', async () => {
    const refCols = [createRefCol('col-1', 'Field one', 1)];
    const { dispose, refColsGetAll, wrapper } = createHookContext(refCols);
    const { result, unmount } = renderHook(() => useRefColsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(refCols);
    expect(refColsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(refColsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Reference columns unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useRefColsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useRefColMapQuery', () => {
  it('maps reference columns by ID', async () => {
    const refCols = [
      createRefCol('col-1', 'Field one', 1),
      createRefCol('col-2', 'Field two', 2),
    ];
    const { dispose, wrapper } = createHookContext(refCols);
    const { result, unmount } = renderHook(() => useRefColMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('col-1')).toEqual(refCols[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Reference columns unavailable'));
    const { result, unmount } = renderHook(() => useRefColMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useRefColOptionsQuery', () => {
  it('creates reference-column options sorted by rank', async () => {
    const refCols = [
      createRefCol('col-2', 'Field two', 2),
      createRefCol('col-1', 'Field one', 1),
    ];
    const { dispose, wrapper } = createHookContext(refCols);
    const { result, unmount } = renderHook(() => useRefColOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Field one', value: 'col-1' },
      { label: 'Field two', value: 'col-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Reference columns unavailable'));
    const { result, unmount } = renderHook(() => useRefColOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
