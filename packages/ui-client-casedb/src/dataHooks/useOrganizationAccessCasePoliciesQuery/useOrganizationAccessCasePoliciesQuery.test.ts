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
import { CaseDbAbacApi } from '@gen-epix/api-casedb';
import type { CaseDbOrganizationAccessCasePolicy } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useOrganizationAccessCasePoliciesQuery } from './useOrganizationAccessCasePoliciesQuery';

const createPolicy = (id: string, isActive: boolean): CaseDbOrganizationAccessCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  id,
  is_active: isActive,
  is_private: false,
  organization_id: 'organization-1',
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
});

const createHookContext = (policies: CaseDbOrganizationAccessCasePolicy[], error?: Error) => {
  const organizationAccessCasePoliciesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: policies, signal });
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
  container.registerInstance(CaseDbAbacApi, { organizationAccessCasePoliciesGetAll } as unknown as CaseDbAbacApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    organizationAccessCasePoliciesGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useOrganizationAccessCasePoliciesQuery', () => {
  it('loads policies and passes the abort signal to the API', async () => {
    const policies = [createPolicy('policy-1', true)];
    const { dispose, organizationAccessCasePoliciesGetAll, wrapper } = createHookContext(policies);
    const { result, unmount } = renderHook(() => useOrganizationAccessCasePoliciesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(policies);
    expect(organizationAccessCasePoliciesGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(organizationAccessCasePoliciesGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('applies an optional selector to the query result', async () => {
    const policies = [createPolicy('active-policy', true), createPolicy('inactive-policy', false)];
    const { dispose, wrapper } = createHookContext(policies);
    const { result, unmount } = renderHook(
      () => useOrganizationAccessCasePoliciesQuery(items => items.filter(item => item.is_active)),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([policies[0]]);
    expect(policies).toHaveLength(2);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Organization policies unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useOrganizationAccessCasePoliciesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
