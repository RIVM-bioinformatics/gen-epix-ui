import type { TFunction } from 'i18next';
import type { UseQueryResult } from '@tanstack/react-query';

import { StringUtil } from '../StringUtil';
import type {
  CaseTypeCol,
  CaseTypeDim,
  Col,
  ColValidationRulesResponseBody,
  Dim,
  User,
} from '../../api';
import { ColType } from '../../api';
import type {
  Loadable,
  UseMap,
  UseOptions,
  UseNameFactory,
} from '../../models/dataHooks';
import type { OptionBase } from '../../models/form';

export class DataUtil {
  public static getGeneticSequenceCaseTypeColOptionsForCaseTypeId(kwArgs: { caseTypeId: string; colMap: Map<string, Col>; caseTypeColMap: Map<string, CaseTypeCol>; caseTypeColOptions: OptionBase<string>[] }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }
    return kwArgs.caseTypeColOptions.filter((option) => {
      const caseTypeCol = kwArgs.caseTypeColMap.get(option.value);
      if (caseTypeCol?.case_type_id !== kwArgs.caseTypeId) {
        return false;
      }
      const col = kwArgs.colMap.get(caseTypeCol.col_id);
      return col?.col_type === ColType.GENETIC_SEQUENCE;
    });
  }


  public static getCaseTypeDimOptionsForCaseTypeId(kwArgs: { caseTypeId: string; caseTypeDimOptions: OptionBase<string>[]; caseTypeDimMap: Map<string, CaseTypeDim> }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }

    return kwArgs.caseTypeDimOptions.filter((option) => {
      const caseTypeDim = kwArgs.caseTypeDimMap.get(option.value);
      return caseTypeDim?.case_type_id === kwArgs.caseTypeId;
    });
  }

  public static getColOptionsForCaseTypeDimId(kwArgs: { caseTypeDimId: string; caseTypeDimMap: Map<string, CaseTypeDim>; dimMap: Map<string, Dim>; colOptions: OptionBase<string>[]; colMap: Map<string, Col>; colsValidationRules: ColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): OptionBase<string>[] {
    const caseTypeDim = kwArgs.caseTypeDimMap.get(kwArgs.caseTypeDimId);
    if (!caseTypeDim) {
      return [];
    }
    const dim = kwArgs.dimMap.get(caseTypeDim.dim_id);
    return kwArgs.colOptions.filter((option) => {
      const col = kwArgs.colMap.get(option.value);
      if (col.dim_id !== caseTypeDim.dim_id) {
        return false;
      }
      const colType = col.col_type;
      return kwArgs.colsValidationRules[dim.dim_type].includes(colType);
    });
  }

  public static getColTypeOptionsForDimId(kwArgs: { dimId: string; dimMap: Map<string, Dim>; colTypeOptions: OptionBase<string>[]; colsValidationRules: ColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): OptionBase<string>[] {
    const dim = kwArgs.dimMap.get(kwArgs.dimId);
    if (!dim) {
      return [];
    }
    return kwArgs.colTypeOptions.filter((option) => {
      const colType = option.value as ColType;
      return kwArgs.colsValidationRules[dim.dim_type].includes(colType);
    });
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
