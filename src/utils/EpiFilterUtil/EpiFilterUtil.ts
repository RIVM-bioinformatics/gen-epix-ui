import {
  subYears,
  parseISO,
  parse,
} from 'date-fns';
import { t } from 'i18next';

import {
  CaseTypeUtil,
  SELECTION_FILTER_GROUP,
  TREE_FILTER_GROUP,
} from '../CaseTypeUtil';
import type {
  CompleteCaseType,
  CaseTypeCol,
  RefCol,
} from '../../api';
import {
  DimType,
  ColType,
} from '../../api';
import {
  FILTER_MODE,
  DEFAULT_FILTER_GROUP,
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
  private static readonly colTypeBlackList = new Set<ColType>([ColType.GENETIC_DISTANCE, ColType.GENETIC_SEQUENCE, ColType.GENETIC_READS]);

  public static createFilterDimensions(completeCaseType: CompleteCaseType): FilterDimension[] {
    const filterDimensions: FilterDimension[] = [];

    completeCaseType.ordered_case_type_dim_ids.forEach(caseTypeDimId => {
      const caseTypeDim = completeCaseType.case_type_dims[caseTypeDimId];
      const refDim = completeCaseType.ref_dims[caseTypeDim.ref_dim_id];
      const caseTypeColIds = completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimId];
      const refCols = caseTypeColIds.map(id => completeCaseType.ref_cols[completeCaseType.case_type_cols[id].ref_col_id]);

      if (CaseTypeUtil.isGeneticDistanceDimension(refDim, refCols)) {
        return;
      }
      if (refCols.every(refCol => EpiFilterUtil.colTypeBlackList.has(refCol.col_type))) {
        return;
      }

      const filterDimension: Omit<FilterDimension, 'preferredFilterId' | 'allowMultipleVisibleFilters' | 'allowOnlyPreferredFilter'> = {
        id: caseTypeDimId,
        label: caseTypeDim.label,
        filterIds: caseTypeColIds,
        description: completeCaseType.ref_dims[caseTypeDim.ref_dim_id].description,
      };
      const caseTypeColumns = caseTypeColIds.map(id => completeCaseType.case_type_cols[id]);
      if (!caseTypeColumns.length) {
        return null;
      }

      let preferredFilterId: string;
      let allowMultipleVisibleFilters = false;
      let allowOnlyPreferredFilter = false;

      if (refDim.dim_type === DimType.TIME) {
        const preferredCaseTypeColumn = CaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType);
        preferredFilterId = preferredCaseTypeColumn.id;
        allowOnlyPreferredFilter = true;
      } else if (refDim.dim_type === DimType.GEO) {
        const preferredCaseTypeColumn = CaseTypeUtil.getPreferredGEOColumn(caseTypeColumns);
        preferredFilterId = preferredCaseTypeColumn.id;
      } else {
        const preferredCaseTypeColumn = CaseTypeUtil.getPreferredColumnInDimensionHavingHighestRank(caseTypeColumns, completeCaseType);
        preferredFilterId = preferredCaseTypeColumn.id;
        allowMultipleVisibleFilters = refDim.dim_type !== DimType.NUMBER;
      }

      filterDimensions.push({
        ...filterDimension,
        preferredFilterId,
        allowMultipleVisibleFilters,
        allowOnlyPreferredFilter,
      });
    });
    return filterDimensions;
  }

  public static createFilters(completeCaseType: CompleteCaseType): Filters {
    const filters: Filters = [];
    filters.push(new SelectionFilter({
      id: 'selected',
      label: t`Selected rows`,
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: SELECTION_FILTER_GROUP,
    }));
    filters.push(new TreeFilter({
      id: 'sequence_id',
      label: t`Tree`,
      filterMode: FILTER_MODE.FRONTEND,
      filterPriority: TREE_FILTER_GROUP,
    }));

    completeCaseType.ordered_case_type_dim_ids.forEach((caseTypeDimId) => {
      const caseTypeDim = completeCaseType.case_type_dims[caseTypeDimId];
      const refDim = completeCaseType.ref_dims[caseTypeDim.ref_dim_id];
      const caseTypeCols = completeCaseType.ordered_case_type_col_ids_by_dim[caseTypeDimId].map(id => completeCaseType.case_type_cols[id]);
      caseTypeCols.forEach(caseTypeCol => {
        const refCol = completeCaseType.ref_cols[caseTypeCol.ref_col_id];
        if (EpiFilterUtil.colTypeBlackList.has(refCol.col_type)) {
          return;
        }

        if (refDim.dim_type === DimType.TIME) {
          const today = new Date();
          const todayMinus20Years = subYears(today, 20);
          filters.push(
            new DateFilter({
              id: caseTypeCol.id,
              label: caseTypeCol.label,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              filterDimensionId: caseTypeDimId,
              dateParser: EpiFilterUtil.getDateParser(refCol),
              minDate: todayMinus20Years,
              maxDate: new Date(),
              backendFilterType: refCol.col_type === ColType.TIME_DAY ? 'DATE_RANGE' : 'PARTIAL_DATE_RANGE',
            }),
          );
        } else if (refDim.dim_type === DimType.GEO) {
          const regionSet = EpiDataManager.instance.data.regionSets[refCol.region_set_id];
          const options = (EpiDataManager.instance.data.regionsByRegionSetId[refCol.region_set_id]?.map<AutoCompleteOption>(region => {
            return {
              value: region.id,
              label: regionSet.region_code_as_label ? region.code : region.name,
            };
          }) ?? []).sort((a, b) => a.label.localeCompare(b.label));
          filters.push(new GeoFilter({
            id: caseTypeCol.id,
            label: caseTypeCol.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimId,
            options,
          }));
        } else if (refDim.dim_type === DimType.TEXT) {
          filters.push(EpiFilterUtil.createCategoricalFilter(caseTypeCol, caseTypeDimId, completeCaseType));
        } else if (refDim.dim_type === DimType.NUMBER) {
          if (([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(refCol.col_type)) {
            filters.push(new NumberRangeFilter({
              id: caseTypeCol.id,
              label: caseTypeCol.label,
              filterMode: FILTER_MODE.BACKEND,
              filterPriority: DEFAULT_FILTER_GROUP,
              filterDimensionId: caseTypeDimId,
              min: caseTypeCol.min_value ?? -Infinity,
              max: caseTypeCol.max_value ?? Infinity,
            }));
          } else {
            filters.push(EpiFilterUtil.createCategoricalFilter(caseTypeCol, caseTypeDimId, completeCaseType));
          }
        } else if (refDim.dim_type === DimType.ORGANIZATION) {
          // organizations are already sorted
          const options = EpiDataManager.instance.data.organizations.map<AutoCompleteOption>(organization => {
            return {
              value: organization.id,
              label: organization.name,
            };
          });
          filters.push(new MultiSelectFilter({
            id: caseTypeCol.id,
            label: caseTypeCol.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimId,
            options,
          }));
        } else {
          filters.push(new TextFilter({
            id: caseTypeCol.id,
            label: caseTypeCol.label,
            filterMode: FILTER_MODE.BACKEND,
            filterPriority: DEFAULT_FILTER_GROUP,
            filterDimensionId: caseTypeDimId,
          }));
        }
      });
    });
    return filters;
  }

  public static createCategoricalFilter(caseTypeCol: CaseTypeCol, caseTypeDimId: string, completeCaseType: CompleteCaseType): MultiSelectFilter | TextFilter {
    const refCol = completeCaseType.ref_cols[caseTypeCol.ref_col_id];
    if ((refCol.col_type === ColType.NOMINAL || refCol.col_type === ColType.ORDINAL || refCol.col_type === ColType.INTERVAL) && EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id]) {
      const options = EpiDataManager.instance.data.conceptsBySetId[refCol.concept_set_id].map<AutoCompleteOption>(concept => ({
        value: concept.id,
        label: `${concept.code} (${concept.name})`,
      }));
      return new MultiSelectFilter({
        id: caseTypeCol.id,
        label: caseTypeCol.label,
        filterMode: FILTER_MODE.BACKEND,
        filterPriority: DEFAULT_FILTER_GROUP,
        filterDimensionId: caseTypeDimId,
        options,
      });
    }
    return new TextFilter({
      id: caseTypeCol.id,
      label: caseTypeCol.label,
      filterMode: FILTER_MODE.BACKEND,
      filterPriority: DEFAULT_FILTER_GROUP,
      filterDimensionId: caseTypeDimId,
    });
  }

  public static getDateParser(refCol: RefCol): (date: string) => Date {
    if (refCol.col_type === ColType.TIME_QUARTER) {
      return (date: string) => parse(date, DATE_FORMAT.YEAR_QUARTER, new Date());
    }
    return (date: string) => parseISO(date);
  }
}
