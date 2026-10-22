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
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useCaseSetOptionsQuery,
  useCaseSetsMapQuery,
  useCaseSetsQuery,
} from './useCaseSetsQuery';

const createCaseSet = (id: string, name: string, date: string): CaseDbCaseSet => ({
  case_set_category_id: 'category-1',
  case_set_date: date,
  case_set_status_id: 'status-1',
  case_type_id: 'case-type-1',
  code: id,
  created_in_data_collection_id: 'data-collection-1',
  description: `${name} description`,
  id,
  name,
});

const createHookContext = (caseSets: CaseDbCaseSet[], error?: Error) => {
  const caseSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: caseSets, signal });
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
  container.registerInstance(CaseDbCaseApi, { caseSetsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseSetsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseSetsQuery', () => {
  it('loads case sets and passes the abort signal to the API', async () => {
    const caseSets = [createCaseSet('case-set-1', 'Case set one', '2024-01-02')];
    const { caseSetsGetAll, dispose, wrapper } = createHookContext(caseSets);
    const { result, unmount } = renderHook(() => useCaseSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(caseSets);
    expect(caseSetsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(caseSetsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes case-set API failures', async () => {
    const error = new Error('Case sets unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseSetsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetsMapQuery', () => {
  it('maps case sets by ID', async () => {
    const caseSets = [
      createCaseSet('case-set-1', 'Case set one', '2024-01-02'),
      createCaseSet('case-set-2', 'Case set two', '2024-01-03'),
    ];
    const { dispose, wrapper } = createHookContext(caseSets);
    const { result, unmount } = renderHook(() => useCaseSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('case-set-1')).toEqual(caseSets[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when case-set loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Case sets unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetOptionsQuery', () => {
  it('creates sorted case-set name and date options', async () => {
    const caseSets = [
      createCaseSet('case-set-2', 'Zulu case set', '2024-01-03'),
      createCaseSet('case-set-1', 'Alpha case set', '2024-01-02'),
    ];
    const { dispose, wrapper } = createHookContext(caseSets);
    const { result, unmount } = renderHook(() => useCaseSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha case set (2024-01-02)', value: 'case-set-1' },
      { label: 'Zulu case set (2024-01-03)', value: 'case-set-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when case-set loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Case sets unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
