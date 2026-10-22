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
import type { CaseDbConceptSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useConceptSetMapQuery,
  useConceptSetOptionsQuery,
  useConceptSetsQuery,
} from './useConceptSetsQuery';

const createConceptSet = (id: string, name: string): CaseDbConceptSet => ({
  code: id,
  id,
  name,
  type: 'NOMINAL',
});

const createHookContext = (conceptSets: CaseDbConceptSet[], error?: Error) => {
  const conceptSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: conceptSets, signal });
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
  container.registerInstance(CaseDbOntologyApi, { conceptSetsGetAll } as unknown as CaseDbOntologyApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    conceptSetsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useConceptSetsQuery', () => {
  it('loads concept sets and passes the abort signal to the API', async () => {
    const conceptSets = [createConceptSet('set-1', 'Set one')];
    const { conceptSetsGetAll, dispose, wrapper } = createHookContext(conceptSets);
    const { result, unmount } = renderHook(() => useConceptSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(conceptSets);
    expect(conceptSetsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(conceptSetsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Concept sets unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useConceptSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useConceptSetMapQuery', () => {
  it('maps concept sets by ID', async () => {
    const conceptSets = [
      createConceptSet('set-1', 'Set one'),
      createConceptSet('set-2', 'Set two'),
    ];
    const { dispose, wrapper } = createHookContext(conceptSets);
    const { result, unmount } = renderHook(() => useConceptSetMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('set-1')).toEqual(conceptSets[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Concept sets unavailable'));
    const { result, unmount } = renderHook(() => useConceptSetMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useConceptSetOptionsQuery', () => {
  it('creates concept-set options sorted by name', async () => {
    const conceptSets = [
      createConceptSet('set-2', 'Zulu set'),
      createConceptSet('set-1', 'Alpha set'),
    ];
    const { dispose, wrapper } = createHookContext(conceptSets);
    const { result, unmount } = renderHook(() => useConceptSetOptionsQuery(), { wrapper });

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
    const { dispose, wrapper } = createHookContext([], new Error('Concept sets unavailable'));
    const { result, unmount } = renderHook(() => useConceptSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
