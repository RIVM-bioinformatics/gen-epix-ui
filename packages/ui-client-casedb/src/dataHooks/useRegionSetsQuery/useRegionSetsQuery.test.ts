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
import { CaseDbGeoApi } from '@gen-epix/api-casedb';
import type { CaseDbRegionSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useRegionSetOptionsQuery,
  useRegionSetsMapQuery,
  useRegionSetsQuery,
} from './useRegionSetsQuery';

const createRegionSet = (id: string, name: string): CaseDbRegionSet => ({
  code: id,
  id,
  name,
  region_code_as_label: false,
  resolution: 1,
});

const createHookContext = (regionSets: CaseDbRegionSet[], error?: Error) => {
  const regionSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: regionSets, signal });
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
  container.registerInstance(CaseDbGeoApi, { regionSetsGetAll } as unknown as CaseDbGeoApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    regionSetsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useRegionSetsQuery', () => {
  it('loads region sets and passes the abort signal to the API', async () => {
    const regionSets = [createRegionSet('set-1', 'Set one')];
    const { dispose, regionSetsGetAll, wrapper } = createHookContext(regionSets);
    const { result, unmount } = renderHook(() => useRegionSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(regionSets);
    expect(regionSetsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(regionSetsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Region sets unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useRegionSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useRegionSetsMapQuery', () => {
  it('maps region sets by ID', async () => {
    const regionSets = [
      createRegionSet('set-1', 'Set one'),
      createRegionSet('set-2', 'Set two'),
    ];
    const { dispose, wrapper } = createHookContext(regionSets);
    const { result, unmount } = renderHook(() => useRegionSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('set-1')).toEqual(regionSets[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Region sets unavailable'));
    const { result, unmount } = renderHook(() => useRegionSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useRegionSetOptionsQuery', () => {
  it('creates region-set options sorted by name', async () => {
    const regionSets = [
      createRegionSet('set-2', 'Zulu set'),
      createRegionSet('set-1', 'Alpha set'),
    ];
    const { dispose, wrapper } = createHookContext(regionSets);
    const { result, unmount } = renderHook(() => useRegionSetOptionsQuery(), { wrapper });

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
    const { dispose, wrapper } = createHookContext([], new Error('Region sets unavailable'));
    const { result, unmount } = renderHook(() => useRegionSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
