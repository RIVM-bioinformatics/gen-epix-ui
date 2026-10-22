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
import type { CaseDbCaseSetRights } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useCaseSetRightsQuery } from './useCaseSetRightsQuery';

const createHookContext = (rights: CaseDbCaseSetRights[], error?: Error) => {
  const retrieveCaseSetRights = vi.fn(async (caseSetIds: string[], options: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ caseSetIds, data: rights, signal: options.signal });
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
  container.registerInstance(CaseDbCaseApi, { retrieveCaseSetRights } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveCaseSetRights,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseSetRightsQuery', () => {
  it('loads rights for the requested case sets', async () => {
    const rights = [{} as CaseDbCaseSetRights];
    const { dispose, retrieveCaseSetRights, wrapper } = createHookContext(rights);
    const { result, unmount } = renderHook(() => useCaseSetRightsQuery(['case-set-1', 'case-set-2']), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(rights);
    expect(retrieveCaseSetRights).toHaveBeenCalledOnce();
    expect(retrieveCaseSetRights.mock.calls[0]?.[0]).toEqual(['case-set-1', 'case-set-2']);
    expect(retrieveCaseSetRights.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Case-set rights unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseSetRightsQuery(['case-set-1']), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
