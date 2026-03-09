import type { TFunction } from 'i18next';
import { format } from 'date-fns';

import type {
  CaseSet,
  CaseTypeCol,
  CaseTypeDim,
  RefCol,
  RefColValidationRulesResponseBody,
  RefDim,
  User,
} from '../../api';
import { ColType } from '../../api';
import type { OptionBase } from '../../models/form';
import { DATE_FORMAT } from '../../data/date';

export class DataUtil {
  public static getGeneticSequenceCaseTypeColOptionsForCaseTypeId(kwArgs: { caseTypeId: string; refColMap: Map<string, RefCol>; caseTypeColMap: Map<string, CaseTypeCol>; caseTypeColOptions: OptionBase<string>[] }): OptionBase<string>[] {
    if (!kwArgs.caseTypeId) {
      return [];
    }
    return kwArgs.caseTypeColOptions.filter((option) => {
      const caseTypeCol = kwArgs.caseTypeColMap.get(option.value);
      if (caseTypeCol?.case_type_id !== kwArgs.caseTypeId) {
        return false;
      }
      const refCol = kwArgs.refColMap.get(caseTypeCol.ref_col_id);
      return refCol?.col_type === ColType.GENETIC_SEQUENCE;
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

  public static getRefColOptionsForCaseTypeDimId(kwArgs: { caseTypeDimId: string; caseTypeDimMap: Map<string, CaseTypeDim>; refDimMap: Map<string, RefDim>; refColOptions: OptionBase<string>[]; refColMap: Map<string, RefCol>; colsValidationRules: RefColValidationRulesResponseBody['valid_col_types_by_dim_type'] }): OptionBase<string>[] {
    const caseTypeDim = kwArgs.caseTypeDimMap.get(kwArgs.caseTypeDimId);
    if (!caseTypeDim) {
      return [];
    }
    const refDim = kwArgs.refDimMap.get(caseTypeDim.ref_dim_id);
    return kwArgs.refColOptions.filter((option) => {
      const refCol = kwArgs.refColMap.get(option.value);
      if (refCol.ref_dim_id !== caseTypeDim.ref_dim_id) {
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
    return `${caseSet.name} (${format(caseSet.created_at, DATE_FORMAT.DATE)})`;
  }


}
