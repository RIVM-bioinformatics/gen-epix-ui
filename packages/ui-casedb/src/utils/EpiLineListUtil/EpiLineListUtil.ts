import sumBy from 'lodash/sumBy';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import { ConfigManager } from '@gen-epix/ui';
import { t } from 'i18next';

import { EpiDataManager } from '../../classes/managers/EpiDataManager';
import type { CaseDbConfig } from '../../models/config';
import type {
  CaseTypeRowValue,
  Stratification,
  StratificationLegendaItem,
} from '../../models/epi';
import {
  STRATIFICATION_MODE,
  STRATIFICATION_SELECTED,
} from '../../models/epi';
import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';


export interface StratifiableColumn {
  col: CaseDbCol;
  enabled: boolean;
}


export class EpiLineListUtil {
  public static getCaseCount(cases: CaseDbCase[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  public static getSelectedRows(cases: CaseDbCase[], selectedIds: string[]): CaseDbCase[] {
    return cases.filter(row => selectedIds.includes(row.id));
  }

  public static getStratification(
    kwArgs: {
      col?: CaseDbCol;
      completeCaseType: CaseDbCompleteCaseType;
      mode: STRATIFICATION_MODE;
      selectedIds?: string[];
      sortedData: CaseDbCase[];
    },
  ): Stratification {
    const { col, completeCaseType, mode, selectedIds, sortedData } = kwArgs;
    if (!mode) {
      return null;
    }

    if (mode === STRATIFICATION_MODE.SELECTION && !selectedIds) {
      return null;
    }

    const caseIdColors: { [key: string]: string } = {};
    const legendaItems: StratificationLegendaItem[] = [];
    const legendaItemsByColor: { [key: string]: StratificationLegendaItem } = {};
    const legendaItemsByValue: { [key: string]: StratificationLegendaItem } = {};
    const { STRATIFICATION_COLOR_ITEM_MISSING, STRATIFICATION_COLORS } = ConfigManager.getInstance<CaseDbConfig>().config.epi;

    if (mode === STRATIFICATION_MODE.FIELD) {
      if (!col) {
        return null;
      }

      const column = completeCaseType.ref_cols[col.ref_col_id];
      const conceptSetConceptIds = EpiDataManager.getInstance().data.conceptsIdsBySetId[column.concept_set_id];
      if (conceptSetConceptIds) {
        if (conceptSetConceptIds.length <= STRATIFICATION_COLORS.length) {
          conceptSetConceptIds.map(conceptId => EpiDataManager.getInstance().data.conceptsById[conceptId]).sort((a, b) => {
            if (([
              CaseDbColType.ORDINAL,
              CaseDbColType.INTERVAL,
              CaseDbColType.DECIMAL_0,
              CaseDbColType.DECIMAL_1,
              CaseDbColType.DECIMAL_2,
              CaseDbColType.DECIMAL_3,
              CaseDbColType.DECIMAL_4,
              CaseDbColType.DECIMAL_5,
              CaseDbColType.DECIMAL_6,
            ] as CaseDbColType[]).includes(column.col_type) && a.rank !== b.rank) {
              return a.rank - b.rank;
            }
            return a.code.localeCompare(b.code);
          }).forEach((concept, index) => {
            const color = STRATIFICATION_COLORS[index];
            const legendaItem: StratificationLegendaItem = {
              caseIds: [],
              color,
              columnType: column.col_type,
              rowValue: {
                full: `${concept.code} (${concept.name})`,
                isMissing: false,
                long: concept.name,
                raw: concept.id,
                short: concept.code,
              },
            };
            legendaItemsByColor[color] = legendaItem;
            legendaItemsByValue[concept.id] = legendaItem;
            legendaItems.push(legendaItem);
          });
          const legendaItemMissingData: StratificationLegendaItem = {
            caseIds: [],
            color: STRATIFICATION_COLOR_ITEM_MISSING,
            columnType: column.col_type,
            rowValue: CaseUtil.getMissingRowValue(''),
          };
          legendaItemsByColor[STRATIFICATION_COLOR_ITEM_MISSING] = legendaItemMissingData;
          legendaItemsByValue[''] = legendaItemMissingData;
          legendaItems.push(legendaItemMissingData);

          sortedData.forEach(row => {
            const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
            const legendaItem = rowValue.isMissing ? legendaItemMissingData : legendaItemsByValue[rowValue.raw];
            legendaItem.caseIds.push(row.id);
            caseIdColors[row.id] = legendaItem.color;
          });
          if (legendaItemMissingData.caseIds.length === 0) {
            legendaItems.splice(legendaItems.indexOf(legendaItemMissingData), 1);
            delete legendaItemsByColor[STRATIFICATION_COLOR_ITEM_MISSING];
            delete legendaItemsByValue[''];
          }
        } else {
          const rowValues = sortedData.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType));
          const uniqueRowValues = uniqBy(rowValues, (rowValue => rowValue.raw)).sort((a, b) => {
            return EpiLineListUtil.rowValueComperator(a, b);
          });

          uniqueRowValues.forEach((rowValue, index) => {
            const color = rowValue.isMissing ? STRATIFICATION_COLOR_ITEM_MISSING : STRATIFICATION_COLORS[index];
            const legendaItem: StratificationLegendaItem = {
              caseIds: [],
              color,
              columnType: column.col_type,
              rowValue,
            };

            legendaItemsByColor[color] = legendaItem;
            legendaItemsByValue[rowValue.raw] = legendaItem;
            legendaItems.push(legendaItem);
          });
          sortedData.forEach(row => {
            const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
            const legendaItem = legendaItemsByValue[rowValue.raw];
            legendaItem.caseIds.push(row.id);
            caseIdColors[row.id] = legendaItem.color;
          });
        }
      } else {
        const rawValues = sortedData.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType));
        const uniqueRowValues = uniqBy(rawValues, v => v.raw).sort(EpiLineListUtil.rowValueComperator);

        uniqueRowValues.forEach((rowValue, index) => {
          const color = rowValue.isMissing ? STRATIFICATION_COLOR_ITEM_MISSING : STRATIFICATION_COLORS[index];
          const legendaItem: StratificationLegendaItem = {
            caseIds: [],
            color,
            columnType: column.col_type,
            rowValue,
          };

          legendaItemsByColor[color] = legendaItem;
          legendaItemsByValue[rowValue.raw] = legendaItem;
          legendaItems.push(legendaItem);
        });

        sortedData.forEach(row => {
          const rowValue = CaseUtil.getRowValue(row.content, col, completeCaseType);
          const legendaItem = legendaItemsByValue[rowValue.raw];
          legendaItem.caseIds.push(row.id);
          caseIdColors[row.id] = legendaItem.color;
        });
      }

