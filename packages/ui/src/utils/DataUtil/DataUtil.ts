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
  public static getCaseSetName(caseSet: CaseSet): string {
    return `${caseSet.name} (${format(caseSet.case_set_date, DATE_FORMAT.DATE)})`;
  }


  public static getColTypeOptionsForRefDimId(kwArgs: { colsValidationRules: RefColValidationRulesResponseBody['valid_col_types_by_dim_type']; colTypeOptions: OptionBase<string>[]; refDimId: string; refDimMap: Map<string, RefDim> }): OptionBase<string>[] {
    const refDim = kwArgs.refDimMap.get(kwArgs.refDimId);
    if (!refDim) {
      return [];
    }
    return kwArgs.colTypeOptions.filter((option) => {
      const colType = option.value as ColType;
      return kwArgs.colsValidationRules[refDim.dim_type].includes(colType);
    });
  }

  public static getDimOptionsForCaseTypeId(kwArgs: { caseTypeId: string; dimMap: Map<string, Dim>; dimOptions: OptionBase<string>[] }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }

    return kwArgs.dimOptions.filter((option) => {
      const dim = kwArgs.dimMap.get(option.value);
      return dim?.case_type_id === kwArgs.caseTypeId;
    });
  }

  public static getGeneticSequenceColOptionsForCaseTypeId(kwArgs: { caseTypeId: string; colMap: Map<string, Col>; colOptions: OptionBase<string>[]; refColMap: Map<string, RefCol> }): OptionBase<string>[] {
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


  public static getRefColOptionsForDimId(kwArgs: { colsValidationRules: RefColValidationRulesResponseBody['valid_col_types_by_dim_type']; dimId: string; dimMap: Map<string, Dim>; refColMap: Map<string, RefCol>; refColOptions: OptionBase<string>[]; refDimMap: Map<string, RefDim> }): OptionBase<string>[] {
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

  public static getUserDisplayValue(user: User, t: TFunction<'translation', undefined>): string {
    if (!user) {
      return t`Unknown user`;
    }
    return `${user.name} (${user.key})`;
  }


  public static rankSortComperatorFactory<TSecondarySorKey extends keyof TItem, TItem extends { rank?: number }>(secondarySortKeyOrFn?: ((item: TItem) => string) | TSecondarySorKey) {
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
