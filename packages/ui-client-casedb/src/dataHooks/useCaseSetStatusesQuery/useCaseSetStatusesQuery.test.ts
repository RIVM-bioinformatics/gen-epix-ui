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
import type { CaseDbCaseSetStatus } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useCaseSetStatusesQuery,
  useCaseSetStatusMapQuery,
  useCaseSetStatusOptionsQuery,
} from './useCaseSetStatusesQuery';

const createStatus = (id: string, name: string, rank?: number): CaseDbCaseSetStatus => ({
  description: null,
  id,
  name,
  ...(rank === undefined ? {} : { rank }),
});

const createHookContext = (statuses: CaseDbCaseSetStatus[], error?: Error) => {
  const caseSetStatusesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: statuses, signal });
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
  container.registerInstance(CaseDbCaseApi, { caseSetStatusesGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseSetStatusesGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseSetStatusesQuery', () => {
  it('loads statuses and passes the abort signal to the API', async () => {
    const statuses = [createStatus('status-1', 'Status one', 1)];
    const { caseSetStatusesGetAll, dispose, wrapper } = createHookContext(statuses);
    const { result, unmount } = renderHook(() => useCaseSetStatusesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(statuses);
    expect(caseSetStatusesGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(caseSetStatusesGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes status API failures', async () => {
    const error = new Error('Statuses unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseSetStatusesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetStatusMapQuery', () => {
  it('maps statuses by ID', async () => {
    const statuses = [createStatus('status-1', 'Status one'), createStatus('status-2', 'Status two')];
    const { dispose, wrapper } = createHookContext(statuses);
    const { result, unmount } = renderHook(() => useCaseSetStatusMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('status-1')).toEqual(statuses[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when status loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Statuses unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetStatusMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetStatusOptionsQuery', () => {
  it('sorts status options by rank and then name', async () => {
    const statuses = [
      createStatus('status-3', 'Zulu status', 2),
      createStatus('status-2', 'Beta status', 1),
      createStatus('status-1', 'Alpha status'),
    ];
    const { dispose, wrapper } = createHookContext(statuses);
    const { result, unmount } = renderHook(() => useCaseSetStatusOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha status', value: 'status-1' },
      { label: 'Beta status', value: 'status-2' },
      { label: 'Zulu status', value: 'status-3' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when status loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Statuses unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetStatusOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
