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
import type { CommonDbOrganizationApi } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';

import { QueryClientService } from '../../classes/services/QueryClientService';
import { API_ORGANIZATION_TOKEN } from '../../constants/api.constants';

import {
  useUserOptionsQuery,
  useUsersMapQuery,
  useUsersQuery,
} from './useUsersQuery';

const dependencyMocks = vi.hoisted(() => ({
  getUserDisplayValue: vi.fn((_user: unknown, _translate: unknown) => ''),
  translate: vi.fn((key: string) => key),
}));

vi.mock('../../utils/UserUtil', () => ({
  ['UserUtil']: {
    getUserDisplayValue: dependencyMocks.getUserDisplayValue,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: dependencyMocks.translate }),
}));

type TestUser = {
  email: string;
  id: string;
  name: string;
};

const createHookContext = (users: TestUser[]) => {
  const usersGetAll = vi.fn(
    async (_limit: null | number, _offset: null | number, _options: { signal: AbortSignal }) => Promise.resolve({ data: users }),
  );
  const api = { usersGetAll };
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
    api: { usersGetAll },
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

beforeEach(() => {
  dependencyMocks.getUserDisplayValue.mockReset().mockImplementation((user: unknown) => {
    if (typeof user === 'object' && user !== null && 'name' in user && typeof user.name === 'string') {
      return user.name;
    }
    return '';
  });
  dependencyMocks.translate.mockReset().mockImplementation((key: string) => key);
});

describe('useUsersQuery', () => {
  it('loads users with pagination arguments and an abort signal', async () => {
    const users = [
      { email: 'ada@example.test', id: 'user-1', name: 'Ada' },
    ];
    const { api, dispose, wrapper } = createHookContext(users);
    const { result, unmount } = renderHook(() => useUsersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(users);
    expect(api.usersGetAll).toHaveBeenCalledOnce();
    expect(api.usersGetAll.mock.calls[0]?.[0]).toBeNull();
    expect(api.usersGetAll.mock.calls[0]?.[1]).toBeNull();
    expect(api.usersGetAll.mock.calls[0]?.[2]?.signal).toBeDefined();

    unmount();
    dispose();
  });

  it('exposes user API errors', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    const error = new Error('Users unavailable');
    api.usersGetAll.mockImplementation(async () => Promise.reject(error));
    const { result, unmount } = renderHook(() => useUsersQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    unmount();
    dispose();
  });
});

describe('useUsersMapQuery', () => {
  it('maps loaded users by id', async () => {
    const users = [
      { email: 'ada@example.test', id: 'user-1', name: 'Ada' },
      { email: 'zoe@example.test', id: 'user-2', name: 'Zoe' },
    ];
    const { dispose, wrapper } = createHookContext(users);
    const { result, unmount } = renderHook(() => useUsersMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('user-2')).toEqual(users[1]);

    unmount();
    dispose();
  });

  it('returns an empty map when the user query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.usersGetAll.mockImplementation(async () => Promise.reject(new Error('Users unavailable')));
    const { result, unmount } = renderHook(() => useUsersMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});

describe('useUserOptionsQuery', () => {
  it('formats and sorts user options with the active translation function', async () => {
    const users = [
      { email: 'zoe@example.test', id: 'user-2', name: 'Zoe' },
      { email: 'ada@example.test', id: 'user-1', name: 'Ada' },
    ];
    const { dispose, wrapper } = createHookContext(users);
    const { result, unmount } = renderHook(() => useUserOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Ada', value: 'user-1' },
      { label: 'Zoe', value: 'user-2' },
    ]);
    expect(dependencyMocks.getUserDisplayValue).toHaveBeenCalledWith(users[0], dependencyMocks.translate);
    expect(dependencyMocks.getUserDisplayValue).toHaveBeenCalledWith(users[1], dependencyMocks.translate);

    unmount();
    dispose();
  });

  it('returns empty options when the user query fails', async () => {
    const { api, dispose, wrapper } = createHookContext([]);
    api.usersGetAll.mockImplementation(async () => Promise.reject(new Error('Users unavailable')));
    const { result, unmount } = renderHook(() => useUserOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    unmount();
    dispose();
  });
});
