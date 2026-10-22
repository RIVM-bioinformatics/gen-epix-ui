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
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type { CaseDbRefDim } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useRefDimMapQuery,
  useRefDimOptionsQuery,
  useRefDimsQuery,
} from './useRefDimsQuery';

const createRefDim = (id: string, label: string, rank: number): CaseDbRefDim => ({
  code: id,
  dim_type: CaseDbDimType.GEO,
  id,
  label,
  rank,
});

const createHookContext = (refDims: CaseDbRefDim[], error?: Error) => {
  const refDimsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: refDims, signal });
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
  container.registerInstance(CaseDbCaseApi, { refDimsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    refDimsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useRefDimsQuery', () => {
  it('loads reference dimensions and passes the abort signal to the API', async () => {
    const refDims = [createRefDim('dim-1', 'Dimension one', 1)];
    const { dispose, refDimsGetAll, wrapper } = createHookContext(refDims);
    const { result, unmount } = renderHook(() => useRefDimsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(refDims);
    expect(refDimsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(refDimsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Reference dimensions unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useRefDimsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useRefDimMapQuery', () => {
  it('maps reference dimensions by ID', async () => {
    const refDims = [
      createRefDim('dim-1', 'Dimension one', 1),
      createRefDim('dim-2', 'Dimension two', 2),
    ];
    const { dispose, wrapper } = createHookContext(refDims);
    const { result, unmount } = renderHook(() => useRefDimMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('dim-1')).toEqual(refDims[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Reference dimensions unavailable'));
    const { result, unmount } = renderHook(() => useRefDimMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useRefDimOptionsQuery', () => {
  it('creates reference-dimension options sorted by rank', async () => {
    const refDims = [
      createRefDim('dim-2', 'Dimension two', 2),
      createRefDim('dim-1', 'Dimension one', 1),
    ];
    const { dispose, wrapper } = createHookContext(refDims);
    const { result, unmount } = renderHook(() => useRefDimOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Dimension one', value: 'dim-1' },
      { label: 'Dimension two', value: 'dim-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Reference dimensions unavailable'));
    const { result, unmount } = renderHook(() => useRefDimOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
