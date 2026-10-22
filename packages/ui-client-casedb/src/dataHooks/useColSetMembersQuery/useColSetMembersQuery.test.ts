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
import type { CaseDbColSetMember } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useColSetMembersQuery } from './useColSetMembersQuery';

const createMember = (colSetId: string, colId: string): CaseDbColSetMember => ({
  col_id: colId,
  col_set_id: colSetId,
});

const createHookContext = (members: CaseDbColSetMember[], error?: Error) => {
  const colSetMembersGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: members, signal });
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
  container.registerInstance(CaseDbCaseApi, { colSetMembersGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    colSetMembersGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useColSetMembersQuery', () => {
  it('loads members and passes the abort signal to the API', async () => {
    const members = [createMember('set-1', 'col-1')];
    const { colSetMembersGetAll, dispose, wrapper } = createHookContext(members);
    const { result, unmount } = renderHook(() => useColSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(members);
    expect(colSetMembersGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(colSetMembersGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Column-set members unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useColSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
