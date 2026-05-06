import {
  parse,
  parseISO,
  subYears,
} from 'date-fns';
import { t } from 'i18next';
import type {
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbRefCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbDimType,
} from '@gen-epix/api-casedb';
import type {
  AutoCompleteOption,
  FilterDimension,
  Filters,
} from '@gen-epix/ui';
import {
  DATE_FORMAT,
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '@gen-epix/ui';

import {
  CaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../CaseTypeUtil';
import { DateFilter } from '../../../../ui/src/classes/filters/DateFilter';
import { GeoFilter } from '../../../../ui/src/classes/filters/GeoFilter';
import { MultiSelectFilter } from '../../../../ui/src/classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../../../ui/src/classes/filters/NumberRangeFilter';
import { SelectionFilter } from '../../../../ui/src/classes/filters/SelectionFilter';
import { TextFilter } from '../../../../ui/src/classes/filters/TextFilter';
import { TreeFilter } from '../../../../ui/src/classes/filters/TreeFilter';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

export class EpiFilterUtil {
  private static readonly colTypeBlackList = new Set<CaseDbColType>([CaseDbColType.GENETIC_DISTANCE, CaseDbColType.GENETIC_READS, CaseDbColType.GENETIC_SEQUENCE]);

  public static createCategoricalFilter(col: CaseDbCol, dimId: string, completeCaseType: CaseDbCompleteCaseType): MultiSelectFilter | TextFilter {
    const refCol = completeCaseType.ref_cols[col.ref_col_id];
    if ((refCol.col_type === CaseDbColType.NOMINAL || refCol.col_type === CaseDbColType.ORDINAL || refCol.col_type === CaseDbColType.INTERVAL) && EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id]) {
      const options = EpiDataManager.getInstance().data.conceptsBySetId[refCol.concept_set_id].map<AutoCompleteOption>(concept => ({
        label: `${concept.code} (${concept.name})`,
        value: concept.id,
      }));
      return new MultiSelectFilter({
        filterDimensionId: dimId,
        filterMode: FILTER_MODE.BACKEND,
        filterPriority: DEFAULT_FILTER_GROUP,
        id: col.id,
        label: col.label,
        options,
      });
    }
    return new TextFilter({
      filterDimensionId: dimId,
      filterMode: FILTER_MODE.BACKEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      id: col.id,
      label: col.label,
    });
  }

  public static createFilterDimensions(completeCaseType: CaseDbCompleteCaseType): FilterDimension[] {
    const filterDimensions: FilterDimension[] = [];

    completeCaseType.ordered_dim_ids.forEach(dimId => {
      const dim = completeCaseType.dims[dimId];
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      const colIds = completeCaseType.ordered_col_ids_by_dim[dimId];
      const refCols = colIds.map(id => completeCaseType.ref_cols[completeCaseType.cols[id].ref_col_id]);

      if (CaseTypeUtil.isGeneticDistanceDim(refDim, refCols)) {
        return;
      }
      if (refCols.every(refCol => EpiFilterUtil.colTypeBlackList.has(refCol.col_type))) {
        return;
      }

      const filterDimension: Omit<FilterDimension, 'allowMultipleVisibleFilters' | 'allowOnlyPreferredFilter' | 'preferredFilterId'> = {
        description: completeCaseType.ref_dims[dim.ref_dim_id].description,
        filterIds: colIds,
        id: dimId,
        label: dim.label,
      };
      const cols = colIds.map(id => completeCaseType.cols[id]);
      if (!cols.length) {
        return null;
      }

      let preferredFilterId: string;
      let allowMultipleVisibleFilters = false;
      let allowOnlyPreferredFilter = false;

      if (refDim.dim_type === CaseDbDimType.TIME) {
        const preferredCol = CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
        preferredFilterId = preferredCol.id;
        allowOnlyPreferredFilter = true;
      } else if (refDim.dim_type === CaseDbDimType.GEO) {
        const preferredCol = CaseTypeUtil.getPreferredGEOCol(cols);
        preferredFilterId = preferredCol.id;
      } else {
        const preferredCol = CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
        preferredFilterId = preferredCol.id;
        allowMultipleVisibleFilters = refDim.dim_type !== CaseDbDimType.NUMBER;
      }

      filterDimensions.push({
        ...filterDimension,
        allowMultipleVisibleFilters,
        allowOnlyPreferredFilter,
        preferredFilterId,
      });
    });
    return filterDimensions;
  }

  public static createFilters(completeCaseType: CaseDbCompleteCaseType): Filters {
    const filters: Filters = [];
    filters.push(new SelectionFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: SELECTION_FILTER_GROUP,
      id: 'selected',
      label: t`Selected rows`,
    }));
    filters.push(new TreeFilter({
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: TREE_FILTER_GROUP,
      id: 'sequence_id',
      label: t`Tree`,
    }));

    completeCaseType.ordered_dim_ids.forEach((dimId) => {
      const dim = completeCaseType.dims[dimId];
      const refDim = completeCaseType.ref_dims[dim.ref_dim_id];
      const cols = completeCaseType.ordered_col_ids_by_dim[dimId].map(id => completeCaseType.cols[id]);
      cols.forEach(col => {
        const refCol = completeCaseType.ref_cols[col.ref_col_id];
        if (EpiFilterUtil.colTypeBlackList.has(refCol.col_type)) {
          return;
        }

        if (refDim.dim_type === CaseDbDimType.TIME) {
          const today = new Date();
          const todayMinus20Years = subYears(today, 20);
          filters.push(
            new DateFilter({
              backendFilterType: refCol.col_type === CaseDbColType.TIME_DAY ? 'DATE_RANGE' : 'PARTIAL_DATE_RANGE',
              dateParser: EpiFilterUtil.getDateParser(refCol),
              filterDimensionId: dimId,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              id: col.id,
              label: col.label,
              maxDate: new Date(),
              minDate: todayMinus20Years,
            }),
          );
        } else if (refDim.dim_type === CaseDbDimType.GEO) {
          const regionSet = EpiDataManager.getInstance().data.regionSets[refCol.region_set_id];
          const options = (EpiDataManager.getInstance().data.regionsByRegionSetId[refCol.region_set_id]?.map<AutoCompleteOption>(region => {
            return {
              label: regionSet.region_code_as_label ? region.code : region.name,
              value: region.id,
            };
          }) ?? []).sort((a, b) => a.label.localeCompare(b.label));
          filters.push(new GeoFilter({
            filterDimensionId: dimId,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            id: col.id,
            label: col.label,
            options,
          }));
        } else if (refDim.dim_type === CaseDbDimType.TEXT) {
          filters.push(EpiFilterUtil.createCategoricalFilter(col, dimId, completeCaseType));
        } else if (refDim.dim_type === CaseDbDimType.NUMBER) {
          if (([CaseDbColType.DECIMAL_0, CaseDbColType.DECIMAL_1, CaseDbColType.DECIMAL_2, CaseDbColType.DECIMAL_3, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_5, CaseDbColType.DECIMAL_6] as CaseDbColType[]).includes(refCol.col_type)) {
            filters.push(new NumberRangeFilter({
              filterDimensionId: dimId,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              id: col.id,
              label: col.label,
              max: col.max_value ?? Infinity,
              min: col.min_value ?? -Infinity,
            }));
          } else {
            filters.push(EpiFilterUtil.createCategoricalFilter(col, dimId, completeCaseType));
          }
        } else if (refDim.dim_type === CaseDbDimType.ORGANIZATION) {
          // organizations are already sorted
          const options = EpiDataManager.getInstance().data.organizations.map<AutoCompleteOption>(organization => {
            return {
              label: organization.name,
              value: organization.id,
            };
          });
          filters.push(new MultiSelectFilter({
            filterDimensionId: dimId,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            id: col.id,
            label: col.label,
            options,
          }));
        } else {
          filters.push(new TextFilter({
            filterDimensionId: dimId,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            id: col.id,
            label: col.label,
          }));
        }
      });
    });
    return filters;
  }

  public static getDateParser(refCol: CaseDbRefCol): (date: string) => Date {
    if (refCol.col_type === CaseDbColType.TIME_QUARTER) {
      return (date: string) => parse(date, DATE_FORMAT.YEAR_QUARTER, new Date());
    }
    return (date: string) => parseISO(date);
  }
}
