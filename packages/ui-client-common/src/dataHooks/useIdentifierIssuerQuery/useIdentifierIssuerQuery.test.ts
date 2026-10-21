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
  CommonDbIdentifierIssuer,
  CommonDbOrganizationApi,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';
import { COMMON_QUERY_KEY } from '../../constants/query.constants';

import {
  useIdentifierIssuerMapQuery,
  useIdentifierIssuerOptionsQuery,
  useIdentifierIssuersQuery,
} from './useIdentifierIssuerQuery';

type TestIssuer = {
  id: string;
  name: string;
};

const createHookContext = (issuers: TestIssuer[]) => {
  const identifierIssuersGetAll = vi.fn(
    async (_limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: issuers }),
  );
  const api = { identifierIssuersGetAll };
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
    api: { identifierIssuersGetAll },
    dispose: () => queryClientService.queryClient.clear(),
    queryClientService,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useIdentifierIssuersQuery', () => {
  it('loads issuer data with pagination arguments and its generic cache key', async () => {
    const issuers: TestIssuer[] = [{ id: 'issuer-1', name: 'Issuer one' }];
    const { api, dispose, queryClientService, wrapper } = createHookContext(issuers);
    const { result, unmount } = renderHook(() => useIdentifierIssuersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(issuers);
    expect(api.identifierIssuersGetAll).toHaveBeenCalledOnce();
    expect(api.identifierIssuersGetAll.mock.calls[0]?.[0]).toBeNull();
    expect(api.identifierIssuersGetAll.mock.calls[0]?.[1]).toBeNull();
    expect(api.identifierIssuersGetAll.mock.calls[0]?.[2]?.signal).toBeDefined();
    expect(queryClientService.queryCache.getAll()[0]?.queryKey).toEqual([
      COMMON_QUERY_KEY.IDENTIFIER_ISSUERS,
    ]);

    unmount();
    dispose();
  });

  it('applies an optional selector to query results without changing cached API data', async () => {
    const issuers: TestIssuer[] = [
      { id: 'issuer-1', name: 'Issuer one' },
      { id: 'issuer-2', name: 'Issuer two' },
    ];
    const { dispose, queryClientService, wrapper } = createHookContext(issuers);
    const select = vi.fn((items: CommonDbIdentifierIssuer[]) => items.filter(item => item.id === 'issuer-2'));
    const { result, unmount } = renderHook(() => useIdentifierIssuersQuery(select), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([{ id: 'issuer-2', name: 'Issuer two' }]);
    expect(select).toHaveBeenCalledWith(issuers);
    expect(queryClientService.queryClient.getQueryData([COMMON_QUERY_KEY.IDENTIFIER_ISSUERS])).toEqual(issuers);

    unmount();
    dispose();
  });

  it('exposes API failures through the query result', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    const error = new Error('Issuer request failed');
    api.identifierIssuersGetAll.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useIdentifierIssuersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});

describe('useIdentifierIssuerMapQuery', () => {
  it('maps loaded issuers by id and applies an optional selector', async () => {
    const issuers: TestIssuer[] = [
      { id: 'issuer-1', name: 'Issuer one' },
      { id: 'issuer-2', name: 'Issuer two' },
    ];
    const { dispose, wrapper } = createHookContext(issuers);
    const select = (items: CommonDbIdentifierIssuer[]) => items.filter(item => item.id === 'issuer-2');
    const { result, unmount } = renderHook(() => useIdentifierIssuerMapQuery(select), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(1);
    expect(result.current.map.get('issuer-2')).toEqual({ id: 'issuer-2', name: 'Issuer two' });
    expect(result.current.map.has('issuer-1')).toBe(false);

    unmount();
    dispose();
  });

  it('returns an empty map when the issuer query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.identifierIssuersGetAll.mockImplementation(async () => Promise.reject(new Error('Issuer request failed')));
    const { result, unmount } = renderHook(() => useIdentifierIssuerMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});

describe('useIdentifierIssuerOptionsQuery', () => {
  it('creates sorted id and label options from issuer data', async () => {
    const issuers: TestIssuer[] = [
      { id: 'issuer-2', name: 'Zulu issuer' },
      { id: 'issuer-1', name: 'Alpha issuer' },
    ];
    const { dispose, wrapper } = createHookContext(issuers);
    const { result, unmount } = renderHook(() => useIdentifierIssuerOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha issuer', value: 'issuer-1' },
      { label: 'Zulu issuer', value: 'issuer-2' },
    ]);

    unmount();
    dispose();
  });

  it('returns empty options when the issuer query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.identifierIssuersGetAll.mockImplementation(async () => Promise.reject(new Error('Issuer request failed')));
    const { result, unmount } = renderHook(() => useIdentifierIssuerOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});
