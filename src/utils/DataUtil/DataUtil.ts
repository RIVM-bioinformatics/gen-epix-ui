import type { TFunction } from 'i18next';
import type { UseQueryResult } from '@tanstack/react-query';

import { StringUtil } from '../StringUtil';
import type {
  CaseTypeDim,
  Col,
  ColType,
  ColValidationRulesResponseBody,
  Dim,
  User,
} from '../../api';
import type {
  Loadable,
  UseMap,
  UseOptions,
  UseNameFactory,
} from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export class DataUtil {
  public static getCaseTypeDimOptionsByCaseTypeId(kwArgs: { caseTypeDimOptions: OptionBase<string>[]; caseTypeDimMap: Map<string, CaseTypeDim> }): Map<string, OptionBase<string>[]> {
    const map = new Map<string, OptionBase<string>[]>();
    kwArgs.caseTypeDimOptions.forEach((option) => {
      const caseTypeDim = kwArgs.caseTypeDimMap.get(option.value);
      if (caseTypeDim) {
        const existing = map.get(caseTypeDim.case_type_id) ?? [];
        existing.push(option);
        map.set(caseTypeDim.case_type_id, existing);
      }
    });
    return map;
  }

  public static getColOptionsByCaseTypeDimId(kwArgs: { caseTypeDimMap: Map<string, CaseTypeDim>; dimMap: Map<string, Dim>; colOptions: OptionBase<string>[]; colMap: Map<string, Col>; colsValidationRules: ColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): Map<string, OptionBase<string>[]> {
    const map = new Map<string, OptionBase<string>[]>();

    Array.from(kwArgs.caseTypeDimMap.values()).forEach(caseTypeDim => {
      const dim = kwArgs.dimMap.get(caseTypeDim.dim_id);
      map.set(caseTypeDim.id, kwArgs.colOptions.filter((option) => {
        const col = kwArgs.colMap.get(option.value);
        return col.dim_id === dim.id && kwArgs.colsValidationRules[dim.dim_type].includes(col.col_type);
      }));
    });

    return map;
  }

  public static getColTypeOptionsByDimId(kwArgs: { dimMap: Map<string, Dim>; colTypeOptions: OptionBase<string>[]; colsValidationRules: ColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): Map<string, OptionBase<string>[]> {
    const map = new Map<string, OptionBase<string>[]>();

    Array.from(kwArgs.dimMap.values()).forEach(dim => {
      map.set(dim.id, kwArgs.colTypeOptions.filter((option) => {
        return kwArgs.colsValidationRules?.[dim.dim_type]?.includes(option.value as ColType);
      }));
    });

    return map;
  }


  public static getUserDisplayValue(user: User, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return `${user.name} (${user.key})`;
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
