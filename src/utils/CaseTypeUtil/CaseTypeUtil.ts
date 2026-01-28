import uniq from 'lodash/uniq';

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

export class CaseTypeUtil {
  public static createCaseTypeLink(caseType: CaseType | CompleteCaseType, full?: boolean): string {
    const path = `/cases/${StringUtil.createSlug(caseType.name)}/${caseType.id}`;
    if (full) {
      return `${WindowManager.instance.window.location.origin}${path}`;
    }
    return path;
  }

  public static getInitialVisibleColumnIds(completeCaseType: CompleteCaseType): string[] {
    const visibleColumnIds: string[] = [];

    completeCaseType.ordered_case_type_dim_ids.map(x => completeCaseType.case_type_dims[x]).forEach((caseTypeDimension) => {
      const dim = completeCaseType.dims[caseTypeDimension.dim_id];

      const caseTypeCols = completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimension.id].map(id => completeCaseType.case_type_cols[id]);
      const cols = caseTypeCols.map(caseTypeCol => completeCaseType.cols[caseTypeCol.col_id]);

      if (dim.dim_type === DimType.GEO) {
        visibleColumnIds.push(CaseTypeUtil.getPreferredGEOColumn(caseTypeCols).id);
      } else if (dim.dim_type === DimType.TIME || dim.dim_type === DimType.NUMBER || CaseTypeUtil.isGeneticDistanceDimension(dim, cols)) {
        visibleColumnIds.push(CaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeCols, completeCaseType).id);
      } else {
        visibleColumnIds.push(...caseTypeCols.filter(cc => {
          const col = completeCaseType.cols[cc.col_id];
          const hiddenColTypes: ColType[] = [ColType.GENETIC_READS, ColType.GENETIC_SEQUENCE];
          return !hiddenColTypes.includes(col.col_type);
        }).map(c => c.id));
      }
    });

    return visibleColumnIds;
  }

  public static getDimensionLabel(completeCaseType: CompleteCaseType, caseTypeDimId: string): string {
    const caseTypeDim = completeCaseType.case_type_dims[caseTypeDimId];
    return caseTypeDim.code;
  }

  public static isGeneticDistanceDimension(dim: Dim, cols: Col[]): boolean {
    return dim.dim_type === DimType.OTHER && cols.find(col => col.col_type === ColType.GENETIC_DISTANCE) !== undefined;
  }

  public static getPreferredGEOColumn(caseTypeCols: CaseTypeCol[]): CaseTypeCol {
    return caseTypeCols[Math.min(caseTypeCols.length - 1, Math.floor((caseTypeCols.length - 1) / 2))];
  }

  public static getPreferredColumnInDimensionHavingHighestRank(caseTypeCols: CaseTypeCol[], completeCaseType: CompleteCaseType): CaseTypeCol {
    return caseTypeCols.find(caseTypeCol => completeCaseType.cols[caseTypeCol.col_id].rank === 1) ?? caseTypeCols?.[0];
  }

  public static getCaseTypeDims(completeCaseType: CompleteCaseType, dimTypes?: DimType[]): CaseTypeDim[] {
    const caseTypeDims = Object.values(completeCaseType.ordered_case_type_dim_ids).map(x => completeCaseType.case_type_dims[x]);
    if (!dimTypes?.length) {
      return caseTypeDims;
    }
    return caseTypeDims.filter(caseTypeDim => {
      const dim = completeCaseType.dims[caseTypeDim.dim_id];
      return dimTypes.includes(dim.dim_type);
    });
  }

  public static getCaseTypeCols(completeCaseType: CompleteCaseType, caseTypeDimId?: string): CaseTypeCol[] {
    if (!caseTypeDimId) {
      return Object.values(completeCaseType.case_type_cols);
    }
    return completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimId].map(id => completeCaseType.case_type_cols[id]);
  }


  /**
   * Get case type columns by their column type.
   * @param completeCaseType The complete case type object.
   * @param colType The column type to filter by.
   * @returns An array of case type columns matching the specified column type.
   */
  public static getCaseTypeColsByType(completeCaseType: CompleteCaseType, colType: ColType[]): CaseTypeCol[] {
    return Object.values(completeCaseType.case_type_cols).filter(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      return colType.includes(col?.col_type);
    });
  }


  /**
   * Find a unique case type column by its case type column ID or column ID.
   * @param completeCaseType The complete case type object.
   * @param id The ID of the case type column or column.
   * @returns The unique case type column if found, otherwise null.
   */
  public static findUniqueCaseTypeColByCaseTypeColIdOrColId(completeCaseType: CompleteCaseType, id: string): CaseTypeCol {
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
   * Find paired FWD/REV columns in the same dimension.
   * @param completeCaseType The complete case type object.
   * @returns An array of paired FWD/REV columns.
   */
  public static findPairedReadsCaseTypeCols(completeCaseType: CompleteCaseType): { fwd: CaseTypeCol; rev: CaseTypeCol }[] {
    const pairs: { fwd: CaseTypeCol; rev: CaseTypeCol }[] = [];

    completeCaseType.ordered_case_type_dim_ids.forEach(caseTypeDimId => {
      const caseTypeCols = completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimId].map(x => completeCaseType.case_type_cols[x]);
      if (!caseTypeCols) {
        return;
      }
      const readsColumns = caseTypeCols.filter(caseTypeCol => {
        const col = completeCaseType.cols[caseTypeCol.col_id];
        return col?.col_type === ColType.GENETIC_READS;
      });

      if (readsColumns.length === 2) {
        pairs.push({ fwd: readsColumns[0], rev: readsColumns[1] });
      }

    });

    return pairs;
  }

  public static getWritableCaseTypeColIds(completeCaseType: CompleteCaseType): string[] {
    const writableColIds: string[] = [];
    Object.values(completeCaseType.case_type_access_abacs).forEach((abac) => {
      writableColIds.push(...abac.write_case_type_col_ids);
    });
    return uniq(writableColIds);
  }

  public static getWritableImportExportCaseTypeColIds(completeCaseType: CompleteCaseType): string[] {
    const writableColIds = CaseTypeUtil.getWritableCaseTypeColIds(completeCaseType);
    return Object.keys(completeCaseType.case_type_cols).filter(caseTypeColId => {
      if (!writableColIds.includes(caseTypeColId)) {
        return false;
      }
      const caseTypeCol = completeCaseType.case_type_cols[caseTypeColId];
      const col = completeCaseType.cols[caseTypeCol.col_id];
      if (([ColType.GENETIC_DISTANCE, ColType.GENETIC_PROFILE, ColType.GENETIC_READS, ColType.GENETIC_SEQUENCE] as ColType[]).includes(col.col_type)) {
        return false;
      }
      return true;
    });
  }

}
