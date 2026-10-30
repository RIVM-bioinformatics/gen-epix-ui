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

import { useEditMutation } from './useEditMutation';
import type { UseEditMutationProps } from './useEditMutation';

type EditVariables = {
  empty: string;
  name: string;
  nested: {
    value: string;
  };
};

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
  queryFn: UseEditMutationProps<TestData, EditVariables>['queryFn'],
  overrides: Partial<UseEditMutationProps<TestData, EditVariables>> = {},
): UseEditMutationProps<TestData, EditVariables> => ({
  getErrorNotificationMessage: (item, _variables, error) => `Could not update ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
  getProgressNotificationMessage: (item, variables) => `Updating ${item.name} to ${variables.name}`,
  getSuccessNotificationMessage: item => `Updated ${item.name}`,
  queryFn,
  ...overrides,
});

afterEach(() => {
  container.clearInstances();
});

describe('useEditMutation', () => {
  it('normalizes variables and exposes the current item to a successful mutation', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const previousItem: TestData = {
      id: 'user-1',
      name: 'Old name',
    };
    const variables: EditVariables = {
      empty: '',
      name: 'New name',
      nested: { value: '' },
    };
    const updatedItem: TestData = {
      id: 'user-1',
      name: 'New name',
    };
    const queryFn = vi.fn(async (normalizedVariables: EditVariables, previousData: TestData) => Promise.resolve({
      ...updatedItem,
      name: `${normalizedVariables.name}:${previousData.name}`,
    }));
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, { onSuccess })),
      { wrapper },
    );
    act(() => {
      result.current.mutate(variables, previousItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(queryFn.mock.calls[0]?.[0]).toEqual({
      empty: null,
      name: 'New name',
      nested: { value: null },
    });
    expect(queryFn.mock.calls[0]?.[1]).toBe(previousItem);
    expect(onSuccess).toHaveBeenCalledWith(
      { ...updatedItem, name: 'New name:Old name' },
      variables,
      expect.objectContaining({ item: previousItem }),
    );
    expect(notificationService.data[0]?.message).toBe('Updated New name:Old name');

    unmount();
    dispose();
  });

  it('replaces an optimistic item in place with the server result', async () => {
    const { dispose, notificationService, queryClient, queryClientService, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const associationQueryKey = ['user-organizations'];
    const users: TestData[] = [
      { id: 'user-1', name: 'First' },
      { id: 'user-2', name: 'Old name' },
      { id: 'user-3', name: 'Last' },
    ];
    const previousItem = users[1];
    const updatedItem: TestData = {
      id: 'user-2',
      name: 'Server name',
    };
    queryClient.setQueryData(resourceQueryKey, users);
    queryClient.setQueryData(associationQueryKey, [{ id: 'association-1' }]);
    let resolveMutation: ((item: TestData) => void) | undefined;
    const queryFn = vi.fn(async (_variables: EditVariables, _previousItem: TestData) => new Promise<TestData>((resolve) => {
      resolveMutation = resolve;
    }));
    const getIntermediateItem = vi.fn((variables: EditVariables, item: TestData) => ({
      ...item,
      name: `Saving ${variables.name}`,
    }));
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, {
        associationQueryKeys: [associationQueryKey],
        getIntermediateItem,
        resourceQueryKey,
      })),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Updated name',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)?.[1]?.name).toBe('Saving Updated name');
      expect(queryFn).toHaveBeenCalledOnce();
    });
    expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)?.map(item => item.id)).toEqual([
      'user-1',
      'user-2',
      'user-3',
    ]);
    expect(getIntermediateItem).toHaveBeenCalledWith({
      empty: '',
      name: 'Updated name',
      nested: { value: '' },
    }, previousItem);

    if (!resolveMutation) {
      throw new Error('Expected the edit mutation promise to be pending');
    }
    act(() => resolveMutation(updatedItem));

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual([
        users[0],
        updatedItem,
        users[2],
      ]);
    });
    expect(queryClientService.queryCache.find({ queryKey: associationQueryKey })?.state.isInvalidated).toBe(true);

    unmount();
    dispose();
  });

  it('restores the original list order after an edit fails', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const users: TestData[] = [
      { id: 'user-1', name: 'First' },
      { id: 'user-2', name: 'Previous' },
      { id: 'user-3', name: 'Last' },
    ];
    const previousItem = users[1];
    const error = new Error('Update failed');
    queryClient.setQueryData(resourceQueryKey, users);
    const queryFn = vi.fn(async (_variables: EditVariables, _previousItem: TestData) => Promise.reject(error));
    const onError = vi.fn();
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, {
        onError,
        resourceQueryKey,
      })),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Updated',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual(users);
    });

    expect(onError).toHaveBeenCalledWith(error, expect.any(Object), expect.objectContaining({
      item: previousItem,
      previousData: users,
    }));
    expect(notificationService.data[0]?.message).toBe('Could not update Previous: Update failed');

    unmount();
    dispose();
  });

  it('does not require a resource cache to retain the previous item in mutation context', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const previousItem: TestData = { id: 'user-1', name: 'Previous' };
    const queryFn = vi.fn(async (_variables: EditVariables, item: TestData) => Promise.resolve(item));
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, { onSuccess })),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Changed',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(onSuccess).toHaveBeenCalledWith(previousItem, expect.any(Object), expect.objectContaining({
      item: previousItem,
    }));

    unmount();
    dispose();
  });

  it('reports a clear error if a mutation starts without a previous item', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const onError = vi.fn();
    const queryFn = vi.fn(async (_variables: EditVariables, _item: TestData) => Promise.resolve({ id: 'user-1', name: 'Updated' }));
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, {
        onError,
        resourceQueryKey: ['users'],
      })),
      { wrapper },
    );

    act(() => {
      // @ts-expect-error A previous item is required for edit mutations.
      result.current.mutate({
        empty: '',
        name: 'Updated',
        nested: { value: '' },
      });
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledOnce();
    });

    expect(queryFn).not.toHaveBeenCalled();
    expect(notificationService.data).toEqual([]);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'previousItem is not set' }),
      expect.any(Object),
      {},
    );

    unmount();
    dispose();
  });

  it('does not optimistically edit a resource cache that is not an array', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const invalidCacheValue = { unexpected: true };
    const previousItem: TestData = { id: 'user-1', name: 'Previous' };
    queryClient.setQueryData(resourceQueryKey, invalidCacheValue);
    const queryFn = vi.fn(async (_variables: EditVariables, item: TestData) => Promise.resolve(item));
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, { resourceQueryKey })),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Updated',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(queryClient.getQueryData(resourceQueryKey)).toEqual(invalidCacheValue);

    unmount();
    dispose();
  });

  it('does not overwrite a resource cache that changes to a non-array during mutation', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const previousItem: TestData = { id: 'user-1', name: 'Previous' };
    const updatedItem: TestData = { id: 'user-1', name: 'Updated' };
    queryClient.setQueryData<TestData[]>(resourceQueryKey, [previousItem]);
    let resolveMutation: ((item: TestData) => void) | undefined;
    const queryFn = vi.fn(async (_variables: EditVariables, _item: TestData) => new Promise<TestData>((resolve) => {
      resolveMutation = resolve;
    }));
    const { result, unmount } = renderHook(
      () => useEditMutation(createMutationProps(queryFn, { resourceQueryKey })),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Updated',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toHaveLength(1);
      expect(queryFn).toHaveBeenCalledOnce();
    });
    queryClient.setQueryData(resourceQueryKey, { unexpected: true });

    if (!resolveMutation) {
      throw new Error('Expected the edit mutation promise to be pending');
    }
    act(() => resolveMutation(updatedItem));

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });
    expect(queryClient.getQueryData(resourceQueryKey)).toEqual({ unexpected: true });

    unmount();
    dispose();
  });

  it('reports a clear error when no edit query function is provided', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const previousItem: TestData = { id: 'user-1', name: 'Previous' };
    const { result, unmount } = renderHook(
      () => useEditMutation<TestData, EditVariables>({
        getErrorNotificationMessage: (_item, _variables, error) => error instanceof Error ? error.message : 'Unknown error',
        getProgressNotificationMessage: item => `Updating ${item.name}`,
        getSuccessNotificationMessage: item => `Updated ${item.name}`,
      }),
      { wrapper },
    );
    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Updated',
        nested: { value: '' },
      }, previousItem);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(notificationService.data[0]?.message).toBe('Edit mutation queryFn is required');

    unmount();
    dispose();
  });
});
