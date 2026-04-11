import type { UseQueryResult } from '@tanstack/react-query';

import type {
  Loadable,
  UseMap,
  UseNameFactory,
  UseOptions,
} from '../../models/dataHooks';
import { StringUtil } from '../StringUtil';
import { LoadableUtil } from '../LoadableUtil';

export class DataHookUtil {
  public static createUseMapDataHook<TValue>(
    response: TValue[] | UseQueryResult<TValue[]>,
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
        error,
        isEnabled,
        isFetching,
        isLoading,
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
      error: null,
      isEnabled,
      isFetching,
      isLoading,
      isPending,
      map,
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
        error,
        getName,
        isEnabled: true,
        isFetching: false,
        isLoading: false,
        isPending: false,
      };
    }

    return {
      error,
      getName: isLoading ? () => '' : getName,
      isEnabled,
      isFetching,
      isLoading,
      isPending,
    };

  }

  public static createUseOptionsDataHook<TItem>(
    response: TItem[] | UseQueryResult<TItem[]>,
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
        error,
        isEnabled,
        isFetching,
        isLoading,
        isPending,
        options: [],
      };
    }

    const sort = sortComperator ?? ((a: TItem, b: TItem) => StringUtil.sortComperator(createLabel(a), createLabel(b)));

    let options: {
      label: string;
      value: string;
    }[] = [];
    if (!isLoading) {
      const items = DataHookUtil.isResponse(response) ? response.data : response;
      options = items?.sort(sort).map(item => ({ label: createLabel(item), value: getId(item) })) ?? [];
    }

    return {
      error,
      isEnabled,
      isFetching,
      isLoading,
      isPending,
      options,
    };
  }

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
}
