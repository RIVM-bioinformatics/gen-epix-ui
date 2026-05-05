import { format } from 'date-fns';
import type {
  CaseDbCaseSet,
  CaseDbCol,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefColValidationRulesResponseBody,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import type { OptionBase } from '../../../../ui/src/models/form';
import { DATE_FORMAT } from '../../../../ui/src/data/date';

export class CaseDbDataUtil {
  public static getCaseSetName(caseSet: CaseDbCaseSet): string {
    return `${caseSet.name} (${format(caseSet.case_set_date, DATE_FORMAT.DATE)})`;
  }


  public static getColTypeOptionsForRefDimId(kwArgs: { colsValidationRules: CaseDbRefColValidationRulesResponseBody['valid_col_types_by_dim_type']; colTypeOptions: OptionBase<string>[]; refDimId: string; refDimMap: Map<string, CaseDbRefDim> }): OptionBase<string>[] {
    const refDim = kwArgs.refDimMap.get(kwArgs.refDimId);
    if (!refDim) {
      return [];
    }
    return kwArgs.colTypeOptions.filter((option) => {
      const colType = option.value as CaseDbColType;
      return kwArgs.colsValidationRules[refDim.dim_type].includes(colType);
    });
  }

  public static getDimOptionsForCaseTypeId(kwArgs: { caseTypeId: string; dimMap: Map<string, CaseDbDim>; dimOptions: OptionBase<string>[] }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }

    return kwArgs.dimOptions.filter((option) => {
      const dim = kwArgs.dimMap.get(option.value);
      return dim?.case_type_id === kwArgs.caseTypeId;
    });
  }

  public static getGeneticSequenceColOptionsForCaseTypeId(kwArgs: { caseTypeId: string; colMap: Map<string, CaseDbCol>; colOptions: OptionBase<string>[]; refColMap: Map<string, CaseDbRefCol> }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }
    return kwArgs.colOptions.filter((option) => {
      const col = kwArgs.colMap.get(option.value);
      if (col?.case_type_id !== kwArgs.caseTypeId) {
        return false;
      }
      const refCol = kwArgs.refColMap.get(col.ref_col_id);
      return refCol?.col_type === CaseDbColType.GENETIC_SEQUENCE;
    });
  }


  public static getRefColOptionsForDimId(kwArgs: { colsValidationRules: CaseDbRefColValidationRulesResponseBody['valid_col_types_by_dim_type']; dimId: string; dimMap: Map<string, CaseDbDim>; refColMap: Map<string, CaseDbRefCol>; refColOptions: OptionBase<string>[]; refDimMap: Map<string, CaseDbRefDim> }): OptionBase<string>[] {
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


}
