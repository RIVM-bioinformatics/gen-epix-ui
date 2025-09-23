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
import { WindowManager } from '../../classes/managers/WindowManager';

export const SELECTION_FILTER_GROUP = 'selection';
export const TREE_FILTER_GROUP = 'tree';

export class EpiCaseTypeUtil {
  public static createCaseTypeLink(caseType: CaseType | CompleteCaseType, full?: boolean): string {
    const path = `/cases/${StringUtil.createSlug(caseType.name)}/${caseType.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
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

  public static iterateOrderedDimensions(completeCaseType: CompleteCaseType, cb: (dimension: Dim, dimensionCaseTypeColumns?: CaseTypeCol[], dimIndex?: number) => void, dimType?: DimType): void {
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

  /**
   * Get a label for the dimension, including its occurrence if specified.
   * @param dimension The dimension object.
   * @param occurrence The occurrence number (optional).
   * @returns The formatted dimension label.
   */
  public static getDimensionLabel(dimension: Dim, occurrence?: number): string {
    const occurrenceLabel = isNumber(occurrence) ? `.x${occurrence}` : '';
    return `${dimension.code}${occurrenceLabel}`;
  }

  /**
   * Get case type columns by their column type.
   * @param completeCaseType The complete case type object.
   * @param colType The column type to filter by.
   * @returns An array of case type columns matching the specified column type.
   */
  public static getCaseTypeColumnsByType(completeCaseType: CompleteCaseType, colType: ColType): CaseTypeCol[] {
    return Object.values(completeCaseType.case_type_cols).filter(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      return col?.col_type === colType;
    });
  }


  /**
   * Find a unique case type column by its case type column ID or column ID.
   * @param completeCaseType The complete case type object.
   * @param id The ID of the case type column or column.
   * @returns The unique case type column if found, otherwise null.
   */
  public static findUniqueCaseTypeColumnByCaseTypeColIdOrColId(completeCaseType: CompleteCaseType, id: string): CaseTypeCol {
    const caseTypeColId = Object.values(completeCaseType.case_type_cols).find(caseTypeCol => caseTypeCol.col_id === id);
    if (caseTypeColId) {
      return caseTypeColId;
    }
    const colIds = Object.values(completeCaseType.cols).filter(col => col.id === id);
    if (colIds.length !== 1) {
      return null;
    }
    const caseTypeCols = Object.values(completeCaseType.case_type_cols).filter(caseTypeCol => caseTypeCol.col_id === colIds[0].id);
    if (caseTypeCols.length !== 1) {
      return null;
    }
    return caseTypeCols[0];
  }


  /**
   * Find paired GENETIC_READS_FWD/REV columns in the same dimension.
   * @param completeCaseType The complete case type object.
   * @returns An array of paired GENETIC_READS_FWD/REV columns.
   */
  public static findPairedReadsCaseTypeColumns(completeCaseType: CompleteCaseType): { fwd: CaseTypeCol; rev: CaseTypeCol }[] {
    const pairs: { fwd: CaseTypeCol; rev: CaseTypeCol }[] = [];

    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dimension, caseTypeColumns) => {
      if (!caseTypeColumns) {
        return;
      }
      const caseTypeColsInDimension = caseTypeColumns.filter(ctc => {
        const col = completeCaseType.cols[ctc.col_id];
        return col?.col_type === ColType.GENETIC_READS_FWD || col?.col_type === ColType.GENETIC_READS_REV;
      });
      if (caseTypeColsInDimension.length !== 2) {
        return;
      }
      const geneticReadsFwdCaseTypeCol = caseTypeColsInDimension.find(ctc => {
        const col = completeCaseType.cols[ctc.col_id];
        return col?.col_type === ColType.GENETIC_READS_FWD;
      });
      const geneticReadsRevCaseTypeCol = caseTypeColsInDimension.find(ctc => {
        const col = completeCaseType.cols[ctc.col_id];
        return col?.col_type === ColType.GENETIC_READS_REV;
      });

      if (geneticReadsFwdCaseTypeCol && geneticReadsRevCaseTypeCol) {
        pairs.push({ fwd: geneticReadsFwdCaseTypeCol, rev: geneticReadsRevCaseTypeCol });
      }
    });

    return pairs;
  }

}
