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

import {
  useIdentifierIssuerOwnOrganizationOptionsQuery,
  useIdentifierIssuerOwnOrganizationQuery,
} from './useIdentifierIssuerOwnOrganizationQuery';

const createHookContext = (
  links: Array<{ identifier_issuer_id: string }>,
  issuers: Array<{ id: string; name: string }>,
) => {
  const api = {
    identifierIssuersGetSome: vi.fn(async (_ids: string, _options: { signal: AbortSignal }) => Promise.resolve({ data: issuers })),
    organizationIdentifierIssuerLinksPostQuery: vi.fn(
      async (_filter: unknown, _limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: links }),
    ),
  };
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
    user: {
      organization_id: 'organization-1',
    },
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
    api,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useIdentifierIssuerOwnOrganizationQuery', () => {
  it('loads linked issuers for the current organization', async () => {
    const issuers = [
      { id: 'issuer-2', name: 'Zulu' },
      { id: 'issuer-1', name: 'Alpha' },
    ];
    const { api, dispose, wrapper } = createHookContext([
      { identifier_issuer_id: 'issuer-2' },
      { identifier_issuer_id: 'issuer-1' },
    ], issuers);
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(issuers);
    expect(api.organizationIdentifierIssuerLinksPostQuery).toHaveBeenCalledOnce();
    expect(api.organizationIdentifierIssuerLinksPostQuery.mock.calls[0]?.[0]).toEqual({
      key: 'organization_id',
      type: 'EQUALS_UUID',
      value: 'organization-1',
    });
    expect(api.organizationIdentifierIssuerLinksPostQuery.mock.calls[0]?.[1]).toBeNull();
    expect(api.organizationIdentifierIssuerLinksPostQuery.mock.calls[0]?.[2]).toBeNull();
    expect(api.organizationIdentifierIssuerLinksPostQuery.mock.calls[0]?.[3]?.signal).toBeDefined();
    expect(api.identifierIssuersGetSome.mock.calls[0]?.[0]).toBe('issuer-2,issuer-1');
    expect(api.identifierIssuersGetSome.mock.calls[0]?.[1]?.signal).toBeDefined();

    unmount();
    dispose();
  });

  it('returns an empty result without requesting issuers when no links exist', async () => {
    const { api, dispose, wrapper } = createHookContext([], []);
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
    expect(api.organizationIdentifierIssuerLinksPostQuery).toHaveBeenCalledOnce();
    expect(api.identifierIssuersGetSome).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('returns query errors from the links request without requesting issuers', async () => {
    const { api, dispose, wrapper } = createHookContext([], []);
    const error = new Error('Unable to load organization issuer links');
    api.organizationIdentifierIssuerLinksPostQuery.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(api.identifierIssuersGetSome).not.toHaveBeenCalled();

    unmount();
    dispose();
  });

  it('returns query errors from the issuer request', async () => {
    const { api, dispose, wrapper } = createHookContext([
      { identifier_issuer_id: 'issuer-1' },
    ], []);
    const error = new Error('Unable to load issuers');
    api.identifierIssuersGetSome.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});

describe('useIdentifierIssuerOwnOrganizationOptionsQuery', () => {
  it('maps and sorts loaded issuers into options', async () => {
    const { api, dispose, wrapper } = createHookContext([
      { identifier_issuer_id: 'issuer-2' },
      { identifier_issuer_id: 'issuer-1' },
    ], [
      { id: 'issuer-2', name: 'Zulu' },
      { id: 'issuer-1', name: 'Alpha' },
    ]);
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha', value: 'issuer-1' },
      { label: 'Zulu', value: 'issuer-2' },
    ]);
    expect(result.current.error).toBeUndefined();
    expect(api.identifierIssuersGetSome).toHaveBeenCalledOnce();

    unmount();
    dispose();
  });

  it('returns no options when loading fails', async () => {
    const { api, dispose, wrapper } = createHookContext([
      { identifier_issuer_id: 'issuer-1' },
    ], []);
    api.organizationIdentifierIssuerLinksPostQuery.mockImplementation(async () => Promise.reject(new Error('Links unavailable')));
    const { result, unmount } = renderHook(() => useIdentifierIssuerOwnOrganizationOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});
