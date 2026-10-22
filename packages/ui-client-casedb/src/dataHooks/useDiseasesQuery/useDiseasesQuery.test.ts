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
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type { CaseDbDisease } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useDiseaseOptionsQuery,
  useDiseasesMapQuery,
  useDiseasesQuery,
} from './useDiseasesQuery';

const createDisease = (id: string, name: string): CaseDbDisease => ({ id, name });

const createHookContext = (diseases: CaseDbDisease[], error?: Error) => {
  const diseasesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: diseases, signal });
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
  container.registerInstance(CaseDbOntologyApi, { diseasesGetAll } as unknown as CaseDbOntologyApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    diseasesGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useDiseasesQuery', () => {
  it('loads diseases and passes the abort signal to the API', async () => {
    const diseases = [createDisease('disease-1', 'Disease one')];
    const { diseasesGetAll, dispose, wrapper } = createHookContext(diseases);
    const { result, unmount } = renderHook(() => useDiseasesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(diseases);
    expect(diseasesGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(diseasesGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Diseases unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useDiseasesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useDiseasesMapQuery', () => {
  it('maps diseases by ID', async () => {
    const diseases = [
      createDisease('disease-1', 'Disease one'),
      createDisease('disease-2', 'Disease two'),
    ];
    const { dispose, wrapper } = createHookContext(diseases);
    const { result, unmount } = renderHook(() => useDiseasesMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('disease-1')).toEqual(diseases[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Diseases unavailable'));
    const { result, unmount } = renderHook(() => useDiseasesMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useDiseaseOptionsQuery', () => {
  it('creates disease options sorted by name', async () => {
    const diseases = [
      createDisease('disease-2', 'Zulu disease'),
      createDisease('disease-1', 'Alpha disease'),
    ];
    const { dispose, wrapper } = createHookContext(diseases);
    const { result, unmount } = renderHook(() => useDiseaseOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha disease', value: 'disease-1' },
      { label: 'Zulu disease', value: 'disease-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Diseases unavailable'));
    const { result, unmount } = renderHook(() => useDiseaseOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
