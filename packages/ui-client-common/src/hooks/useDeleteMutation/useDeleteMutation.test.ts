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
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { container } from 'tsyringe';

import type { GenericData } from '../../models/data.models';
import type { ConfigBase } from '../../models/config.models';
import { NotificationService } from '../../classes/services/NotificationService';
import { QueryClientService } from '../../classes/services/QueryClientService';

import { useDeleteMutation } from './useDeleteMutation';
import type { UseDeleteMutationProps } from './useDeleteMutation';

type TestData = {
  name: string;
} & GenericData;

const createHookContext = () => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const notificationService = new NotificationService({
    notifications: {
      autoHideAfterMs: Number.POSITIVE_INFINITY,
    },
  } as ConfigBase);
  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(NotificationService, notificationService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    notificationService,
    queryClient: queryClientService.queryClient,
    queryClientService,
    wrapper,
  };
};

const createMutationProps = (
  queryFn: UseDeleteMutationProps<TestData>['queryFn'],
  overrides: Partial<UseDeleteMutationProps<TestData>> = {},
): UseDeleteMutationProps<TestData> => ({
  getErrorNotificationMessage: () => 'Delete failed',
  getProgressNotificationMessage: item => `Deleting ${item.name}`,
  getSuccessNotificationMessage: item => `Deleted ${item.name}`,
  queryFn,
  ...overrides,
});

afterEach(() => {
  container.clearInstances();
});

describe('useDeleteMutation', () => {
  it('removes the item optimistically and completes with a success notification', async () => {
    const { dispose, notificationService, queryClient, queryClientService, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const associationQueryKey = ['user-counts'];
    const users: TestData[] = [
      { id: 'user-1', name: 'Ada' },
      { id: 'user-2', name: 'Grace' },
      { id: 'user-3', name: 'Katherine' },
    ];
    const item = users[1];
    queryClient.setQueryData(resourceQueryKey, users);
    queryClient.setQueryData(associationQueryKey, [{ count: 3 }]);
    const queryFn = vi.fn(async (_item: TestData) => Promise.resolve());
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(
      () => useDeleteMutation(createMutationProps(queryFn, {
        associationQueryKeys: [associationQueryKey],
        onSuccess,
        resourceQueryKey,
      })),
      { wrapper },
    );

    act(() => {
      result.current.mutate(item);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual([users[0], users[2]]);
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(queryFn).toHaveBeenCalledWith(item);
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(notificationService.data[0]).toMatchObject({
      isLoading: false,
      message: 'Deleted Grace',
      severity: 'success',
    });
    expect(queryClientService.queryCache.find({ queryKey: associationQueryKey })?.state.isInvalidated).toBe(true);
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('restores the original item order and reports errors after a failed delete', async () => {
    const { dispose, notificationService, queryClient, queryClientService, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const associationQueryKey = ['user-counts'];
    const users: TestData[] = [
      { id: 'user-1', name: 'Ada' },
      { id: 'user-2', name: 'Grace' },
      { id: 'user-3', name: 'Katherine' },
    ];
    const deletedItem = users[1];
    const error = new Error('Delete endpoint unavailable');
    queryClient.setQueryData(resourceQueryKey, users);
    queryClient.setQueryData(associationQueryKey, [{ count: 3 }]);
    const queryFn = vi.fn(async (_item: TestData) => Promise.reject(error));
    const onError = vi.fn();
    const { result, unmount } = renderHook(
      () => useDeleteMutation(createMutationProps(queryFn, {
        associationQueryKeys: [associationQueryKey],
        onError,
        resourceQueryKey,
      })),
      { wrapper },
    );

    act(() => {
      result.current.mutate(deletedItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual(users);
    });

    expect(onError).toHaveBeenCalledWith(error, deletedItem, expect.objectContaining({
      previousData: users,
    }));
    expect(notificationService.data[0]).toMatchObject({
      isLoading: false,
      message: 'Delete failed',
      severity: 'error',
    });
    expect(queryClientService.queryCache.find({ queryKey: associationQueryKey })?.state.isInvalidated).toBe(true);
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('uses fallback messages when optional notification callbacks are omitted', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const error = new Error('Delete rejected');
    const { result, unmount } = renderHook(
      () => useDeleteMutation<TestData>({
        getProgressNotificationMessage: item => `Deleting ${item.name}`,
        queryFn: async () => Promise.reject(error),
      }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ id: 'user-1', name: 'Ada' });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(notificationService.data[0]?.message).toBe('Error: Delete rejected');

    unmount();
    dispose();
  });

  it('uses the default success message when no success message callback is provided', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const { result, unmount } = renderHook(
      () => useDeleteMutation<TestData>({
        getProgressNotificationMessage: item => `Deleting ${item.name}`,
        queryFn: async () => Promise.resolve(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ id: 'user-1', name: 'Ada' });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(notificationService.data[0]?.message).toBe('Deleted successfully');

    unmount();
    dispose();
  });

  it('fails explicitly when no delete query function is provided', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const { result, unmount } = renderHook(
      () => useDeleteMutation<TestData>({
        getProgressNotificationMessage: item => `Deleting ${item.name}`,
      }),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ id: 'user-1', name: 'Ada' });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(notificationService.data[0]?.message).toBe('Error: Delete mutation queryFn is required');

    unmount();
    dispose();
  });

  it('does not optimistically mutate a resource cache whose data is not an array', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const invalidCacheValue = { unexpected: true };
    queryClient.setQueryData(resourceQueryKey, invalidCacheValue);
    const queryFn = vi.fn(async (_item: TestData) => Promise.reject(new Error('Delete failed')));
    const { result, unmount } = renderHook(
      () => useDeleteMutation(createMutationProps(queryFn, { resourceQueryKey })),
      { wrapper },
    );

    act(() => {
      result.current.mutate({ id: 'user-1', name: 'Ada' });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(queryClient.getQueryData(resourceQueryKey)).toEqual(invalidCacheValue);

    unmount();
    dispose();
  });
});
