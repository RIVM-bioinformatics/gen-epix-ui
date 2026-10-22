import {
  act,
  renderHook,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';
import { CaseDbOrganizationApi } from '@gen-epix/api-casedb';
import type { Loadable } from '@gen-epix/ui-client-common/models/data-hooks.models';
import { container } from 'tsyringe';

import { useUserEffectiveRightsQuery } from './useUserEffectiveRightsQuery';

type UserItemQueryArgs = {
  baseQueryKey: string;
  itemId: string;
  useQueryOptions: {
    queryFn: (context: { signal: AbortSignal }) => Promise<CaseDbUser>;
  };
};

const mocks = vi.hoisted(() => ({
  assembleUserEffectiveRights: vi.fn(),
  useCaseTypeSetMembersQuery: vi.fn(),
  useCaseTypeSetNameFactory: vi.fn(),
  useCaseTypeSetsMapQuery: vi.fn(),
  useColSetMapQuery: vi.fn(),
  useColSetMembersQuery: vi.fn(),
  useDataCollectionOptionsQuery: vi.fn(),
  useDataCollectionsMapQuery: vi.fn(),
  useItemQuery: vi.fn<(options: UserItemQueryArgs) => unknown>(),
  useOrganizationAccessCasePoliciesQuery: vi.fn(),
  useOrganizationShareCasePoliciesQuery: vi.fn(),
  useUserAccessCasePoliciesQuery: vi.fn(),
  useUserShareCasePoliciesQuery: vi.fn(),
}));

vi.mock('@gen-epix/ui-client-common/hooks/useItemQuery', () => ({
  useItemQuery: mocks.useItemQuery,
}));
vi.mock('../useColSetMembersQuery', () => ({
  useColSetMembersQuery: mocks.useColSetMembersQuery,
}));
vi.mock('../useColSetsQuery', () => ({
  useColSetMapQuery: mocks.useColSetMapQuery,
}));
vi.mock('../useCaseTypeSetMembersQuery', () => ({
  useCaseTypeSetMembersQuery: mocks.useCaseTypeSetMembersQuery,
}));
vi.mock('../useCaseTypeSetsQuery', () => ({
  useCaseTypeSetNameFactory: mocks.useCaseTypeSetNameFactory,
  useCaseTypeSetsMapQuery: mocks.useCaseTypeSetsMapQuery,
}));
vi.mock('../useDataCollectionsQuery', () => ({
  useDataCollectionOptionsQuery: mocks.useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery: mocks.useDataCollectionsMapQuery,
}));
vi.mock('../useOrganizationAccessCasePoliciesQuery', () => ({
  useOrganizationAccessCasePoliciesQuery: mocks.useOrganizationAccessCasePoliciesQuery,
}));
vi.mock('../useOrganizationShareCasePoliciesQuery', () => ({
  useOrganizationShareCasePoliciesQuery: mocks.useOrganizationShareCasePoliciesQuery,
}));
vi.mock('../useUserAccessCasePoliciesQuery', () => ({
  useUserAccessCasePoliciesQuery: mocks.useUserAccessCasePoliciesQuery,
}));
vi.mock('../useUserShareCasePoliciesQuery', () => ({
  useUserShareCasePoliciesQuery: mocks.useUserShareCasePoliciesQuery,
}));
vi.mock('../../utils/EffectiveRightsUtil', () => ({
  ['EffectiveRightsUtil']: {
    assembleUserEffectiveRights: mocks.assembleUserEffectiveRights,
  },
}));

const loadable = (overrides: Partial<Loadable> = {}): Loadable => ({
  error: null,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  ...overrides,
});

const createOrganizationAccessPolicy = (organizationId: string): CaseDbOrganizationAccessCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  is_active: true,
  is_private: false,
  organization_id: organizationId,
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
});

const createOrganizationSharePolicy = (organizationId: string): CaseDbOrganizationShareCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  from_data_collection_id: 'source-data-collection-1',
  is_active: true,
  organization_id: organizationId,
  remove_case: false,
  remove_case_set: false,
});

const createUserAccessPolicy = (userId: string): CaseDbUserAccessCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  is_active: true,
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  user_id: userId,
  write_case_set: false,
});

const createUserSharePolicy = (userId: string): CaseDbUserShareCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  from_data_collection_id: 'source-data-collection-1',
  is_active: true,
  remove_case: false,
  remove_case_set: false,
  user_id: userId,
});

const createUser = (): CaseDbUser => ({
  id: 'user-1',
  organization_id: 'organization-1',
  roles: [],
});

const selectResult = <TItem>(
  items: TItem[],
  select?: (data: TItem[]) => TItem[],
  error: Error | null = null,
) => ({
  ...loadable({ error }),
  data: select ? select(items) : items,
});

