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
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type { CaseDbDataCollection } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
  useDataCollectionsQuery,
} from './useDataCollectionsQuery';

const createDataCollection = (id: string, name: string): CaseDbDataCollection => ({ id, name });

const createHookContext = (dataCollections: CaseDbDataCollection[], error?: Error) => {
  const dataCollectionsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: dataCollections, signal });
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
  container.registerInstance(CaseDbOrganizationApi, { dataCollectionsGetAll } as unknown as CaseDbOrganizationApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dataCollectionsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useDataCollectionsQuery', () => {
  it('returns all collections by default and filters by the requested IDs', async () => {
    const dataCollections = [
      createDataCollection('collection-1', 'Collection one'),
      createDataCollection('collection-2', 'Collection two'),
    ];
    const { dataCollectionsGetAll, dispose, wrapper } = createHookContext(dataCollections);
    const { rerender, result, unmount } = renderHook(
      ({ ids }: { ids: string[] | undefined }) => useDataCollectionsQuery(ids),
      { initialProps: { ids: undefined }, wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(dataCollections);
    });

    rerender({ ids: ['collection-2'] });
    await waitFor(() => {
      expect(result.current.data).toEqual([dataCollections[1]]);
    });

    rerender({ ids: [] });
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });

    expect(dataCollectionsGetAll).toHaveBeenCalledExactlyOnceWith(null, null, expect.anything());
    expect(dataCollectionsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Data collections unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useDataCollectionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useDataCollectionsMapQuery', () => {
  it('maps the filtered collections by ID', async () => {
    const dataCollections = [
      createDataCollection('collection-1', 'Collection one'),
      createDataCollection('collection-2', 'Collection two'),
    ];
    const { dispose, wrapper } = createHookContext(dataCollections);
    const { result, unmount } = renderHook(() => useDataCollectionsMapQuery(['collection-2']), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(1);
    expect(result.current.map.get('collection-2')).toEqual(dataCollections[1]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Data collections unavailable'));
    const { result, unmount } = renderHook(() => useDataCollectionsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useDataCollectionOptionsQuery', () => {
  it('creates options from the filtered collections sorted by name', async () => {
    const dataCollections = [
      createDataCollection('collection-2', 'Zulu collection'),
      createDataCollection('collection-1', 'Alpha collection'),
    ];
    const { dispose, wrapper } = createHookContext(dataCollections);
    const { result, unmount } = renderHook(() => useDataCollectionOptionsQuery(['collection-1', 'collection-2']), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha collection', value: 'collection-1' },
      { label: 'Zulu collection', value: 'collection-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Data collections unavailable'));
    const { result, unmount } = renderHook(() => useDataCollectionOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
