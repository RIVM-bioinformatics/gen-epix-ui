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
import type { CaseDbCaseType } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  caseTypesQueryFn,
  useCaseTypeMapQuery,
  useCaseTypeOptionsQuery,
  useCaseTypesQuery,
} from './useCaseTypesQuery';

const createCaseType = (id: string, name: string): CaseDbCaseType => ({ id, name });

const createHookContext = (caseTypes: CaseDbCaseType[], error?: Error) => {
  const caseTypesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: caseTypes, signal });
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
  container.registerInstance(CaseDbCaseApi, { caseTypesGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseTypesGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('caseTypesQueryFn', () => {
  it('passes the abort signal and returns case types sorted by name', async () => {
    const caseTypes = [createCaseType('type-2', 'Zulu'), createCaseType('type-1', 'Alpha')];
    const { caseTypesGetAll, dispose } = createHookContext(caseTypes);
    const signal = new AbortController().signal;

    const result = await caseTypesQueryFn({ signal });

    expect(result.map(caseType => caseType.name)).toEqual(['Alpha', 'Zulu']);
    expect(caseTypesGetAll).toHaveBeenCalledWith(null, null, { signal });

    dispose();
  });
});

describe('useCaseTypesQuery', () => {
  it('returns sorted case types', async () => {
    const caseTypes = [createCaseType('type-2', 'Zulu'), createCaseType('type-1', 'Alpha')];
    const { dispose, wrapper } = createHookContext(caseTypes);
    const { result, unmount } = renderHook(() => useCaseTypesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map(caseType => caseType.name)).toEqual(['Alpha', 'Zulu']);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case types unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseTypesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseTypeMapQuery', () => {
  it('maps case types by ID', async () => {
    const caseTypes = [createCaseType('type-1', 'Alpha'), createCaseType('type-2', 'Beta')];
    const { dispose, wrapper } = createHookContext(caseTypes);
    const { result, unmount } = renderHook(() => useCaseTypeMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('type-1')).toEqual(caseTypes[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Case types unavailable'));
    const { result, unmount } = renderHook(() => useCaseTypeMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseTypeOptionsQuery', () => {
  it('creates case-type options sorted by name', async () => {
    const caseTypes = [createCaseType('type-2', 'Zulu'), createCaseType('type-1', 'Alpha')];
    const { dispose, wrapper } = createHookContext(caseTypes);
    const { result, unmount } = renderHook(() => useCaseTypeOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha', value: 'type-1' },
      { label: 'Zulu', value: 'type-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Case types unavailable'));
    const { result, unmount } = renderHook(() => useCaseTypeOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