const configureHooks = (user: CaseDbUser | undefined, userLoading = false, colSetMembersError: Error | null = null): void => {
  const organizationAccessPolicies = [
    createOrganizationAccessPolicy('organization-1'),
    createOrganizationAccessPolicy('organization-2'),
  ];
  const organizationSharePolicies = [
    createOrganizationSharePolicy('organization-1'),
    createOrganizationSharePolicy('organization-2'),
  ];
  const userAccessPolicies = [
    createUserAccessPolicy('user-1'),
    createUserAccessPolicy('user-2'),
  ];
  const userSharePolicies = [
    createUserSharePolicy('user-1'),
    createUserSharePolicy('user-2'),
  ];

  mocks.useItemQuery.mockReturnValue({
    ...loadable({ isLoading: userLoading }),
    data: user,
  });
  mocks.useColSetMembersQuery.mockReturnValue({
    ...loadable({ error: colSetMembersError }),
    data: [],
  });
  mocks.useCaseTypeSetsMapQuery.mockReturnValue({
    ...loadable(),
    map: new Map(),
  });
  mocks.useColSetMapQuery.mockReturnValue({
    ...loadable(),
    map: new Map(),
  });
  mocks.useCaseTypeSetMembersQuery.mockReturnValue({
    ...loadable(),
    data: [],
  });
  mocks.useCaseTypeSetNameFactory.mockReturnValue({
    ...loadable(),
    getName: () => '',
  });
  mocks.useDataCollectionsMapQuery.mockReturnValue({
    ...loadable(),
    map: new Map(),
  });
  mocks.useDataCollectionOptionsQuery.mockReturnValue({
    ...loadable(),
    options: [],
  });
  mocks.useOrganizationAccessCasePoliciesQuery.mockImplementation((select: (items: CaseDbOrganizationAccessCasePolicy[]) => CaseDbOrganizationAccessCasePolicy[]) => selectResult(organizationAccessPolicies, select));
  mocks.useOrganizationShareCasePoliciesQuery.mockImplementation((select: (items: CaseDbOrganizationShareCasePolicy[]) => CaseDbOrganizationShareCasePolicy[]) => selectResult(organizationSharePolicies, select));
  mocks.useUserAccessCasePoliciesQuery.mockImplementation((select: (items: CaseDbUserAccessCasePolicy[]) => CaseDbUserAccessCasePolicy[]) => selectResult(userAccessPolicies, select));
  mocks.useUserShareCasePoliciesQuery.mockImplementation((select: (items: CaseDbUserShareCasePolicy[]) => CaseDbUserShareCasePolicy[]) => selectResult(userSharePolicies, select));
  mocks.assembleUserEffectiveRights.mockReturnValue([]);
};

afterEach(() => {
  vi.clearAllMocks();
  container.clearInstances();
});

describe('useUserEffectiveRightsQuery', () => {
  it('safely returns no policies while user data is pending', () => {
    configureHooks(undefined, true);
    const { result, unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.data?.user).toBeUndefined();
    expect(result.current.data?.organizationAccessCasePolicies).toEqual([]);
    expect(result.current.data?.organizationShareCasePolicies).toEqual([]);
    expect(result.current.data?.userAccessCasePolicies).toEqual([]);
    expect(result.current.data?.userShareCasePolicies).toEqual([]);
    expect(result.current.data?.effectiveRights).toEqual([]);

    act(() => unmount());
  });

  it('fetches the requested user with the query abort signal', async () => {
    const user = createUser();
    const usersGetOne = vi.fn(async (_userId: string, { signal }: { signal: AbortSignal }) => Promise.resolve({ data: user, signal }));
    container.registerInstance(CaseDbOrganizationApi, { usersGetOne } as unknown as CaseDbOrganizationApi);
    configureHooks(undefined, true);
    const { unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));
    const itemQueryArgs = mocks.useItemQuery.mock.calls[0]?.[0];
    if (!itemQueryArgs) {
      throw new Error('Expected useItemQuery to be called');
    }
    const signal = new AbortController().signal;

    await expect(itemQueryArgs.useQueryOptions.queryFn({ signal })).resolves.toEqual(user);
    expect(usersGetOne).toHaveBeenCalledWith('user-1', { signal });

    act(() => unmount());
  });

  it('propagates user API failures from its query function', async () => {
    const error = new Error('User unavailable');
    const usersGetOne = vi.fn().mockRejectedValue(error);
    container.registerInstance(CaseDbOrganizationApi, { usersGetOne } as unknown as CaseDbOrganizationApi);
    configureHooks(undefined, true);
    const { unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));
    const itemQueryArgs = mocks.useItemQuery.mock.calls[0]?.[0];
    if (!itemQueryArgs) {
      throw new Error('Expected useItemQuery to be called');
    }

    await expect(itemQueryArgs.useQueryOptions.queryFn({ signal: new AbortController().signal })).rejects.toBe(error);

    act(() => unmount());
  });

  it('filters policies for the loaded user and organization', () => {
    configureHooks(createUser());
    const { result, unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));

    expect(result.current.loading).toBe(false);
    expect(result.current.data?.organizationAccessCasePolicies).toEqual([createOrganizationAccessPolicy('organization-1')]);
    expect(result.current.data?.organizationShareCasePolicies).toEqual([createOrganizationSharePolicy('organization-1')]);
    expect(result.current.data?.userAccessCasePolicies).toEqual([createUserAccessPolicy('user-1')]);
    expect(result.current.data?.userShareCasePolicies).toEqual([createUserSharePolicy('user-1')]);

    act(() => unmount());
  });

  it('passes empty collections to rights assembly when query data is unavailable', () => {
    configureHooks(createUser());
    mocks.useCaseTypeSetMembersQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    mocks.useColSetMembersQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    mocks.useOrganizationAccessCasePoliciesQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    mocks.useOrganizationShareCasePoliciesQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    mocks.useUserAccessCasePoliciesQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    mocks.useUserShareCasePoliciesQuery.mockReturnValue({
      ...loadable(),
      data: undefined,
    });
    const { unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));

    expect(mocks.assembleUserEffectiveRights).toHaveBeenCalledWith({
      caseTypeSetMembers: [],
      colSetMembers: [],
      organizationAccessCasePolicies: [],
      organizationShareCasePolicies: [],
      user: createUser(),
      userAccessCasePolicies: [],
      userShareCasePolicies: [],
    });

    act(() => unmount());
  });

  it('surfaces the first loadable error', () => {
    const error = new Error('Column-set members unavailable');
    configureHooks(createUser(), false, error);
    const { result, unmount } = renderHook(() => useUserEffectiveRightsQuery('user-1'));

    expect(result.current.error).toBe(error);

    act(() => unmount());
  });
});
