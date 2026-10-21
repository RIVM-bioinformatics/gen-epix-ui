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

import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';

import {
  useOrganizationMapQuery,
  useOrganizationOptionsQuery,
  useOrganizationsQuery,
} from './useOrganizationsQuery';

type TestOrganization = {
  id: string;
  name: string;
};

const createHookContext = (organizations: TestOrganization[]) => {
  const organizationsGetAll = vi.fn(
    async (_limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: organizations }),
  );
  const api = { organizationsGetAll };
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(API_ORGANIZATION_TOKEN, api as unknown as CommonDbOrganizationApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    api: { organizationsGetAll },
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useOrganizationsQuery', () => {
  it('loads organizations and passes the abort signal to the API', async () => {
    const organizations = [
      { id: 'organization-1', name: 'Organization one' },
      { id: 'organization-2', name: 'Organization two' },
    ];
    const { api, dispose, wrapper } = createHookContext(organizations);
    const { result, unmount } = renderHook(() => useOrganizationsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(organizations);
    expect(api.organizationsGetAll).toHaveBeenCalledOnce();
    expect(api.organizationsGetAll.mock.calls[0]?.[0]).toBeNull();
    expect(api.organizationsGetAll.mock.calls[0]?.[1]).toBeNull();
    expect(api.organizationsGetAll.mock.calls[0]?.[2]?.signal).toBeDefined();

    unmount();
    dispose();
  });

  it('exposes organization API failures', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    const error = new Error('Organizations unavailable');
    api.organizationsGetAll.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useOrganizationsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});

describe('useOrganizationMapQuery', () => {
  it('maps organizations by id', async () => {
    const organizations = [
      { id: 'organization-1', name: 'Organization one' },
      { id: 'organization-2', name: 'Organization two' },
    ];
    const { dispose, wrapper } = createHookContext(organizations);
    const { result, unmount } = renderHook(() => useOrganizationMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('organization-1')).toEqual(organizations[0]);

    unmount();
    dispose();
  });

  it('returns an empty organization map when loading fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.organizationsGetAll.mockImplementation(async () => Promise.reject(new Error('Organizations unavailable')));
    const { result, unmount } = renderHook(() => useOrganizationMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});

describe('useOrganizationOptionsQuery', () => {
  it('creates organization options in advanced sort order', async () => {
    const organizations = [
      { id: 'organization-2', name: 'Zulu organization' },
      { id: 'organization-1', name: 'Alpha organization' },
    ];
    const { dispose, wrapper } = createHookContext(organizations);
    const { result, unmount } = renderHook(() => useOrganizationOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha organization', value: 'organization-1' },
      { label: 'Zulu organization', value: 'organization-2' },
    ]);

    unmount();
    dispose();
  });

  it('returns empty options when the organization query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.organizationsGetAll.mockImplementation(async () => Promise.reject(new Error('Organizations unavailable')));
    const { result, unmount } = renderHook(() => useOrganizationOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});
