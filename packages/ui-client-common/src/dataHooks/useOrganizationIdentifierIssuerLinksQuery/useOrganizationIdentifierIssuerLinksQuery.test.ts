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

import { useOrganizationIdentifierIssuerLinksQuery } from './useOrganizationIdentifierIssuerLinksQuery';

type TestLink = {
  identifier_issuer_id: string;
  organization_id: string;
};

const createHookContext = (links: TestLink[]) => {
  const organizationIdentifierIssuerLinksGetAll = vi.fn(
    async (_limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: links }),
  );
  const api = { organizationIdentifierIssuerLinksGetAll };
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
    api: { organizationIdentifierIssuerLinksGetAll },
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useOrganizationIdentifierIssuerLinksQuery', () => {
  it('loads all organization-issuer links with request cancellation support', async () => {
    const links = [
      { identifier_issuer_id: 'issuer-1', organization_id: 'organization-1' },
      { identifier_issuer_id: 'issuer-2', organization_id: 'organization-2' },
    ];
    const { api, dispose, wrapper } = createHookContext(links);
    const { result, unmount } = renderHook(() => useOrganizationIdentifierIssuerLinksQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(links);
    expect(api.organizationIdentifierIssuerLinksGetAll).toHaveBeenCalledOnce();
    expect(api.organizationIdentifierIssuerLinksGetAll.mock.calls[0]?.[0]).toBeNull();
    expect(api.organizationIdentifierIssuerLinksGetAll.mock.calls[0]?.[1]).toBeNull();
    expect(api.organizationIdentifierIssuerLinksGetAll.mock.calls[0]?.[2]?.signal).toBeDefined();

    unmount();
    dispose();
  });

  it('exposes errors from the organization-issuer links API', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    const error = new Error('Links unavailable');
    api.organizationIdentifierIssuerLinksGetAll.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useOrganizationIdentifierIssuerLinksQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});
