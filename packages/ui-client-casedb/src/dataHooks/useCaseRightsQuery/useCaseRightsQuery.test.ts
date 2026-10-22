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
import type { CaseDbCaseRights } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useCaseRightsQuery } from './useCaseRightsQuery';

const createHookContext = (rights: CaseDbCaseRights[], error?: Error) => {
  const retrieveCaseRights = vi.fn(async (request: { case_ids: string[]; case_type_id: string }, options: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: rights, request, signal: options.signal });
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
  container.registerInstance(CaseDbCaseApi, { retrieveCaseRights } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveCaseRights,
    wrapper,
  };
};

const createRights = (caseId: string): CaseDbCaseRights => ({
  add_data_collection_ids: [],
  can_delete: false,
  case_id: caseId,
  case_type_id: 'case-type-1',
  created_in_data_collection_id: 'data-collection-1',
  data_collection_ids: [],
  is_full_access: false,
  read_col_ids: [],
  remove_data_collection_ids: [],
  shared_in_data_collection_ids: [],
  write_col_ids: [],
});

afterEach(() => {
  container.clearInstances();
});

describe('useCaseRightsQuery', () => {
  it('loads case rights with the requested case and case-type IDs', async () => {
    const rights = [createRights('case-1')];
    const { dispose, retrieveCaseRights, wrapper } = createHookContext(rights);
    const { result, unmount } = renderHook(() => useCaseRightsQuery(['case-1'], 'case-type-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(rights);
    expect(retrieveCaseRights).toHaveBeenCalledOnce();
    expect(retrieveCaseRights.mock.calls[0]?.[0]).toEqual({
      case_ids: ['case-1'],
      case_type_id: 'case-type-1',
    });
    expect(retrieveCaseRights.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('does not fetch when explicitly disabled', () => {
    const { dispose, retrieveCaseRights, wrapper } = createHookContext([]);
    const { result, unmount } = renderHook(() => useCaseRightsQuery(['case-1'], 'case-type-1', false), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(retrieveCaseRights).not.toHaveBeenCalled();

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case rights unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseRightsQuery(['case-1'], 'case-type-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
