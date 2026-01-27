import type { TFunction } from 'i18next';

import type {
  CaseTypeCol,
  CaseTypeDim,
  Col,
  ColValidationRulesResponseBody,
  Dim,
  User,
} from '../../api';
import { ColType } from '../../api';
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


}
