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
import {
  renderHook,
  waitFor,
} from '@testing-library/react';
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';

import { useInviteUserConstraintsQuery } from './useInviteUserConstraintsQuery';

const createHookContext = (hasPermission: boolean, constraints = {
  organization_ids: ['organization-1'],
  roles: ['reader'],
}) => {
  const inviteUserConstraints = vi.fn(async (_options: { signal: AbortSignal }) => Promise.resolve({ data: constraints }));
  const api = { inviteUserConstraints };
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const authorizationService = {
    doesUserHavePermission: vi.fn(() => hasPermission),
  } as unknown as AuthorizationService;
  container.registerInstance(API_ORGANIZATION_TOKEN, api as unknown as CommonDbOrganizationApi);
  container.registerInstance(AuthorizationService, authorizationService);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    api: { inviteUserConstraints },
    authorizationService,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useInviteUserConstraintsQuery', () => {
  it('returns empty constraints and skips the API when permission is denied', async () => {
    const { api, authorizationService, dispose, wrapper } = createHookContext(false);
    const { result, unmount } = renderHook(() => useInviteUserConstraintsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      organization_ids: [],
      roles: [],
    });
    expect(authorizationService.doesUserHavePermission).toHaveBeenCalledWith([
      { command_name: 'RetrieveInviteUserConstraintsCommand', permission_type: 'EXECUTE' },
    ]);
    expect(api.inviteUserConstraints).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('loads invitation constraints when permission is granted', async () => {
    const constraints = {
      organization_ids: ['organization-2', 'organization-1'],
      roles: ['admin', 'reader'],
    };
    const { api, dispose, wrapper } = createHookContext(true, constraints);
    const { result, unmount } = renderHook(() => useInviteUserConstraintsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(constraints);
    expect(api.inviteUserConstraints).toHaveBeenCalledOnce();
    expect(api.inviteUserConstraints.mock.calls[0]?.[0].signal).toBeDefined();

    unmount();
    dispose();
  });

  it('exposes errors from the invitation constraints API', async () => {
    const { api, dispose, wrapper } = createHookContext(true);
    const error = new Error('Constraints unavailable');
    api.inviteUserConstraints.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useInviteUserConstraintsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});