      return {
        caseIdColors,
        col,
        colorForIsMissing: STRATIFICATION_COLOR_ITEM_MISSING,
        legendaItems,
        legendaItemsByColor,
        legendaItemsByValue,
        mode: STRATIFICATION_MODE.FIELD,
      };
    }

    if (mode === STRATIFICATION_MODE.SELECTION) {
      const rawValues: STRATIFICATION_SELECTED[] = [STRATIFICATION_SELECTED.SELECTED, STRATIFICATION_SELECTED.UNSELECTED];

      rawValues.forEach(rawValue => {
        const color = rawValue === STRATIFICATION_SELECTED.SELECTED ? STRATIFICATION_COLORS[0] : STRATIFICATION_COLORS[1];
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
        colorForIsMissing: STRATIFICATION_COLOR_ITEM_MISSING,
        legendaItems,
        legendaItemsByColor,
        legendaItemsByValue,
        mode: STRATIFICATION_MODE.SELECTION,
      };
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
    const { ALLOWED_COL_TYPES_FOR_STRATIFICATION, STRATIFICATION_COLORS } = ConfigManager.getInstance<CaseDbConfig>().config.epi;

    const filteredCols = CaseTypeUtil.getCols(completeCaseType).filter(col => {
      const column = completeCaseType.ref_cols[col.ref_col_id];
      return ALLOWED_COL_TYPES_FOR_STRATIFICATION.includes(column.col_type);
    });

    return filteredCols.map<StratifiableColumn>(col => {
      const numUniqueValues = uniq(data.map(row => CaseUtil.getRowValue(row.content, col, completeCaseType).raw).filter(x => !!x)).length;
      const enabled = !(numUniqueValues <= 1 || numUniqueValues > STRATIFICATION_COLORS.length);
      return {
        col,
        enabled,
      };
    }).sort((a, b) => a.col.label.localeCompare(b.col.label));
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
