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
import type { CaseDbCaseStats } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useCaseSetStatsMapQuery,
  useCaseSetStatsQuery,
} from './useCaseSetStatsQuery';

const createStats = (caseSetId: string): CaseDbCaseStats => ({
  case_set_id: caseSetId,
  case_type_id: 'case-type-1',
  n_cases: 2,
  n_own_cases: 1,
});

const createHookContext = (stats: CaseDbCaseStats[], error?: Error) => {
  const retrieveCaseSetStats = vi.fn(async (request: { case_set_ids: string[] }, options: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: stats, request, signal: options.signal });
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
  container.registerInstance(CaseDbCaseApi, { retrieveCaseSetStats } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveCaseSetStats,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseSetStatsQuery', () => {
  it('loads stats for the requested case sets', async () => {
    const stats = [createStats('case-set-1')];
    const { dispose, retrieveCaseSetStats, wrapper } = createHookContext(stats);
    const { result, unmount } = renderHook(() => useCaseSetStatsQuery(['case-set-1']), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(stats);
    expect(retrieveCaseSetStats.mock.calls[0]?.[0]).toEqual({ case_set_ids: ['case-set-1'] });
    expect(retrieveCaseSetStats.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('does not fetch when no case sets are selected', () => {
    const { dispose, retrieveCaseSetStats, wrapper } = createHookContext([]);
    const { result, unmount } = renderHook(() => useCaseSetStatsQuery([]), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(retrieveCaseSetStats).not.toHaveBeenCalled();

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case-set stats unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseSetStatsQuery(['case-set-1']), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetStatsMapQuery', () => {
  it('maps stats by case-set ID', async () => {
    const stats = [createStats('case-set-1'), createStats('case-set-2')];
    const { dispose, wrapper } = createHookContext(stats);
    const { result, unmount } = renderHook(() => useCaseSetStatsMapQuery(['case-set-1', 'case-set-2']), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('case-set-1')).toEqual(stats[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when stats loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Case-set stats unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetStatsMapQuery(['case-set-1']), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
