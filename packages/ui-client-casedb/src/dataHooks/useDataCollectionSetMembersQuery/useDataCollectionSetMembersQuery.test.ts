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
import type { CaseDbDataCollectionSetMember } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useDataCollectionSetMembersQuery } from './useDataCollectionSetMembersQuery';

const createMember = (setId: string, dataCollectionId: string): CaseDbDataCollectionSetMember => ({
  data_collection_id: dataCollectionId,
  data_collection_set_id: setId,
});

const createHookContext = (members: CaseDbDataCollectionSetMember[], error?: Error) => {
  const dataCollectionSetMembersGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
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
  container.registerInstance(CaseDbOrganizationApi, { dataCollectionSetMembersGetAll } as unknown as CaseDbOrganizationApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dataCollectionSetMembersGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useDataCollectionSetMembersQuery', () => {
  it('loads members and passes the abort signal to the API', async () => {
    const members = [createMember('set-1', 'data-collection-1')];
    const { dataCollectionSetMembersGetAll, dispose, wrapper } = createHookContext(members);
    const { result, unmount } = renderHook(() => useDataCollectionSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(members);
    expect(dataCollectionSetMembersGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(dataCollectionSetMembersGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Data-collection set members unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useDataCollectionSetMembersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
