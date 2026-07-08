import type { Theme } from '@mui/material';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { ConfigService } from '@gen-epix/ui';
import { t } from 'i18next';
import type { Range } from 'colorjs.io';

import { DataService } from '../../classes/services/DataService';
import type { CaseDbConfig } from '../../models/config';
import type {
  CaseTypeRowValue,
  ConceptBoundaryProps,
} from '../../models/caseDb';
import type {
  StratifiableColumn,
  Stratification,
  StratificationLegendaItem,
} from '../../models/stratification';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../models/stratification';
import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';

export class StratificationUtil {
  public static getEchartsColors(stratification: Stratification, theme: Theme): string[] {
    if (!stratification) {
      return [theme.palette.primary.main];
    }
    return stratification.legendaItems?.map(item => item.color) ?? [];
  }


  public static getStratification(
    kwArgs: {
      col?: CaseDbCol;
      completeCaseType: CaseDbCompleteCaseType;
      mode: STRATIFICATION_MODE;
      selectedIds?: string[];
      sortedData: CaseDbCase[];
      useExtraGradients?: boolean;
    },
  ): Stratification {
    const { col, completeCaseType, mode, selectedIds, sortedData } = kwArgs;
    if (!mode) {
      return null;
    }

    if (mode === STRATIFICATION_MODE.SELECTION && !selectedIds) {
      return null;
    }

    if (mode === STRATIFICATION_MODE.FIELD) {
      return StratificationUtil.getFieldStratification({ col, completeCaseType, sortedData, useExtraGradients: kwArgs.useExtraGradients });
    }

    if (mode === STRATIFICATION_MODE.SELECTION) {
      return StratificationUtil.getSelectionStratification({ col, selectedIds, sortedData });
    }

    return null;
  }

