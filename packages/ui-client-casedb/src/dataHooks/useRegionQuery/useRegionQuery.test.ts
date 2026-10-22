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
import type {
  CaseDbRegion,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useRegionMapQuery,
  useRegionNameFactory,
  useRegionOptionsQuery,
  useRegionQuery,
} from './useRegionQuery';

type HookContextOptions = {
  regionError?: Error;
  regions?: CaseDbRegion[];
  regionSetError?: Error;
  regionSets?: CaseDbRegionSet[];
};

const createRegion = (id: string, regionSetId: string, name: string): CaseDbRegion => ({
  center_lat: 1,
  center_lon: 2,
  centroid_lat: 3,
  centroid_lon: 4,
  code: id,
  id,
  name,
  region_set_id: regionSetId,
});

const createRegionSet = (id: string, name: string): CaseDbRegionSet => ({
  code: id,
  id,
  name,
  region_code_as_label: false,
  resolution: 1,
});

const createHookContext = ({
  regionError,
  regions = [],
  regionSetError,
  regionSets = [],
}: HookContextOptions = {}) => {
  const regionsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (regionError) {
      return Promise.reject(regionError);
    }
    return Promise.resolve({ data: regions, signal });
  });
  const regionSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (regionSetError) {
      return Promise.reject(regionSetError);
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
  container.registerInstance(CaseDbGeoApi, { regionSetsGetAll, regionsGetAll } as unknown as CaseDbGeoApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    regionSetsGetAll,
    regionsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useRegionQuery', () => {
  it('loads regions and passes the abort signal to the API', async () => {
    const regions = [createRegion('region-1', 'set-1', 'Region one')];
    const { dispose, regionsGetAll, wrapper } = createHookContext({ regions });
    const { result, unmount } = renderHook(() => useRegionQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(regions);
    expect(regionsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(regionsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Regions unavailable');
    const { dispose, wrapper } = createHookContext({ regionError: error });
    const { result, unmount } = renderHook(() => useRegionQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useRegionMapQuery', () => {
  it('maps regions by ID', async () => {
    const regions = [
      createRegion('region-1', 'set-1', 'Region one'),
      createRegion('region-2', 'set-1', 'Region two'),
    ];
    const { dispose, wrapper } = createHookContext({ regions });
    const { result, unmount } = renderHook(() => useRegionMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('region-1')).toEqual(regions[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ regionError: new Error('Regions unavailable') });
    const { result, unmount } = renderHook(() => useRegionMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useRegionNameFactory', () => {
  it('uses region-set names or falls back to region-set IDs', async () => {
    const regionSets = [createRegionSet('set-1', 'Set one')];
    const { dispose, wrapper } = createHookContext({ regionSets });
    const { result, unmount } = renderHook(() => useRegionNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createRegion('region-1', 'set-1', 'Region one'))).toBe('Set one -> Region one');
    expect(result.current.getName(createRegion('region-2', 'missing-set', 'Region two'))).toBe('missing-set -> Region two');

    act(() => unmount());
    dispose();
  });

  it('surfaces region-set lookup failures and retains the ID fallback', async () => {
    const { dispose, wrapper } = createHookContext({ regionSetError: new Error('Region sets unavailable') });
    const { result, unmount } = renderHook(() => useRegionNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createRegion('region-1', 'set-1', 'Region one'))).toBe('set-1 -> Region one');

    act(() => unmount());
    dispose();
  });
});

describe('useRegionOptionsQuery', () => {
  it('creates region options with region-set names', async () => {
    const regions = [
      createRegion('region-2', 'set-1', 'Zulu region'),
      createRegion('region-1', 'set-1', 'Alpha region'),
    ];
    const regionSets = [createRegionSet('set-1', 'Set one')];
    const { dispose, wrapper } = createHookContext({ regions, regionSets });
    const { result, unmount } = renderHook(() => useRegionOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Set one -> Alpha region', value: 'region-1' },
      { label: 'Set one -> Zulu region', value: 'region-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when region loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ regionError: new Error('Regions unavailable') });
    const { result, unmount } = renderHook(() => useRegionOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
