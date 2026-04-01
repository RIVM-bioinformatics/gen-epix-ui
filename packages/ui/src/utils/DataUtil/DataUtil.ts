import type { TFunction } from 'i18next';
import { format } from 'date-fns';

import type {
  CaseSet,
  Col,
  Dim,
  RefCol,
  RefColValidationRulesResponseBody,
  RefDim,
  User,
} from '../../api';
import { ColType } from '../../api';
import type { OptionBase } from '../../models/form';
import { DATE_FORMAT } from '../../data/date';

export class DataUtil {
  public static getGeneticSequenceColOptionsForCaseTypeId(kwArgs: { caseTypeId: string; refColMap: Map<string, RefCol>; colMap: Map<string, Col>; colOptions: OptionBase<string>[] }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }
    return kwArgs.colOptions.filter((option) => {
      const col = kwArgs.colMap.get(option.value);
      if (col?.case_type_id !== kwArgs.caseTypeId) {
        return false;
      }
      const refCol = kwArgs.refColMap.get(col.ref_col_id);
      return refCol?.col_type === ColType.GENETIC_SEQUENCE;
    });
  }


  public static getDimOptionsForCaseTypeId(kwArgs: { caseTypeId: string; dimOptions: OptionBase<string>[]; dimMap: Map<string, Dim> }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }

    return kwArgs.dimOptions.filter((option) => {
      const dim = kwArgs.dimMap.get(option.value);
      return dim?.case_type_id === kwArgs.caseTypeId;
    });
  }

  public static getRefColOptionsForDimId(kwArgs: { dimId: string; dimMap: Map<string, Dim>; refDimMap: Map<string, RefDim>; refColOptions: OptionBase<string>[]; refColMap: Map<string, RefCol>; colsValidationRules: RefColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): OptionBase<string>[] {
    const dim = kwArgs.dimMap.get(kwArgs.dimId);
    if (!dim) {
      return [];
    }
    const refDim = kwArgs.refDimMap.get(dim.ref_dim_id);
    return kwArgs.refColOptions.filter((option) => {
      const refCol = kwArgs.refColMap.get(option.value);
      if (refCol.ref_dim_id !== dim.ref_dim_id) {
        return false;
      }
      const colType = refCol.col_type;
      return kwArgs.colsValidationRules[refDim.dim_type].includes(colType);
    });
  }

  public static getColTypeOptionsForRefDimId(kwArgs: { refDimId: string; refDimMap: Map<string, RefDim>; colTypeOptions: OptionBase<string>[]; colsValidationRules: RefColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): OptionBase<string>[] {
    const refDim = kwArgs.refDimMap.get(kwArgs.refDimId);
    if (!refDim) {
      return [];
    }
    return kwArgs.colTypeOptions.filter((option) => {
      const colType = option.value as ColType;
      return kwArgs.colsValidationRules[refDim.dim_type].includes(colType);
    });
  }


  public static getUserDisplayValue(user: User, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return `${user.name} (${user.key})`;
  }

  public static getCaseSetName(caseSet: CaseSet): string {
    return `${caseSet.name} (${format(caseSet.case_set_date, DATE_FORMAT.DATE)})`;
  }

  public static deepRemoveEmptyStrings<T>(obj: T): T {
    if (typeof obj === 'string') {
      return (obj === '' ? null : obj) as unknown as T;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => DataUtil.deepRemoveEmptyStrings<T>(item as unknown as T)) as unknown as T;
    }
    if (typeof obj === 'object' && obj !== null) {
      const newObj: { [key: string]: unknown } = {};
      Object.entries(obj).forEach(([key, value]) => {
        newObj[key] = DataUtil.deepRemoveEmptyStrings(value);
      });
      return newObj as T;
    }
    return obj;
  }

  public static rankSortComperatorFactory<TSecondarySorKey extends keyof TItem, TItem extends { rank?: number }>(secondarySortKeyOrFn?: TSecondarySorKey | ((item: TItem) => string)) {
    return (a: TItem, b: TItem): number => {
      const rankComparison = (a.rank ?? 0) - (b.rank ?? 0);
      if (rankComparison !== 0 || !secondarySortKeyOrFn) {
        return rankComparison;
      }
      let aSecondary: unknown;
      let bSecondary: unknown;
      if (typeof secondarySortKeyOrFn === 'function') {
        aSecondary = secondarySortKeyOrFn(a);
        bSecondary = secondarySortKeyOrFn(b);
      } else {
        aSecondary = a[secondarySortKeyOrFn];
        bSecondary = b[secondarySortKeyOrFn];
      }
      if (aSecondary === bSecondary) {
        return 0;
      }
      if (aSecondary === undefined || aSecondary === null) {
        return -1;
      }
      if (bSecondary === undefined || bSecondary === null) {
        return 1;
      }
      if (typeof aSecondary === 'string' && typeof bSecondary === 'string') {
        return aSecondary.localeCompare(bSecondary);
      }
      if (typeof aSecondary === 'number' && typeof bSecondary === 'number') {
        return aSecondary - bSecondary;
      }
      return 0;
    };
  }
}
