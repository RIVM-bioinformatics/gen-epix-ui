import type { EChartsOption } from 'echarts';
import type { CallbackDataParams } from 'echarts/types/dist/shared';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbConcept,
} from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';
import type { Theme } from '@mui/material';
import { ConfigService } from '@gen-epix/ui';

import { DataService } from '../../classes/services/DataService';
import type { CaseDbConfig } from '../../models/config';
import { CaseUtil } from '../CaseUtil';
import { StratificationUtil } from '../StratificationUtil';
import { STRATIFICATION_MODE } from '../../models/stratification';
import { CaseDbDataUtil } from '../CaseDbDataUtil';

export type GetChartOptionsParams = {
  aCol: CaseDbCol;
  bCol: CaseDbCol;
  colors: string[];
  conceptsA: CaseDbConcept[];
  conceptsB: CaseDbConcept[];
  series: SeriesItem[];
  t: (key: string, options?: Record<string, unknown>) => string;
  theme: Theme;
};

export type SeriesItem = {
  data: (number | string)[];
  emphasis: {
    focus: 'self';
  };
  name: string;
  type: 'bar';
  xCaseIds: string[][];
};

// Note the typings are not exposed by echarts, so we need to define our own type here
export type TooltipCallbackDataParams = {
  axisDim?: string;
  axisId?: string;
  axisIndex?: number;
  axisType?: string;
  axisValue?: number | string;
  axisValueLabel?: string;
  marker?: string;
} & CallbackDataParams;

export const HISTOGRAM_ALLOWED_COL_TYPES: CaseDbColType[] = [
  CaseDbColType.INTERVAL,
  CaseDbColType.NOMINAL,
  CaseDbColType.ORDINAL,
];