  public static getStratifyableColumns(
    kwArgs: {
      completeCaseType: CaseDbCompleteCaseType;
      data: CaseDbCase[];
    },
  ): StratifiableColumn[] {
    const { completeCaseType, data } = kwArgs;
    const { STRATIFICATION } = ConfigService.getInstance<CaseDbConfig>().config.epi;

    const filteredCols = CaseTypeUtil.getCols(completeCaseType).filter(col => {
      const column = completeCaseType.ref_cols[col.ref_col_id];
      return STRATIFICATION.ALLOWED_COL_TYPES.includes(column.col_type);
    });

    return filteredCols.map<StratifiableColumn>(col => {
      const numUniqueValues = uniq(data.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType).raw).filter(x => !!x)).length;
      const enabled = numUniqueValues > 1 && numUniqueValues <= STRATIFICATION.MAX_ALLOWED_UNIQUE_VALUES;
      return {
        col,
        enabled,
      };
    }).sort((a, b) => completeCaseType.ordered_col_ids.indexOf(a.col.id) - completeCaseType.ordered_col_ids.indexOf(b.col.id));
  }

  private static getFieldStratification(
    kwArgs: {
      col?: CaseDbCol;
      completeCaseType: CaseDbCompleteCaseType;
      sortedData: CaseDbCase[];
      useExtraGradients?: boolean;
    },
  ): Stratification {
    const { STRATIFICATION } = ConfigService.getInstance<CaseDbConfig>().config.epi;
    const { col, completeCaseType, sortedData, useExtraGradients } = kwArgs;
    if (!col) {
      return null;
    }

    const caseIdColors: { [key: string]: string } = {};
    const legendaItems: StratificationLegendaItem[] = [];
    const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
    const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};

    const refCol = completeCaseType.ref_cols[col.ref_col_id];

    const uniqueRowValues = StratificationUtil.getUniqueRowValues({ col, completeCaseType, sortedData });
    const legendaItemMissingData: StratificationLegendaItem = {
      caseIds: [],
      color: STRATIFICATION.ITEM_MISSING_COLOR,
      columnType: refCol.col_type,
      rowValue: CaseUtil.getMissingRowValue(''),
    };
    const colors: string[] = [];

    if (STRATIFICATION.GRADIENT_COL_TYPES.includes(refCol.col_type) || uniqueRowValues.length > STRATIFICATION.BASE_COLORS.length) {
      let gradient: Range;
      if (STRATIFICATION.GRADIENT_COL_TYPES.includes(refCol.col_type)) {
        gradient = STRATIFICATION.BASE_ORDERED_GRADIENT;
      } else {
        if (useExtraGradients) {
          const numExtraGradients = STRATIFICATION.EXTRA_GRADIENTS.length;
          const dim = completeCaseType.dims[col.dim_id];
          const dims = Object.values(completeCaseType.dims).map(d => d.id);
          const colIndexInCompleteCaseType = dims.indexOf(dim.id);
          gradient = STRATIFICATION.EXTRA_GRADIENTS[colIndexInCompleteCaseType % numExtraGradients];
        } else {
          gradient = STRATIFICATION.BASE_UNORDERED_GRADIENT;
        }
      }
      const conceptSetConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refCol.concept_set_id];
      if (conceptSetConceptIds?.length) {
        const concepts = conceptSetConceptIds.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => a.rank - b.rank);
        if (concepts.every(concept => StratificationUtil.isEpiConceptBoundaryProps(concept.props))) {
          const boundaryProps = concepts.map(concept => concept.props as ConceptBoundaryProps);
          const finiteLbs = boundaryProps.map(bp => bp.lb).filter(v => isFinite(v));
          const finiteUbs = boundaryProps.map(bp => bp.ub).filter(v => isFinite(v));
          const globalMin = Math.min(...finiteLbs, ...finiteUbs);
          const globalMax = Math.max(...finiteLbs, ...finiteUbs);
          if (isFinite(globalMin) && isFinite(globalMax) && globalMax > globalMin) {
            boundaryProps.forEach((bp) => {
              const lb = isFinite(bp.lb) ? bp.lb : globalMin;
              const ub = isFinite(bp.ub) ? bp.ub : globalMax;
              const midpoint = (lb + ub) / 2;
              const gradientPosition = Math.max(0, Math.min(1, (midpoint - globalMin) / (globalMax - globalMin)));
              colors.push(gradient(gradientPosition).toString({ format: 'hex' }));
            });
          }
        }
      }

      if (colors.length === 0) {
        uniqueRowValues.forEach((_, index) => {
          colors.push(gradient(index / uniqueRowValues.length).toString({ format: 'hex' }));
        });
      }
    } else {
      colors.push(...STRATIFICATION.BASE_COLORS);
    }

    uniqueRowValues.forEach((rowValue, index) => {
      const color = colors[index];
      const legendaItem: StratificationLegendaItem = {
        caseIds: [],
        color,
        columnType: refCol.col_type,
        rowValue,
      };
      legendaItemsByColor[color] = legendaItem;
      legendaItemsByValue[rowValue.raw] = legendaItem;
      legendaItems.push(legendaItem);
    });

    sortedData.forEach(row => {
      const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
      if (rowValue.isMissing) {
        legendaItemMissingData.caseIds.push(row.id);
        caseIdColors[row.id] = legendaItemMissingData.color;
        return;
      }
      const legendaItem = legendaItemsByValue[rowValue.raw];
      legendaItem.caseIds.push(row.id);
      caseIdColors[row.id] = legendaItem.color;
    });

    if (legendaItemMissingData.caseIds.length > 0) {
      legendaItemsByColor[STRATIFICATION.ITEM_MISSING_COLOR] = legendaItemMissingData;
      legendaItemsByValue[''] = legendaItemMissingData;
      legendaItems.push(legendaItemMissingData);
    }

    return {
      caseIdColors,
      col,
      colorForIsMissing: STRATIFICATION.ITEM_MISSING_COLOR,
      legendaItems,
      legendaItemsByColor,
      legendaItemsByValue,
      mode: STRATIFICATION_MODE.FIELD,
    };
  }

  private static getSelectionStratification(
    kwArgs: {
      col?: CaseDbCol;
      selectedIds: string[];
      sortedData: CaseDbCase[];
    },
  ): Stratification {
    const { STRATIFICATION } = ConfigService.getInstance<CaseDbConfig>().config.epi;
    const { col, selectedIds, sortedData } = kwArgs;
    const caseIdColors: { [key: string]: string } = {};
    const legendaItems: StratificationLegendaItem[] = [];
    const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
    const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};

    const rawValues: STRATIFICATION_SELECTED[] = [STRATIFICATION_SELECTED.SELECTED, STRATIFICATION_SELECTED.UNSELECTED];

    rawValues.forEach(rawValue => {
      const color = rawValue === STRATIFICATION_SELECTED.SELECTED ? STRATIFICATION.BASE_COLORS[0] : STRATIFICATION.BASE_COLORS[1];
      const presentationValue = rawValue === STRATIFICATION_SELECTED.SELECTED ? t`Selected` : t`Unselected`;
      const legendaItem: StratificationLegendaItem = {
        caseIds: [],
        color,
        rowValue: {
          full: presentationValue,
          isMissing: false,
          long: presentationValue,
          raw: rawValue,
          short: presentationValue,
        },
      };
      legendaItemsByColor[color] = legendaItem;
      legendaItemsByValue[rawValue] = legendaItem;
      legendaItems.push(legendaItem);
    });

    sortedData.forEach(row => {
      const legendaItem = selectedIds.includes(row.id) ? legendaItemsByValue[STRATIFICATION_SELECTED.SELECTED] : legendaItemsByValue[STRATIFICATION_SELECTED.UNSELECTED];
      legendaItem.caseIds.push(row.id);
      caseIdColors[row.id] = legendaItem.color;
    });

    return {
      caseIdColors,
      col,
      colorForIsMissing: STRATIFICATION.ITEM_MISSING_COLOR,
      legendaItems,
      legendaItemsByColor,
      legendaItemsByValue,
      mode: STRATIFICATION_MODE.SELECTION,
    };
  }

  private static getUniqueRowValues(
    kwArgs: {
      col?: CaseDbCol;
      completeCaseType: CaseDbCompleteCaseType;
      sortedData: CaseDbCase[];
    },
  ): CaseTypeRowValue[] {
    const { STRATIFICATION } = ConfigService.getInstance<CaseDbConfig>().config.epi;
    const { col, completeCaseType, sortedData } = kwArgs;
    const refCol = completeCaseType.ref_cols[col.ref_col_id];
    const conceptSetConceptIds = DataService.getInstance().data.conceptsIdsBySetId[refCol.concept_set_id];

    if (conceptSetConceptIds) {
      const uniqueRowValues: CaseTypeRowValue[] = [];
      conceptSetConceptIds.map(conceptId => DataService.getInstance().data.conceptsById[conceptId]).sort((a, b) => {
        if (STRATIFICATION.GRADIENT_COL_TYPES.includes(refCol.col_type) && a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        return a.code.localeCompare(b.code);
      }).forEach((concept) => {
        uniqueRowValues.push({
          full: `${concept.code} (${concept.name})`,
          isMissing: false,
          long: concept.name,
          raw: concept.id,
          short: concept.code,
        });
      });
      return uniqueRowValues;
    }
    const rowValues = sortedData.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType)).filter(x => !x.isMissing);
    const uniqueRowValues = uniqBy(rowValues, (rowValue => rowValue.raw)).sort((a, b) => {
      return StratificationUtil.rowValueComperator(a, b);
    });
    return uniqueRowValues;
  }

  private static isEpiConceptBoundaryProps(prop: unknown): prop is ConceptBoundaryProps {
    if (typeof prop !== 'object' || prop === null) {
      return false;
    }
    const propAsEpiConceptBoundaryProps = prop as ConceptBoundaryProps;
    return ['lb', 'lb_in', 'ub', 'ub_in', 'unit'].every(key => key in propAsEpiConceptBoundaryProps);
  }

  private static rowValueComperator(a: CaseTypeRowValue, b: CaseTypeRowValue): number {
    if (a.raw === b.raw) {
      return 0;
    }
    if (a.isMissing) {
      return 1;
    }
    if (b.isMissing) {
      return -1;
    }
    return a.short.localeCompare(b.short);
  }
}
