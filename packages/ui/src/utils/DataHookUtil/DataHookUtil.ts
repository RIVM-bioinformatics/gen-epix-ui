import type { UseQueryResult } from '@tanstack/react-query';

import type {
  Loadable,
  UseMap,
  UseOptions,
  UseNameFactory,
} from '../../models/dataHooks';
import { StringUtil } from '../StringUtil';
import { LoadableUtil } from '../LoadableUtil';

export class DataHookUtil {
  private static isResponse<TValue>(response: unknown): response is UseQueryResult<TValue> {
    if (!response) {
      return false;
    }
    if (typeof response !== 'object') {
      return false;
    }
    if (!('isLoading' in response) || !('isFetching' in response) || !('isPending' in response) || !('isEnabled' in response) || !('error' in response)) {
      return false;
    }
    return true;
  }

  public static createUseMapDataHook<TValue>(
    response: UseQueryResult<TValue[]> | TValue[],
    getId: (item: TValue) => string,
    loadables: Loadable[] = [],
  ): UseMap<TValue> {
    const loadablesAndResponse: Loadable[] = [...(DataHookUtil.isResponse(response) ? [response] : []), ...(Array.isArray(loadables) ? loadables : [])];

    const isLoading = LoadableUtil.isSomeLoading(loadablesAndResponse);
    const isFetching = LoadableUtil.isSomeFetching(loadablesAndResponse);
    const isPending = LoadableUtil.isSomePending(loadablesAndResponse);
    const isEnabled = LoadableUtil.isAllEnabled(loadablesAndResponse);
    const error = LoadableUtil.findFirstError(loadablesAndResponse);

    if (error) {
      return {
        isLoading,
        error,
        isEnabled,
        isFetching,
        isPending,
        map: new Map(),
      };
    }

    let map: Map<string, TValue> = new Map();
    if (!isLoading) {
      const items = DataHookUtil.isResponse(response) ? response.data : response;
      map = new Map(items?.map(item => [getId(item), item]));
    }

    return {
      isLoading,
      isPending,
      isFetching,
      isEnabled,
      map,
      error: null,
    };
  }

  public static createUseOptionsDataHook<TItem>(
    response: UseQueryResult<TItem[]> | TItem[],
    getId: (item: TItem) => string,
    createLabel: (item: TItem) => string,
    loadables?: Loadable[],
    sortComperator?: (a: TItem, b: TItem) => number,
  ): UseOptions<string> {
    const loadablesAndResponse: Loadable[] = [...(DataHookUtil.isResponse(response) ? [response] : []), ...(Array.isArray(loadables) ? loadables : [])];

    const isLoading = LoadableUtil.isSomeLoading(loadablesAndResponse);
    const isFetching = LoadableUtil.isSomeFetching(loadablesAndResponse);
    const isPending = LoadableUtil.isSomePending(loadablesAndResponse);
    const isEnabled = LoadableUtil.isAllEnabled(loadablesAndResponse);
    const error = LoadableUtil.findFirstError(loadablesAndResponse);

    if (error) {
      return {
        isLoading,
        isPending,
        isFetching,
        isEnabled,
        error,
        options: [],
      };
    }

    const sort = sortComperator ?? ((a: TItem, b: TItem) => StringUtil.sortComperator(createLabel(a), createLabel(b)));

    let options: {
      value: string;
      label: string;
    }[] = [];
    if (!isLoading) {
      const items = DataHookUtil.isResponse(response) ? response.data : response;
      options = items?.sort(sort).map(item => ({ value: getId(item), label: createLabel(item) })) ?? [];
    }

    return {
      isLoading,
      isPending,
      isFetching,
      isEnabled,
      options,
      error,
    };
  }

  public static createUseNameFactoryHook<TValue>(
    getName: (item: TValue) => string,
    loadables?: Loadable[],
  ): UseNameFactory<TValue> {
    const isLoading = Array.isArray(loadables) ? LoadableUtil.isSomeLoading(loadables) : false;
    const isFetching = Array.isArray(loadables) ? LoadableUtil.isSomeFetching(loadables) : false;
    const isPending = Array.isArray(loadables) ? LoadableUtil.isSomePending(loadables) : false;
    const isEnabled = Array.isArray(loadables) ? LoadableUtil.isAllEnabled(loadables) : false;
    const error = Array.isArray(loadables) ? LoadableUtil.findFirstError(loadables) : null;

    if (error) {
      return {
        isLoading: false,
        isEnabled: true,
        isFetching: false,
        isPending: false,
        error,
        getName,
      };
    }

    return {
      isLoading,
      isPending,
      isFetching,
      isEnabled,
      error,
      getName: isLoading ? () => '' : getName,
    };

  }
}
