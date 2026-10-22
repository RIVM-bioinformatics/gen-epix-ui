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
import type { CaseDbCaseTypeSetMember } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useCaseTypeSetMembersQuery } from './useCaseTypeSetMembersQuery';

const createHookContext = (members: CaseDbCaseTypeSetMember[], error?: Error) => {
  const caseTypeSetMembersGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
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
  container.registerInstance(CaseDbCaseApi, { caseTypeSetMembersGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseTypeSetMembersGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseTypeSetMembersQuery', () => {
  it('loads members and passes the abort signal to the API', async () => {
    const members = [{} as CaseDbCaseTypeSetMember];
    const { caseTypeSetMembersGetAll, dispose, wrapper } = createHookContext(members);
    const { result, unmount } = renderHook(() => useCaseTypeSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(members);
    expect(caseTypeSetMembersGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(caseTypeSetMembersGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case-type-set members unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseTypeSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
