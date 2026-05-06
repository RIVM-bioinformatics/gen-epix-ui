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
import { NotificationUtil } from '../../utils/NotificationUtil';
import { ObjectUtil } from '../../utils/ObjectUtil';
import { QueryKeyManager } from '../../classes/managers/QueryKeyManager';

export type MutationContextEdit<TData> = { item?: TData; notificationKey?: string; previousData?: TData[] };

export type UseEditMutationProps<TData, TVariables = TData> = {
  readonly associationQueryKeys?: string[][];
  readonly getErrorNotificationMessage: (data: TData, variables: TVariables, error: unknown) => ReactElement | string;
  // Optional function to get an intermediate item to be set in the query cache before the mutation is completed.
  // This is useful for optimistic updates where you want to show a temporary state before the mutation is confirmed.
  // The function receives the variables and the previous item, and should return the intermediate item.
  // Only needed if the variables are different from the previous item.
  readonly getIntermediateItem?: (variables: TVariables, previousItem: TData) => TData;
  readonly getProgressNotificationMessage: (data: TData, variables: TVariables) => ReactElement | string;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextEdit<TData>) => ReactElement | string;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly queryFn?: (variables: TVariables, previousData: TData) => Promise<TData>;
  readonly resourceQueryKey?: string[];
};

export const useEditMutation = <TData extends GenericData | GenericData[], TVariables = TData>({
  associationQueryKeys,
  getErrorNotificationMessage,
  getIntermediateItem,
  getProgressNotificationMessage,
  getSuccessNotificationMessage,
  onError,
  onSuccess,
  queryFn,
  resourceQueryKey,
}: UseEditMutationProps<TData, TVariables>) => {
  const queryClient = QueryClientManager.getInstance().queryClient;
  const previousItemRef = useRef<TData>(undefined);

  const setPreviousItem = useCallback((item: TData) => {
    previousItemRef.current = item;
  }, []);

  const mutationFn = useCallback(async (variables: TVariables) => {
    return queryFn(ObjectUtil.deepRemoveEmptyStrings(variables), previousItemRef.current);
  }, [previousItemRef, queryFn]);

  const editMutation = useMutation<TData, Error, TVariables, MutationContextEdit<TData>>({
    mutationFn,
    onError: async (error, variables, context) => {
      previousItemRef.current = undefined;
      if (resourceQueryKey && Array.isArray(context.previousData)) {
        queryClient.setQueryData(resourceQueryKey, (oldItems: TData[]) => {
          if (!Array.isArray(oldItems)) {
            return oldItems;
          }
          return [...oldItems.filter(x => (x as GenericData).id !== (context.item as GenericData).id), context.item];
        });
      }
      await QueryKeyManager.getInstance().invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, variables, context);
      }
      NotificationManager.getInstance().fulfillNotification(context.notificationKey, NotificationUtil.wrapErrorNotificationMessage(getErrorNotificationMessage(context.item, variables, error), error), 'error');
    },
    onMutate: async (variables) => {
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: getProgressNotificationMessage(previousItemRef.current, variables),
        severity: 'info',
      });
      if (resourceQueryKey) {
        if (!previousItemRef.current) {
          throw new Error('previousItem is not set');
        }
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);
        if (Array.isArray(previousData) && !Array.isArray(variables)) {
          const intermediateItem = getIntermediateItem ? getIntermediateItem(variables, previousItemRef.current) : {
            ...variables,
            id: (previousItemRef.current as GenericData).id,
          } as GenericData;
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return [...oldItems.filter(x => x.id !== (previousItemRef.current as GenericData).id), intermediateItem] as GenericData[];
          });
          return { item: previousItemRef.current, notificationKey, previousData };
        }
      }
      return { notificationKey };
    },
    onSuccess: async (item, variables, context) => {
      previousItemRef.current = undefined;
      await QueryKeyManager.getInstance().invalidateQueryKeys(associationQueryKeys);
      if (onSuccess) {
        await onSuccess(item, variables, context);
      }
      NotificationManager.getInstance().fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const mutate = useMemo(() => editMutation.mutate, [editMutation.mutate]);
  const isMutating = useMemo(() => editMutation.isPending, [editMutation.isPending]);
  return useMemo(() => ({ isMutating, mutate, setPreviousItem }), [isMutating, mutate, setPreviousItem]);
};