export class HistogramUtil {
  /**
   * Returns columns of the allowed col types for the histogram,
   * excluding cols whose concept count exceeds MAX_ALLOWED_UNIQUE_VALUES.
   */
  public static getAllowedCols(
    completeCaseType: CaseDbCompleteCaseType,
    allowedColTypes: CaseDbColType[],
  ): CaseDbCol[] {
    if (!completeCaseType) {
      return [];
    }
    const { MAX_ALLOWED_UNIQUE_VALUES } =
      ConfigService.getInstance<CaseDbConfig>().config.epi.STRATIFICATION;
    return completeCaseType.ordered_col_ids.reduce<CaseDbCol[]>((acc, colId) => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (!allowedColTypes.includes(refCol.col_type)) {
        return acc;
      }
      const concepts = HistogramUtil.getConceptsForCol(col, completeCaseType);
      if (concepts.length <= MAX_ALLOWED_UNIQUE_VALUES) {
        acc.push(col);
      }
      return acc;
    }, []);
  }

  /**
   * Returns the total case count represented in the series
   */
  public static getCaseCount(series: SeriesItem[]): number {
    if (!series?.length) {
      return 0;
    }
    return series.reduce((total, item) => {
      return (
        total +
        (item.data as number[]).reduce((subTotal, value) => {
          if (typeof value === 'number') {
            return subTotal + value;
          }
          return subTotal;
        }, 0)
      );
    }, 0);
  }

  /**
   * Builds the ECharts options object for the histogram
   */
  public static getChartOptions({
    aCol,
    bCol,
    colors,
    conceptsA,
    conceptsB,
    series,
    t,
    theme,
  }: GetChartOptionsParams): EChartsOption {
    return {
      color: colors,
      grid: {
        bottom: theme.spacing(8),
        left: theme.spacing(25),
        right: theme.spacing(1),
        top: theme.spacing(6),
      },
      legend: {
        align: 'left',
        data: conceptsA.map(concept => concept.name),
        left: 'left',
        orient: 'vertical',
        pageIconColor: theme.palette.primary.main,
        pageIconInactiveColor: theme.palette.text.disabled,
        selectedMode: false,
        top: theme.spacing(4),
        type: 'scroll',
      },
      series,
      title: {
        left: 'left',
        text: aCol.label,
        textStyle: {
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 'bold',
        },
        top: theme.spacing(1),
      },
      tooltip: {
        formatter: (item) => {
          const castedItem = item as TooltipCallbackDataParams;
          const axisValue = castedItem.name;
          const result = `${axisValue} (${bCol.label})\n${castedItem.seriesName}: ${castedItem.value as number} (${aCol.label})`;
          return result;
        },
        renderMode: 'richText',
        show: true,
        trigger: 'item',
        valueFormatter: (value: unknown) => {
          return t('{{numCases}} case(s)', { numCases: value });
        },
      },
      xAxis: [
        {
          axisLabel: {
            height: 100,
            rotate: 45,
          },
          axisPointer: {
            type: 'shadow',
          },
          axisTick: {
            alignWithLabel: true,
            show: true,
          },
          data: conceptsB.map(concept => concept.name),
          name: bCol?.label,
          nameTextStyle: {
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 'bold',
          },
          type: 'category',
        },
      ],
      yAxis: [
        {
          minInterval: 1,
          type: 'value',
        },
      ],
    } satisfies EChartsOption;
  }

  /**
   * Returns the colors for the series based on stratification
   */
  public static getColors(
    aCol: CaseDbCol | null,
    completeCaseType: CaseDbCompleteCaseType | null,
    sortedData: CaseDbCase[],
  ): string[] {
    const stratification = StratificationUtil.getStratification({
      col: aCol,
      completeCaseType,
      mode: STRATIFICATION_MODE.FIELD,
      sortedData,
    });
    return stratification?.legendaItems.map(l => l.color) ?? [];
  }

  public static getColValuesFromPayload = (payload: unknown, conceptsA: CaseDbConcept[], conceptsB: CaseDbConcept[]): { a: string; b: string } | null => {
    const { name, seriesName } = payload as { name: string; seriesName: string };
    const aConcept = conceptsA.find(concept => concept.name === seriesName);
    const bConcept = conceptsB.find(concept => concept.name === name);
    if (!aConcept || !bConcept) {
      return null;
    }
    return { a: aConcept.id, b: bConcept.id };
  };

  /**
   * Returns the sorted concepts for colA and colB.
   */
  public static getConcepts(
    aCol: CaseDbCol | null,
    bCol: CaseDbCol | null,
    completeCaseType: CaseDbCompleteCaseType | null,
  ): [CaseDbConcept[], CaseDbConcept[]] {
    if (!aCol || !bCol || !completeCaseType) {
      return [[], []];
    }
    return [
      HistogramUtil.getConceptsForCol(aCol, completeCaseType),
      HistogramUtil.getConceptsForCol(bCol, completeCaseType),
    ];
  }

  /**
   * Returns the sorted concepts for a single col.
   */
  public static getConceptsForCol(
    col: CaseDbCol,
    completeCaseType: CaseDbCompleteCaseType,
  ): CaseDbConcept[] {
    const refCol = completeCaseType.ref_cols[col.ref_col_id ?? ''];
    const conceptIds =
      DataService.getInstance().data.conceptsIdsBySetId[refCol.concept_set_id];
    return (
      conceptIds
        ?.map(conceptId => DataService.getInstance().data.conceptsById[conceptId])
        .sort(CaseDbDataUtil.conceptComparator) ?? []
    );
  }

  /**
   * Returns the default aCol and bCol to use when none are selected yet.
   * Picks the first col from the second dimension as aCol, and the last col
   * from the first dimension as bCol. Returns null when there are insufficient
   * dimensions or columns.
   */
  public static getDefaultCols(
    allowedCols: CaseDbCol[],
    completeCaseType: CaseDbCompleteCaseType,
  ): { newColA: CaseDbCol; newColB: CaseDbCol } | null {
    const colsPerDimId = allowedCols.reduce<{ [dimId: string]: CaseDbCol[] }>((acc, col) => {
      if (!acc[col.dim_id]) {
        acc[col.dim_id] = [];
      }
      acc[col.dim_id].push(col);
      return acc;
    }, {});

    const orderedDimIdsWithCols =
      completeCaseType?.ordered_dim_ids.filter(dimId => colsPerDimId[dimId]?.length > 0) ?? [];
    const firstDimensionCols = colsPerDimId[orderedDimIdsWithCols[0]] ?? [];
    const secondDimensionCols = colsPerDimId[orderedDimIdsWithCols[1]] ?? [];

    if (!firstDimensionCols.length || !secondDimensionCols.length) {
      return null;
    }

    const newColA = secondDimensionCols.at(0);
    const newColB = firstDimensionCols.at(-1);

    return { newColA, newColB };
  }

  /**
   * Builds the bar-chart series items from the sorted case data
   */
  public static getSeries(
    aCol: CaseDbCol | null,
    bCol: CaseDbCol | null,
    completeCaseType: CaseDbCompleteCaseType | null,
    sortedData: CaseDbCase[],
    conceptsA: CaseDbConcept[],
    conceptsB: CaseDbConcept[],
  ): SeriesItem[] {
    if (!aCol || !bCol || !completeCaseType) {
      return [];
    }

    const countMap = new Map<string, Map<string, number>>();
    const caseIdsMap = new Map<string, Map<string, string[]>>();

    sortedData.forEach(caseDbCase => {
      const aValue = CaseUtil.getRowValue(caseDbCase.content, aCol, completeCaseType);
      const bValue = CaseUtil.getRowValue(caseDbCase.content, bCol, completeCaseType);

      if (aValue.isMissing || bValue.isMissing) {
        return;
      }

      const aKey = aValue.raw;
      const bKey = bValue.raw;

      if (!countMap.has(aKey)) {
        countMap.set(aKey, new Map<string, number>());
      }
      const aMap = countMap.get(aKey);
      aMap.set(bKey, (aMap.get(bKey) ?? 0) + (caseDbCase.count ?? 1));

      if (!caseIdsMap.has(aKey)) {
        caseIdsMap.set(aKey, new Map<string, string[]>());
      }
      const aCaseIdsMap = caseIdsMap.get(aKey);
      aCaseIdsMap.set(bKey, [...(aCaseIdsMap.get(bKey) ?? []), caseDbCase.id]);
    });

    return conceptsA.map(aConcept => {
      const aCounts = countMap.get(aConcept.id) ?? new Map<string, number>();
      const aCaseIds = caseIdsMap.get(aConcept.id) ?? new Map<string, string[]>();
      return {
        data: conceptsB.map(bConcept => aCounts.get(bConcept.id) ?? 0),
        emphasis: {
          focus: 'self',
        },
        name: aConcept.name,
        type: 'bar',
        xCaseIds: conceptsB.map(bConcept => aCaseIds.get(bConcept.id) ?? []),
      };
    });
  }
}
