import isNumber from 'lodash/isNumber';

import { StringUtil } from '../StringUtil';
import type {
  CaseType,
  CompleteCaseType,
  Dim,
  Col,
  CaseTypeCol,
  CaseTypeDim,
} from '../../api';
import {
  DimType,
  ColType,
} from '../../api';

export const SELECTION_FILTER_GROUP = 'selection';
export const TREE_FILTER_GROUP = 'tree';

export class EpiCaseTypeUtil {
  public static createCaseTypeLink(caseType: CaseType | CompleteCaseType): string {
    return `/cases/${StringUtil.createSlug(caseType.name)}/${caseType.id}`;
  }

  public static getInitialVisibleColumnIds(completeCaseType: CompleteCaseType): string[] {
    const visibleColumnIds: string[] = [];

    completeCaseType.case_type_dims.forEach((caseTypeDimension) => {
      const dimension = completeCaseType.dims[caseTypeDimension.dim_id];
      const caseTypeColumns = caseTypeDimension.case_type_col_order.map(id => completeCaseType.case_type_cols[id]);
      const cols = caseTypeColumns.map(caseTypeColumn => completeCaseType.cols[caseTypeColumn.col_id]);

      if (dimension.dim_type === DimType.GEO) {
        visibleColumnIds.push(EpiCaseTypeUtil.getPreferredGEOColumn(caseTypeColumns).id);
      } else if (dimension.dim_type === DimType.TIME || dimension.dim_type === DimType.NUMBER || EpiCaseTypeUtil.isGeneticDistanceDimension(dimension, cols)) {
        visibleColumnIds.push(EpiCaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType).id);
      } else {
        visibleColumnIds.push(...caseTypeColumns.map(c => c.id));
      }
    });

    return visibleColumnIds;
  }

  public static isGeneticDistanceDimension(dimension: Dim, cols: Col[]): boolean {
    return dimension.dim_type === DimType.OTHER && cols.find(col => col.col_type === ColType.GENETIC_DISTANCE) !== undefined;
  }

  public static getPreferredGEOColumn(caseTypeColumns: CaseTypeCol[]): CaseTypeCol {
    return caseTypeColumns[Math.min(caseTypeColumns.length - 1, Math.floor((caseTypeColumns.length - 1) / 2))];
  }

  public static getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns: CaseTypeCol[], completeCaseType: CompleteCaseType): CaseTypeCol {
    return caseTypeColumns.find(c => completeCaseType.cols[c.col_id].rank_in_dim === 1) ?? caseTypeColumns?.[0];
  }

  public static iterateOrderedDimensions(completeCaseType: CompleteCaseType, cb: (dimension: Dim, dimensionCaseTypeColumns: CaseTypeCol[], dimIndex: number) => void, dimType?: DimType): void {
    let index = 0;
    completeCaseType.case_type_dims.forEach((caseTypeDim) => {
      const dimension = completeCaseType.dims[caseTypeDim.dim_id];
      if (dimType && dimension.dim_type !== dimType) {
        return;
      }
      const dimensionCaseTypeColumns = caseTypeDim.case_type_col_order.map(caseTypeColId => completeCaseType.case_type_cols[caseTypeColId]);
      cb(dimension, dimensionCaseTypeColumns, index);
      index++;
    });
  }

  public static iterateCaseTypeColumns(completeCaseType: CompleteCaseType, caseTypeColumns: CaseTypeCol[], cb: (caseTypeColumn: CaseTypeCol, column: Col, index: number) => void): void {
    caseTypeColumns.forEach((caseTypeColumn, index) => {
      const column = completeCaseType.cols[caseTypeColumn.col_id];
      cb(caseTypeColumn, column, index);
    });
  }

  public static getDimensions(completeCaseType: CompleteCaseType, dimTypes?: DimType[]): Dim[] {
    const dimensions = completeCaseType.case_type_dims.map(caseTypeDimension => {
      return completeCaseType.dims[caseTypeDimension.dim_id];
    });
    if (!dimTypes?.length) {
      return dimensions;
    }
    return dimensions.filter(dimension => dimTypes.includes(dimension.dim_type));
  }

  public static getCaseTypeColumns(completeCaseType: CompleteCaseType, dimId?: string): CaseTypeCol[] {
    let caseTypeDimensions: CaseTypeDim[];
    if (dimId) {
      caseTypeDimensions = completeCaseType.case_type_dims.filter(caseTypeDimension => caseTypeDimension.dim_id === dimId);
    } else {
      caseTypeDimensions = completeCaseType.case_type_dims;
    }
    return caseTypeDimensions.map(caseTypeDimension => caseTypeDimension.case_type_col_order.map(caseTypeId => completeCaseType.case_type_cols[caseTypeId])).flat();
  }

  public static getDimensionLabel(dimension: Dim, occurrence?: number): string {
    const occurrenceLabel = isNumber(occurrence) ? `.x${occurrence}` : '';
    return `${dimension.code}${occurrenceLabel}`;
  }
}
