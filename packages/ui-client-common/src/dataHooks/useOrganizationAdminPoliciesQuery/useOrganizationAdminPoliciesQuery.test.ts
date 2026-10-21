import {
  afterEach,
  beforeEach,
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
import type {
  CommonDbAbacApi,
  CommonDbOrganizationAdminPolicy,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_ABAC_TOKEN } from '../../constants/api.constants';

import {
  useOrganizationAdminPoliciesQuery,
  useOrganizationAdminPolicyMapQuery,
  useOrganizationAdminPolicyNameFactory,
  useOrganizationAdminPolicyOptionsQuery,
} from './useOrganizationAdminPoliciesQuery';

const dependencyMocks = vi.hoisted(() => ({
  getUserDisplayValue: vi.fn((_user: unknown, _translate: unknown) => 'User'),
  translate: vi.fn((key: string) => key),
  useOrganizationMapQuery: vi.fn(),
  useUsersMapQuery: vi.fn(),
}));

vi.mock('../useOrganizationsQuery', () => ({
  useOrganizationMapQuery: dependencyMocks.useOrganizationMapQuery,
}));

vi.mock('../useUsersQuery', () => ({
  useUsersMapQuery: dependencyMocks.useUsersMapQuery,
}));

vi.mock('../../utils/UserUtil', () => ({
  ['UserUtil']: {
    getUserDisplayValue: dependencyMocks.getUserDisplayValue,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: dependencyMocks.translate }),
}));

const createPolicy = (overrides: Partial<CommonDbOrganizationAdminPolicy> = {}): CommonDbOrganizationAdminPolicy => ({
  id: 'policy-1',
  is_active: true,
  organization_id: 'organization-1',
  user_id: 'user-1',
  ...overrides,
});

const createMapResult = (map: Map<string, { name: string }>, overrides: Record<string, unknown> = {}) => ({
  error: null as Error | null,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  map,
  ...overrides,
});

const createHookContext = (policies: CommonDbOrganizationAdminPolicy[]) => {
  const organizationAdminPoliciesGetAll = vi.fn(
    async (_limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: policies }),
  );
  const api = { organizationAdminPoliciesGetAll };
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(API_ABAC_TOKEN, api as unknown as CommonDbAbacApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    api: { organizationAdminPoliciesGetAll },
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

const getUserName = (user: unknown): string => {
  if (typeof user === 'object' && user !== null && 'name' in user && typeof user.name === 'string') {
    return user.name;
  }
  return 'Unknown user';
};

beforeEach(() => {
  container.clearInstances();
  dependencyMocks.getUserDisplayValue.mockReset().mockImplementation((user: unknown) => getUserName(user));
  dependencyMocks.translate.mockReset().mockImplementation((key: string) => key);
  dependencyMocks.useOrganizationMapQuery.mockReset().mockReturnValue(createMapResult(new Map()));
  dependencyMocks.useUsersMapQuery.mockReset().mockReturnValue(createMapResult(new Map()));
});

afterEach(() => {
  container.clearInstances();
});

describe('useOrganizationAdminPoliciesQuery', () => {
  it('loads organization admin policies using the API', async () => {
    const policies = [createPolicy()];
    const { api, dispose, wrapper } = createHookContext(policies);
    const { result, unmount } = renderHook(() => useOrganizationAdminPoliciesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(policies);
    expect(api.organizationAdminPoliciesGetAll).toHaveBeenCalledOnce();
    expect(api.organizationAdminPoliciesGetAll.mock.calls[0]?.[0]).toBeNull();
    expect(api.organizationAdminPoliciesGetAll.mock.calls[0]?.[1]).toBeNull();
    expect(api.organizationAdminPoliciesGetAll.mock.calls[0]?.[2]?.signal).toBeDefined();

    unmount();
    dispose();
  });

  it('exposes organization admin policy API errors', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    const error = new Error('Policies unavailable');
    api.organizationAdminPoliciesGetAll.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useOrganizationAdminPoliciesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});

describe('useOrganizationAdminPolicyMapQuery', () => {
  it('maps loaded policies by id', async () => {
    const policies = [
      createPolicy(),
      createPolicy({ id: 'policy-2', organization_id: 'organization-2' }),
    ];
    const { dispose, wrapper } = createHookContext(policies);
    const { result, unmount } = renderHook(() => useOrganizationAdminPolicyMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('policy-1')).toEqual(policies[0]);
    expect(result.current.map.get('policy-2')).toEqual(policies[1]);

    unmount();
    dispose();
  });

  it('returns an empty policy map when the query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.organizationAdminPoliciesGetAll.mockImplementation(async () => Promise.reject(new Error('Policies unavailable')));
    const { result, unmount } = renderHook(() => useOrganizationAdminPolicyMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});

describe('useOrganizationAdminPolicyNameFactory', () => {
  it('uses organization and user names with identifier fallbacks', () => {
    const organizationMap = createMapResult(new Map([
      ['organization-1', { name: 'Organization One' }],
    ]));
    const usersMap = createMapResult(new Map([
      ['user-1', { name: 'Ada' }],
    ]));
    dependencyMocks.useOrganizationMapQuery.mockReturnValue(organizationMap);
    dependencyMocks.useUsersMapQuery.mockReturnValue(usersMap);
    dependencyMocks.getUserDisplayValue.mockImplementation((user: unknown) => getUserName(user));
    const { result } = renderHook(() => useOrganizationAdminPolicyNameFactory());

    expect(result.current.getName(createPolicy())).toBe('Organization One -> Ada');
    expect(result.current.getName(createPolicy({
      organization_id: 'unknown-organization',
      user_id: 'unknown-user',
    }))).toBe('unknown-organization -> Unknown user');
    expect(dependencyMocks.getUserDisplayValue).toHaveBeenCalledWith(
      { name: 'Ada' },
      dependencyMocks.translate,
    );
    expect(dependencyMocks.getUserDisplayValue).toHaveBeenCalledWith(undefined, dependencyMocks.translate);
  });
});

describe('useOrganizationAdminPolicyOptionsQuery', () => {
  it('creates sorted options from policy, organization, and user data', async () => {
    const policies = [
      createPolicy({ id: 'policy-2', organization_id: 'organization-2', user_id: 'user-2' }),
      createPolicy(),
    ];
    const { dispose, wrapper } = createHookContext(policies);
    dependencyMocks.useOrganizationMapQuery.mockReturnValue(createMapResult(new Map([
      ['organization-1', { name: 'Zulu organization' }],
      ['organization-2', { name: 'Alpha organization' }],
    ])));
    dependencyMocks.useUsersMapQuery.mockReturnValue(createMapResult(new Map([
      ['user-1', { name: 'A user' }],
      ['user-2', { name: 'B user' }],
    ])));
    const { result, unmount } = renderHook(() => useOrganizationAdminPolicyOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha organization -> B user', value: 'policy-2' },
      { label: 'Zulu organization -> A user', value: 'policy-1' },
    ]);

    unmount();
    dispose();
  });

  it('returns empty options when the policy query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.organizationAdminPoliciesGetAll.mockImplementation(async () => Promise.reject(new Error('Policies unavailable')));
    const { result, unmount } = renderHook(() => useOrganizationAdminPolicyOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});
