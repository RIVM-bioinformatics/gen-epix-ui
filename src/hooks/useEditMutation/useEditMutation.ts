import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QueryUtil } from '../../utils/QueryUtil';
import { NotificationUtil } from '../../utils/NotificationUtil';

export type MutationContextEdit<TData> = { previousData?: TData[]; notificationKey?: string; item?: TData };

export type UseEditMutationProps<TData, TVariables = TData> = {
  readonly queryFn?: (variables: TVariables, previousData: TData) => Promise<TData>;
  readonly resourceQueryKey?: string[];
  readonly associationQueryKeys?: string[][];
  readonly getProgressNotificationMessage: (data: TData, variables: TVariables) => string | ReactElement;
  readonly getErrorNotificationMessage: (data: TData, variables: TVariables, error: unknown) => string | ReactElement;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextEdit<TData>) => string | ReactElement;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void>;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void>;
  // Optional function to get an intermediate item to be set in the query cache before the mutation is completed.
  // This is useful for optimistic updates where you want to show a temporary state before the mutation is confirmed.
  // The function receives the variables and the previous item, and should return the intermediate item.
  // Only needed if the variables are different from the previous item.
  readonly getIntermediateItem?: (variables: TVariables, previousItem: TData) => TData;
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
  getIntermediateItem,
}: UseEditMutationProps<TData, TVariables>) => {
  const queryClient = QueryClientManager.instance.queryClient;
  const previousItem = useRef<TData>(undefined);

  const setPreviousItem = useCallback((item: TData) => {
    previousItem.current = item;
  }, []);

  const mutationFn = useCallback(async (variables: TVariables) => {
    return queryFn(variables, previousItem.current);
  }, [previousItem, queryFn]);

  const editMutation = useMutation<TData, Error, TVariables, MutationContextEdit<TData>>({
    mutationFn,
    onMutate: async (variables) => {
      const notificationKey = NotificationManager.instance.showNotification({
        message: getProgressNotificationMessage(previousItem.current, variables),
        severity: 'info',
        isLoading: true,
      });
      if (resourceQueryKey) {
        if (!previousItem.current) {
          throw new Error('previousItem is not set');
        }
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);
        if (Array.isArray(previousData) && !Array.isArray(variables)) {
          const intermediateItem = getIntermediateItem ? getIntermediateItem(variables, previousItem.current) : {
            ...variables,
            id: (previousItem.current as GenericData).id,
          } as GenericData;
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return [...oldItems.filter(x => x.id !== (previousItem.current as GenericData).id), intermediateItem] as GenericData[];
          });
          return { previousData, notificationKey, item: previousItem.current };
        }
      }
      return { notificationKey };
    },
    onError: async (error, variables, context) => {
      previousItem.current = undefined;
      if (resourceQueryKey && Array.isArray(context.previousData)) {
        queryClient.setQueryData(resourceQueryKey, (oldItems: TData[]) => {
          if (!Array.isArray(oldItems)) {
            return oldItems;
          }
          return [...oldItems.filter(x => (x as GenericData).id !== (context.item as GenericData).id), context.item];
        });
      }
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, NotificationUtil.wrapErrorNotificationMessage(getErrorNotificationMessage(context.item, variables, error), error), 'error');
    },
    onSuccess: async (item, variables, context) => {
      previousItem.current = undefined;
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
  return useMemo(() => ({ mutate, isMutating, setPreviousItem }), [isMutating, mutate, setPreviousItem]);
};
