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
import type {
  CommonDbOrganizationApi,
  CommonDbSite,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';
import { QueryClientService } from '../../classes/services/QueryClientService';

import {
  useSiteOptionsQuery,
  useSitesQuery,
} from './useSitesQuery';

const createSite = (id: string, name: string): CommonDbSite => ({
  id,
  name,
  organization_id: 'organization-1',
});

const createHookContext = (sitesGetAll: CommonDbOrganizationApi['sitesGetAll']) => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(API_ORGANIZATION_TOKEN, { sitesGetAll } as unknown as CommonDbOrganizationApi);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    queryClient: queryClientService.queryClient,
    queryClientService,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useSitesQuery', () => {
  it('fetches all sites with an abort signal and returns the response data', async () => {
    const sites = [createSite('site-1', 'Site B'), createSite('site-2', 'Site A')];
    const sitesGetAll = vi.fn(async (_limit?: null | number, _offset?: null | number, _options?: { signal?: AbortSignal }) => Promise.resolve({ data: sites }));
    const { dispose, wrapper } = createHookContext(sitesGetAll as unknown as CommonDbOrganizationApi['sitesGetAll']);

    const { result } = renderHook(() => useSitesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual(sites);
    expect(sitesGetAll).toHaveBeenCalledTimes(1);
    expect(sitesGetAll.mock.calls[0]?.slice(0, 2)).toEqual([null, null]);
    expect(sitesGetAll.mock.calls[0]?.[2]?.signal).toBeInstanceOf(AbortSignal);
    dispose();
  });

  it('stores the fetched sites under the generic sites query key', async () => {
    const sites = [createSite('site-1', 'Site A')];
    const sitesGetAll = vi.fn(async () => Promise.resolve({ data: sites }));
    const { dispose, queryClient, queryClientService, wrapper } = createHookContext(sitesGetAll as unknown as CommonDbOrganizationApi['sitesGetAll']);

    const { result } = renderHook(() => useSitesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(queryClient.getQueryData(queryClientService.getGenericKey(COMMON_QUERY_KEY.SITES))).toEqual(sites);
    dispose();
  });

  it('exposes the error when fetching sites fails', async () => {
    const error = new Error('Sites unavailable');
    const sitesGetAll = vi.fn(async () => Promise.reject(error));
    const { dispose, wrapper } = createHookContext(sitesGetAll);

    const { result } = renderHook(() => useSitesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBe(error);
    dispose();
  });
});

describe('useSiteOptionsQuery', () => {
  it('reports loading while the sites are being fetched and returns no options', () => {
    const sitesGetAll = vi.fn(async () => new Promise<never>(() => undefined));
    const { dispose, wrapper } = createHookContext(sitesGetAll);

    const { result } = renderHook(() => useSiteOptionsQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.options).toEqual([]);
    dispose();
  });

  it('returns sites as options with the site id as value and the site name as label, sorted by label', async () => {
    const sitesGetAll = vi.fn(async () => Promise.resolve({
      data: [createSite('site-1', 'Site B'), createSite('site-2', 'Site A')],
    }));
    const { dispose, wrapper } = createHookContext(sitesGetAll as unknown as CommonDbOrganizationApi['sitesGetAll']);

    const { result } = renderHook(() => useSiteOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.options.length).toBe(2);
    });
    expect(result.current.options).toEqual([
      { label: 'Site A', value: 'site-2' },
      { label: 'Site B', value: 'site-1' },
    ]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    dispose();
  });

  it('exposes the error of the sites query as the options error', async () => {
    const error = new Error('Sites unavailable');
    const sitesGetAll = vi.fn(async () => Promise.reject(error));
    const { dispose, wrapper } = createHookContext(sitesGetAll);

    const { result } = renderHook(() => useSiteOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });
    expect(result.current.options).toEqual([]);
    dispose();
  });
});
