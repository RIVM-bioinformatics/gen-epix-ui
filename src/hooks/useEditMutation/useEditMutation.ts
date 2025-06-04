import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QueryUtil } from '../../utils/QueryUtil';

export type MutationContextEdit<TData> = { previousData?: TData[]; notificationKey?: string };

export type UseEditMutationProps<TData, TVariables = TData> = {
  readonly queryFn?: (variables: TVariables, previousData: TData) => Promise<TData>;
  readonly resourceQueryKey?: string[];
  readonly associationQueryKeys?: string[][];
  readonly getProgressNotificationMessage: (data: TData, variables: TVariables) => string | ReactElement;
  readonly getErrorNotificationMessage: (variables: TVariables, error: unknown) => string | ReactElement;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextEdit<TData>) => string | ReactElement;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void>;
};

export const useEditMutation = <TData extends GenericData | GenericData[], TVariables = TData>({
  queryFn,
  resourceQueryKey,
  associationQueryKeys,
  getErrorNotificationMessage,
  getSuccessNotificationMessage,
  getProgressNotificationMessage,
  onSuccess,
  onError,
}: UseEditMutationProps<TData, TVariables>) => {
  const queryClient = QueryClientManager.instance.queryClient;

  const [previousItem, setPreviousItem] = useState<TData>(undefined);

  const mutationFn = useCallback(async (variables: TVariables) => {
    return queryFn(variables, previousItem);
  }, [previousItem, queryFn]);

  const editMutation = useMutation<TData, Error, TVariables, MutationContextEdit<TData>>({
    mutationFn,
    onMutate: async (variables) => {
      const notificationKey = NotificationManager.instance.showNotification({
        message: getProgressNotificationMessage(previousItem, variables),
        severity: 'info',
        isLoading: true,
      });
      if (resourceQueryKey) {
        if (!previousItem) {
          throw new Error('previousItem is not set');
        }
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);
        if (Array.isArray(previousData) && !Array.isArray(variables)) {
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return [
              ...oldItems.filter(x => x.id !== (previousItem as GenericData).id),
              {
                ...variables,
                id: (previousItem as GenericData).id,
              },
            ];
          });
          return { previousData, notificationKey };
        }
      }
      return { notificationKey };
    },
    onError: async (error, variables, context) => {
      if (resourceQueryKey && Array.isArray(context.previousData)) {
        queryClient.setQueryData(resourceQueryKey, context.previousData);
      }
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, getErrorNotificationMessage(variables, error), 'error');
    },
    onSuccess: async (item, variables, context) => {
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onSuccess) {
        await onSuccess(item, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const mutate = useMemo(() => editMutation.mutate, [editMutation.mutate]);
  const isMutating = useMemo(() => editMutation.isPending, [editMutation.isPending]);
  return useMemo(() => ({ mutate, isMutating, setPreviousItem }), [isMutating, mutate]);
};
