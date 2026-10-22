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
import type {
  CaseDbCaseStats,
  CaseDbRetrieveCaseTypeStatsRequestBody,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useCaseTypeStatsQuery } from './useCaseTypeStatsQuery';

const createStats = (caseTypeId: string): CaseDbCaseStats => ({
  case_type_id: caseTypeId,
  n_cases: 2,
  n_own_cases: 1,
});

const createHookContext = (error?: Error) => {
  const retrieveCaseTypeStats = vi.fn(async (request: CaseDbRetrieveCaseTypeStatsRequestBody, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({
      data: request.case_type_ids?.map(createStats) ?? [],
      request,
      signal,
    });
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
  container.registerInstance(CaseDbCaseApi, { retrieveCaseTypeStats } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveCaseTypeStats,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseTypeStatsQuery', () => {
  it('uses empty request options by default', async () => {
    const { dispose, retrieveCaseTypeStats, wrapper } = createHookContext();
    const { result, unmount } = renderHook(() => useCaseTypeStatsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(retrieveCaseTypeStats).toHaveBeenCalledOnce();
    expect(retrieveCaseTypeStats.mock.calls[0]?.[0]).toEqual({});
    expect(retrieveCaseTypeStats.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('refetches when the case-type filter changes', async () => {
    const { dispose, retrieveCaseTypeStats, wrapper } = createHookContext();
    const firstOptions = { case_type_ids: ['type-1'] };
    const secondOptions = { case_type_ids: ['type-2'] };
    const { rerender, result, unmount } = renderHook(
      ({ options }: { options: CaseDbRetrieveCaseTypeStatsRequestBody }) => useCaseTypeStatsQuery(options),
      { initialProps: { options: firstOptions }, wrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual([createStats('type-1')]);
    });

    rerender({ options: secondOptions });

    await waitFor(() => {
      expect(result.current.data).toEqual([createStats('type-2')]);
    });

    expect(retrieveCaseTypeStats).toHaveBeenCalledTimes(2);
    expect(retrieveCaseTypeStats.mock.calls.map(([request]) => request)).toEqual([firstOptions, secondOptions]);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case-type stats unavailable');
    const { dispose, wrapper } = createHookContext(error);
    const { result, unmount } = renderHook(() => useCaseTypeStatsQuery(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
