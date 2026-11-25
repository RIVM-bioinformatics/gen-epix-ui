import { Box } from '@mui/material';
import type { EChartsType } from 'echarts/core';
import { getInstanceByDom } from 'echarts/core';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  useForm,
  useWatch,
} from 'react-hook-form';

import type {
  FindSimilarCasesChartDataPoint,
  FindSimilarCasesOrganizationFilter,
} from '../../../models/case-db.models';
import { renderComponent } from '../../../test/lib';

import { FindSimilarCasesDialogDateRangeChart } from './FindSimilarCasesDialogDateRangeChart';

const CHART_WRAPPER_TEST_ID = 'DateRangeChart-wrapper';
const RANGE_TEST_ID = 'DateRangeChart-range';
const OWN_CASES_LABEL = 'Own cases';
const OTHER_ORGANIZATION_CASES_LABEL = 'Cases from other organizations';

type RangeFormValues = {
  range: [string, string] | null;
};

// Two data points with a gap day in between, so the chart has three daily intervals.
const CHART_DATA: FindSimilarCasesChartDataPoint[] = [
  { count: 3, date: '2024-01-01', otherOrganizationCaseCount: 1, ownCaseCount: 2 },
  { count: 2, date: '2024-01-03', otherOrganizationCaseCount: 1, ownCaseCount: 1 },
];

type ChartHarnessProps = {
  data: FindSimilarCasesChartDataPoint[];
  onOrganizationFilterChange: (organizationFilter: FindSimilarCasesOrganizationFilter) => void;
  organizationFilter: FindSimilarCasesOrganizationFilter;
};

const ChartHarness = ({ data, onOrganizationFilterChange, organizationFilter }: ChartHarnessProps) => {
  const { control } = useForm<RangeFormValues>({ defaultValues: { range: null } });
  const range = useWatch({ control, name: 'range' });
  return (
    <>
      <Box {...TestIdUtil.createAttributes(CHART_WRAPPER_TEST_ID)}>
        <FindSimilarCasesDialogDateRangeChart
          control={control}
          data={data}
          name={'range'}
          onOrganizationFilterChange={onOrganizationFilterChange}
          organizationFilter={organizationFilter}
        />
      </Box>
      <div {...TestIdUtil.createAttributes(RANGE_TEST_ID)}>
        {range ? JSON.stringify(range) : 'null'}
      </div>
    </>
  );
};

type Screen = Awaited<ReturnType<typeof renderComponent>>;

const renderChart = async ({
  data = CHART_DATA,
  onOrganizationFilterChange = vi.fn(),
  organizationFilter = 'all',
}: Partial<ChartHarnessProps> = {}) => {
  const screen = await renderComponent(
    <ChartHarness
      data={data}
      onOrganizationFilterChange={onOrganizationFilterChange}
      organizationFilter={organizationFilter}
    />,
  );
  return { onOrganizationFilterChange, screen };
};

// Scoped to this render's wrapper so that charts from other tests are never picked up.
const getChartDom = async (screen: Screen): Promise<HTMLElement> => {
  const wrapperElement = screen.getByTestId(CHART_WRAPPER_TEST_ID).element();
  return vi.waitFor(() => {
    const chartDom = wrapperElement.querySelector<HTMLElement>('[_echarts_instance_]');
    if (!chartDom) {
      throw new Error('ECharts instance not initialized');
    }
    return chartDom;
  });
};

// echarts-for-react first creates a temporary instance and swaps in the real one, with the option set and events bound, after its first render.
const getChart = async (screen: Screen): Promise<EChartsType> => {
  const chartDom = await getChartDom(screen);
  return vi.waitFor(() => {
    const chart = getInstanceByDom(chartDom);
    const series = chart?.getOption().series;
    if (!chart || !Array.isArray(series) || series.length === 0) {
      throw new Error('ECharts option not applied yet');
    }
    return chart;
  }, { timeout: 10_000 });
};

describe('FindSimilarCasesDialogDateRangeChart', () => {
  it('passes one category per daily interval and stacks own and other organization counts', async () => {
    const { screen } = await renderChart();
    const chart = await getChart(screen);

    const option = chart.getOption() as {
      series: { data: number[]; name: string }[];
      xAxis: { data: string[] }[];
      yAxis: { max: number }[];
    };
    expect(option.xAxis[0].data).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
    expect(option.series.find(series => series.name === 'dataZoomShadow')?.data).toEqual([3, 0, 2]);
    expect(option.series.find(series => series.name === OWN_CASES_LABEL)?.data).toEqual([2, 0, 1]);
    expect(option.series.find(series => series.name === OTHER_ORGANIZATION_CASES_LABEL)?.data).toEqual([1, 0, 1]);
    expect(option.yAxis[0].max).toBe(3);
  });

  it('uses a y-axis max of 1 when there is no data', async () => {
    const { screen } = await renderChart({ data: [] });
    const chart = await getChart(screen);

    const option = chart.getOption() as { xAxis: { data: string[] }[]; yAxis: { max: number }[] };
    expect(option.xAxis[0].data).toEqual([]);
    expect(option.yAxis[0].max).toBe(1);
  });

  it('emits the date range of the zoomed index interval', async () => {
    const { screen } = await renderChart();
    const chart = await getChart(screen);

    chart.dispatchAction({ endValue: 1, startValue: 0, type: 'dataZoom' });

    await expect.element(screen.getByTestId(RANGE_TEST_ID)).toHaveTextContent('["2024-01-01","2024-01-02"]');
  });

  it('emits the date range of the zoomed percentage interval', async () => {
    const { screen } = await renderChart();
    const chart = await getChart(screen);

    chart.dispatchAction({ end: 100, start: 50, type: 'dataZoom' });

    await expect.element(screen.getByTestId(RANGE_TEST_ID)).toHaveTextContent('["2024-01-02","2024-01-03"]');
  });

  it('emits null when the zoomed interval cannot be resolved to dates', async () => {
    const { screen } = await renderChart({ data: [] });
    const chart = await getChart(screen);
    const zoomSpy = vi.fn();
    chart.on('datazoom', zoomSpy);

    chart.dispatchAction({ end: 90, start: 10, type: 'dataZoom' });

    await vi.waitFor(() => {
      expect(zoomSpy).toHaveBeenCalled();
    });
    await expect.element(screen.getByTestId(RANGE_TEST_ID)).toHaveTextContent('null');
  });

  it('reports the organization filter when the legend selection changes', async () => {
    const { onOrganizationFilterChange, screen } = await renderChart();
    const chart = await getChart(screen);

    const toggleLegend = async (legendName: string, expectedCallCount: number, expectedFilter: FindSimilarCasesOrganizationFilter) => {
      chart.dispatchAction({ name: legendName, type: 'legendToggleSelect' });
      await vi.waitFor(() => {
        expect(onOrganizationFilterChange).toHaveBeenCalledTimes(expectedCallCount);
      });
      expect(onOrganizationFilterChange).toHaveBeenLastCalledWith(expectedFilter);
    };

    // Hiding own cases leaves only other organization cases.
    await toggleLegend(OWN_CASES_LABEL, 1, 'otherOrganization');
    // Hiding both series falls back to 'all'.
    await toggleLegend(OTHER_ORGANIZATION_CASES_LABEL, 2, 'all');
    // Showing own cases again leaves only own cases.
    await toggleLegend(OWN_CASES_LABEL, 3, 'own');
    // Showing both series again falls back to 'all'.
    await toggleLegend(OTHER_ORGANIZATION_CASES_LABEL, 4, 'all');
  });
});
