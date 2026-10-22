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
import type { CaseDbProtocol } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useAssemblyProtocolMapQuery,
  useAssemblyProtocolOptionsQuery,
  useAssemblyProtocolsQuery,
} from './useAssemblyProtocolsQuery';

const createHookContext = (protocols: CaseDbProtocol[], error?: Error) => {
  const retrieveAssemblyProtocols = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: protocols, signal });
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
  container.registerInstance(CaseDbCaseApi, { retrieveAssemblyProtocols } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveAssemblyProtocols,
    wrapper,
  };
};

const protocol = (id: string, name: string): CaseDbProtocol => ({ id, name } as CaseDbProtocol);

afterEach(() => {
  container.clearInstances();
});

describe('useAssemblyProtocolsQuery', () => {
  it('loads protocols and passes the abort signal to the API', async () => {
    const protocols = [protocol('protocol-1', 'Protocol one')];
    const { dispose, retrieveAssemblyProtocols, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useAssemblyProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(protocols);
    expect(retrieveAssemblyProtocols).toHaveBeenCalledOnce();
    expect(retrieveAssemblyProtocols.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Protocols unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useAssemblyProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useAssemblyProtocolMapQuery', () => {
  it('maps protocols by ID', async () => {
    const protocols = [protocol('protocol-1', 'Protocol one'), protocol('protocol-2', 'Protocol two')];
    const { dispose, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useAssemblyProtocolMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.get('protocol-1')).toEqual(protocols[0]);
    expect(result.current.map.size).toBe(2);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Protocols unavailable'));
    const { result, unmount } = renderHook(() => useAssemblyProtocolMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useAssemblyProtocolOptionsQuery', () => {
  it('creates sorted protocol options', async () => {
    const protocols = [protocol('protocol-2', 'Zulu protocol'), protocol('protocol-1', 'Alpha protocol')];
    const { dispose, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useAssemblyProtocolOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha protocol', value: 'protocol-1' },
      { label: 'Zulu protocol', value: 'protocol-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Protocols unavailable'));
    const { result, unmount } = renderHook(() => useAssemblyProtocolOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
