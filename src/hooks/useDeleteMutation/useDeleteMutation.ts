import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QueryUtil } from '../../utils/QueryUtil';


export type MutationContextDelete<TData> = { previousData?: TData[]; notificationKey?: string };

export type UseDeleteMutationProps<TData> = {
  readonly resourceQueryKey?: string[];
  readonly associationQueryKeys?: string[][];
  readonly queryFn?: (data: TData) => Promise<unknown>;
  readonly getProgressNotificationMessage: (data: TData) => string | ReactElement;
  readonly getErrorNotificationMessage?: (data: TData, error: unknown) => string | ReactElement;
  readonly getSuccessNotificationMessage?: (data: TData, context: MutationContextDelete<TData>) => string | ReactElement;
  readonly onSuccess?: (item: TData, context: MutationContextDelete<TData>) => Promise<void>;
  readonly onError?: (error: unknown, item: TData, context: MutationContextDelete<TData>) => Promise<void>;
};

export const useDeleteMutation = <TData extends GenericData | GenericData[]>({
  resourceQueryKey,
  associationQueryKeys,
  queryFn,
  onSuccess,
  onError,
  getErrorNotificationMessage,
  getSuccessNotificationMessage,
  getProgressNotificationMessage,
}: UseDeleteMutationProps<TData>) => {
  const queryClient = QueryClientManager.instance.queryClient;

  const deleteMutation = useMutation<unknown, Error, TData, MutationContextDelete<TData>>({
    mutationFn: async (item) => {
      return queryFn(item);
    },
    onMutate: async (item) => {
      const notificationKey = NotificationManager.instance.showNotification({
        message: getProgressNotificationMessage(item),
        severity: 'info',
        isLoading: true,
      });
      if (resourceQueryKey) {
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);

        if (Array.isArray(previousData) && !Array.isArray(item)) {
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return oldItems.filter(i => i.id !== item.id);
          });
          return { previousData, notificationKey };
        }
      }
      return { notificationKey };
    },
    onError: async (error, item, context) => {
      if (resourceQueryKey) {
        queryClient.setQueryData(resourceQueryKey, context.previousData);
      }
      if (associationQueryKeys) {
        await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      }
      if (onError) {
        await onError(error, item, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, getErrorNotificationMessage(item, error), 'error');
    },
    onSuccess: async (_data, item, context) => {
      if (associationQueryKeys) {
        await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      }
      if (onSuccess) {
        await onSuccess(item, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const mutate = useMemo(() => deleteMutation.mutate, [deleteMutation.mutate]);
  const isMutating = useMemo(() => deleteMutation.isPending, [deleteMutation.isPending]);
  return useMemo(() => ({ mutate, isMutating }), [isMutating, mutate]);
};
