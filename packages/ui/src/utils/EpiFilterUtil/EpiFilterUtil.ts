import {
  parse,
  parseISO,
  subYears,
} from 'date-fns';
import { t } from 'i18next';
import type {
  Col,
  CompleteCaseType,
  RefCol,
} from '@gen-epix/api-casedb';
import {
  ColType,
  DimType,
} from '@gen-epix/api-casedb';

import {
  CaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../CaseTypeUtil';
import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../classes/abstracts/FilterAbstract';
import { DateFilter } from '../../classes/filters/DateFilter';
import { GeoFilter } from '../../classes/filters/GeoFilter';
import { MultiSelectFilter } from '../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../classes/filters/NumberRangeFilter';
import { SelectionFilter } from '../../classes/filters/SelectionFilter';
import { TextFilter } from '../../classes/filters/TextFilter';
import { TreeFilter } from '../../classes/filters/TreeFilter';
import type {
  FilterDimension,
  Filters,
} from '../../models/filter';
import type { AutoCompleteOption } from '../../models/form';
import { DATE_FORMAT } from '../../data/date';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

export class EpiFilterUtil {
  private static readonly colTypeBlackList = new Set<ColType>([ColType.GENETIC_DISTANCE, ColType.GENETIC_READS, ColType.GENETIC_SEQUENCE]);

  public static createCategoricalFilter(col: Col, dimId: string, completeCaseType: CompleteCaseType): MultiSelectFilter | TextFilter {
    const refCol = completeCaseType.ref_cols[col.ref_col_id];
    if ((refCol.col_type === ColType.NOMINAL || refCol.col_type === ColType.ORDINAL || refCol.col_type === ColType.INTERVAL) && EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id]) {
      const options = EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id].map<AutoCompleteOption>(concept => ({
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

  public static createFilterDimensions(completeCaseType: CompleteCaseType): FilterDimension[] {
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

      if (refDim.dim_type === DimType.TIME) {
        const preferredCol = CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
        preferredFilterId = preferredCol.id;
        allowOnlyPreferredFilter = true;
      } else if (refDim.dim_type === DimType.GEO) {
        const preferredCol = CaseTypeUtil.getPreferredGEOCol(cols);
        preferredFilterId = preferredCol.id;
      } else {
        const preferredCol = CaseTypeUtil.getPreferredColInDimHavingHighestRank(cols, completeCaseType);
        preferredFilterId = preferredCol.id;
        allowMultipleVisibleFilters = refDim.dim_type !== DimType.NUMBER;
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

  public static createFilters(completeCaseType: CompleteCaseType): Filters {
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

        if (refDim.dim_type === DimType.TIME) {
          const today = new Date();
          const todayMinus20Years = subYears(today, 20);
          filters.push(
            new DateFilter({
              backendFilterType: refCol.col_type === ColType.TIME_DAY ? 'DATE_RANGE' : 'PARTIAL_DATE_RANGE',
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
        } else if (refDim.dim_type === DimType.GEO) {
          const regionSet = EpiDataManager.instance.data.regionSets[refCol.region_set_id];
          const options = (EpiDataManager.instance.data.regionsByRegionSetId[refCol.region_set_id]?.map<AutoCompleteOption>(region => {
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
        } else if (refDim.dim_type === DimType.TEXT) {
          filters.push(EpiFilterUtil.createCategoricalFilter(col, dimId, completeCaseType));
        } else if (refDim.dim_type === DimType.NUMBER) {
          if (([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(refCol.col_type)) {
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
        } else if (refDim.dim_type === DimType.ORGANIZATION) {
          // organizations are already sorted
          const options = EpiDataManager.instance.data.organizations.map<AutoCompleteOption>(organization => {
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

  public static getDateParser(refCol: RefCol): (date: string) => Date {
    if (refCol.col_type === ColType.TIME_QUARTER) {
      return (date: string) => parse(date, DATE_FORMAT.YEAR_QUARTER, new Date());
    }
    return (date: string) => parseISO(date);
  }
}
