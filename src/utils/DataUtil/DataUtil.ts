import type { TFunction } from 'i18next';
import type { UseQueryResult } from '@tanstack/react-query';

import { StringUtil } from '../StringUtil';
import type {
  CompleteUser,
  User,
} from '../../api';
import type {
  Loadable,
  UseMap,
  UseOptions,
  UseNameFactory,
} from '../../models/dataHooks';

export class DataUtil {
  public static getUserDisplayValue(user: User | CompleteUser, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return user.name ?? user.email;
  }

  public static isResponse<TValue>(response: unknown): response is UseQueryResult<TValue> {
    if (!response) {
      return false;
    }
    if (typeof response !== 'object') {
      return false;
    }
    if (!('isLoading' in response)) {
      return false;
    }
    return true;
  }

  public static createMemorizationDependency<T>(response: UseQueryResult<T>): unknown {
    return JSON.stringify({
      data: response.data,
      error: response.error,
      isLoading: response.isLoading,
      isPending: response.isPending,
    });
  }

  public static createUseMapDataHook<TValue>(
    response: UseQueryResult<TValue[]> | TValue[],
    getId: (item: TValue) => string,
    loadables: Loadable[] = [],
  ): UseMap<TValue> {
    if (DataUtil.isResponse(response) && response.error) {
      return {
        isLoading: false,
        error: response.error,
        map: new Map(),
      };
    }
    if (loadables?.some(obj => obj.error)) {
      return {
        isLoading: false,
        error: loadables.find(obj => obj.error).error,
        map: new Map(),
      };
    }

    const isLoadings = [DataUtil.isResponse(response) ? (response.isLoading || response.isPending || response.isFetching) : false];
    if (loadables) {
      isLoadings.push(...loadables.map(obj => obj.isLoading));
    }
    const isLoading = isLoadings.some(x => x);
    let map: Map<string, TValue> = new Map();
    if (!isLoading) {
      const items = DataUtil.isResponse(response) ? response.data : response;
      map = new Map(items?.map(item => [getId(item), item]));
    }

    return {
      isLoading,
      map,
      error: null,
    };
  }

  public static createUseOptionsDataHook<TValue>(
    response: UseQueryResult<TValue[]> | TValue[],
    getId: (item: TValue) => string,
    createLabel: (item: TValue) => string,
    loadables?: Loadable[],
    sortComperator?: (a: string, b: string) => number,
  ): UseOptions<string> {
    if (DataUtil.isResponse(response) && response.error) {
      return {
        isLoading: false,
        error: response.error,
        options: [],
      };
    }
    if (loadables?.some(obj => obj.error)) {
      return {
        isLoading: false,
        error: loadables.find(obj => obj.error).error,
        options: [],
      };
    }

    const isLoading = [
      DataUtil.isResponse(response) ? (response.isLoading || response.isPending) : false,
      ...loadables?.map(obj => obj.isLoading) ?? [],
    ].some(Boolean);
    const sort = sortComperator ?? StringUtil.sortComperator;

    let options: {
      value: string;
      label: string;
    }[] = [];
    if (!isLoading) {
      const items = DataUtil.isResponse(response) ? response.data : response;
      options = items?.map(item => ({ value: getId(item), label: createLabel(item) })).sort((a, b) => {
        return sort(a.label, b.label);
      }) ?? [];
    }

    return {
      isLoading,
      options,
      error: null,
    };
  }

  public static createUseNameFactoryHook<TValue>(
    getName: (item: TValue) => string,
    loadables?: Loadable[],
  ): UseNameFactory<TValue> {
    if (loadables?.some(obj => obj.error)) {
      return {
        isLoading: false,
        error: loadables.find(obj => obj.error).error,
        getName,
      };
    }

    const isLoading = loadables ? loadables.some(obj => obj.isLoading) : false;
    if (isLoading) {
      return {
        isLoading,
        error: null,
        getName: () => '',
      };
    }

    return {
      isLoading,
      error: null,
      getName,
    };

  }
}
