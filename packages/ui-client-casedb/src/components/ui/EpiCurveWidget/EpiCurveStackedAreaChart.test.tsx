import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import {
  dispose,
  getInstanceByDom,
  init,
  use as registerECharts,
} from 'echarts/core';
import type { EChartsType } from 'echarts';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { format } from 'date-fns';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { Subject } from '@gen-epix/ui-core/classes/Subject';

import type { Highlighting } from '../../../models/case-db.models';
import { STRATIFICATION_MODE } from '../../../models/stratification.models';
import type { Stratification } from '../../../models/stratification.models';
import type { EpiCurveChartItem } from '../../../utils/EpiCurveUtil';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import type { DashboardContextValue } from '../Dashboard/context/DashboardContext';
import { createDashboardCase } from '../../../test/fixtures/dashboard';
import { renderComponent } from '../../../test/lib';

import { EpiCurveStackedAreaChart } from './EpiCurveStackedAreaChart';

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

registerECharts([TooltipComponent, GridComponent, LineChart, CanvasRenderer]);

type PointMouseUpPayload = { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent };
type TooltipFormatter = (params: unknown) => string;

const CHART_CONTAINER_ID = 'epi-curve-stacked-area-chart-container';
const OUTSIDE_CHART_ID = 'epi-curve-stacked-area-chart-outside';
const BLUE_COLOR = '#0000ff';
const RED_COLOR = '#ff0000';
const DAY_1 = new Date(2024, 0, 1);
const DAY_2 = new Date(2024, 0, 2);
const DAY_3 = new Date(2024, 0, 3);
const X_AXIS_INTERVALS = [DAY_1, DAY_2, DAY_3];
const DAY_1_LABEL = '2024-01-01';
const BLUE_SERIES_INDEX = 0;

const getXAxisLabel = (value: Date) => format(value, DATE_FORMAT.DATE);
const noopSetChartRef = (): void => undefined;

// Day 1: case-1 (red) and case-2 (blue). Day 2: case-3 (blue). Day 3: case-4 (red).
const createItems = (): EpiCurveChartItem[] => [
  { date: DAY_1, row: createDashboardCase({ id: 'case-1' }), value: 1 },
  { date: DAY_1, row: createDashboardCase({ id: 'case-2' }), value: 1 },
  { date: DAY_2, row: createDashboardCase({ id: 'case-3' }), value: 1 },
  { date: DAY_3, row: createDashboardCase({ id: 'case-4' }), value: 1 },
];

const createStratification = (legendaItems: Stratification['legendaItems'] = [
  {
    caseIds: ['case-2', 'case-3'],
    color: BLUE_COLOR,
    rowValue: { full: 'Blue', long: 'Blue', raw: 'blue', short: 'Blue' },
  },
  {
    caseIds: ['case-1', 'case-4'],
    color: RED_COLOR,
    rowValue: { full: 'Red', long: 'Red', raw: 'red', short: 'Red' },
  },
]): Stratification => ({
  caseIdColors: {
    'case-1': RED_COLOR,
    'case-2': BLUE_COLOR,
    'case-3': BLUE_COLOR,
    'case-4': RED_COLOR,
  },
  colorForIsMissing: '#cccccc',
  legendaItems,
  mode: STRATIFICATION_MODE.FIELD,
});

const renderAreaChartTree = async ({
  highlightSubject,
  items,
  onCaseIdsChange,
  onChartReady,
  onPointMouseUp,
  stratification,
}: {
  highlightSubject: Subject<Highlighting>;
  items: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onChartReady?: (chart: EChartsType) => void;
  onPointMouseUp?: (payload: PointMouseUpPayload) => void;
  stratification?: null | Stratification;
}) => {
  const dashboardContextValue: DashboardContextValue = {
    highlight: vi.fn(),
    highlightSubject,
    lineListRangeSubject: new Subject(),
    linkedScrollSubject: new Subject(),
    reset: vi.fn(),
  };

  return renderComponent(
    <DashboardContext value={dashboardContextValue}>
      <div
        {...TestIdUtil.createAttributes(CHART_CONTAINER_ID)}
        style={{
          height: 400,
          position: 'relative',
          width: 800,
        }}
      >
        <EpiCurveStackedAreaChart
          echarts={echartsCore}
          getXAxisLabel={getXAxisLabel}
          includeMissingValues
          items={items}
          onCaseIdsChange={onCaseIdsChange}
          onChartReady={onChartReady}
          onPointMouseUp={onPointMouseUp}
          setChartRef={noopSetChartRef}
          stratification={stratification ?? undefined}
          xAxisIntervals={X_AXIS_INTERVALS}
        />
      </div>
      <div
        {...TestIdUtil.createAttributes(OUTSIDE_CHART_ID)}
        style={{
          height: 20,
          width: 800,
        }}
      />
    </DashboardContext>,
  );
};

const renderAreaChart = async ({
  highlightSubject = new Subject<Highlighting>(),
  items = createItems(),
  onCaseIdsChange,
  onPointMouseUp,
  stratification = createStratification(),
}: {
  highlightSubject?: Subject<Highlighting>;
  items?: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onPointMouseUp?: (payload: PointMouseUpPayload) => void;
  stratification?: null | Stratification;
} = {}) => {
  let resolveChartPromise: (chart: EChartsType) => void = () => undefined;
  const chartPromise = new Promise<EChartsType>((resolve) => {
    resolveChartPromise = resolve;
  });

  const screen = await renderAreaChartTree({
    highlightSubject,
    items,
    onCaseIdsChange,
    onChartReady: resolveChartPromise,
    onPointMouseUp,
    stratification,
  });

  const chart = await chartPromise;
  if (stratification?.legendaItems.length) {
    await new Promise<void>((resolve) => {
      chart.on('finished', () => resolve());
    });
  }

  return { chart, highlightSubject, screen };
};

// Pixel position of a (category index, percentage) point in the grid.
const getPixelPoint = (chart: EChartsType, dataIndex: number, value: number) => {
  const [x, y] = chart.convertToPixel({ gridIndex: 0 }, [dataIndex, value]);
  return { x, y };
};

const getTooltipFormatter = (chart: EChartsType) => {
  const tooltipOptions = chart.getOption().tooltip as Array<{ formatter: TooltipFormatter }>;
  return tooltipOptions[0].formatter;
};

const countEvents = (chart: EChartsType, eventName: string) => {
  const eventCounts = { count: 0 };
  chart.on(eventName, () => {
    eventCounts.count += 1;
  });
  return eventCounts;
};

const recordHighlightBatches = (chart: EChartsType) => {
  const highlightBatches: Array<Array<{ dataIndex: number; seriesIndex: number }>> = [];
  chart.on('highlight', (event: unknown) => {
    const batch = (event as { batch: Array<{ dataIndex: number; seriesIndex: number }> }).batch;
    highlightBatches.push(batch.map(({ dataIndex, seriesIndex }) => ({ dataIndex, seriesIndex })));
  });
  return highlightBatches;
};

// Creates a DOM mouse event at a position relative to the chart, as used for series click resolution.
const createMouseEventAt = (chart: EChartsType, { x, y }: { x: number; y: number }) => {
  const chartRect = chart.getDom().getBoundingClientRect();
  return new MouseEvent('mouseup', { clientX: chartRect.left + x, clientY: chartRect.top + y });
};

// ECharts types the trigger payload strictly; these tests send partial payloads shaped like the ones ECharts emits.
const triggerChartEvent = (chart: EChartsType, eventType: string, payload: object) => {
  chart.trigger(eventType, payload);
};

// Emits the mouseup payload that ECharts sends for a line series click, where the DOM event sits under event.event.
const triggerSeriesMouseUp = (chart: EChartsType, { mouseEvent, seriesIndex }: { mouseEvent?: MouseEvent; seriesIndex?: number }) => {
  triggerChartEvent(chart, 'mouseup', { event: { event: mouseEvent }, seriesIndex });
};

describe('EpiCurveStackedAreaChart', () => {
  it('shows the percentage of every stratum for the hovered date in the tooltip', async () => {
    const { chart, screen } = await renderAreaChart();

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });

    await expect.element(screen.getByText(/Blue \(50\.0%\)/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Red \(50\.0%\)/)).toBeInTheDocument();
  });

  it('renders the tooltip header and marks the hovered series in bold', async () => {
    const { chart } = await renderAreaChart();
    const formatter = getTooltipFormatter(chart);

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });

    const tooltipHtml = formatter([
      { name: DAY_1_LABEL, seriesIndex: BLUE_SERIES_INDEX, seriesName: 'Blue', value: [DAY_1_LABEL, 50] },
      { marker: '<i></i>', name: DAY_1_LABEL, seriesIndex: 1, seriesName: 'Red', value: [DAY_1_LABEL, 50] },
    ]);
    expect(tooltipHtml).toBe(`${DAY_1_LABEL}<br/><b>Blue (50.0%)</b><br/><i></i>Red (50.0%)`);
  });

  it('returns an empty tooltip when there are no params', async () => {
    const { chart } = await renderAreaChart();
    const formatter = getTooltipFormatter(chart);

    expect(formatter(undefined)).toBe('');
    expect(formatter([])).toBe('');
  });

  it('does not bold any series in the tooltip when no series is hovered', async () => {
    const { chart } = await renderAreaChart();
    const formatter = getTooltipFormatter(chart);

    const tooltipHtml = formatter([
      { name: DAY_1_LABEL, seriesIndex: BLUE_SERIES_INDEX, seriesName: 'Blue', value: [DAY_1_LABEL, 50] },
    ]);
    expect(tooltipHtml).toBe(`${DAY_1_LABEL}<br/>Blue (50.0%)`);
  });

  it('reports the case ids of the hovered series', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({ onCaseIdsChange });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });

    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-2', 'case-3']);
    });
  });

  it('reports the case ids of the series that the pointer moves onto', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({ onCaseIdsChange });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });
    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-2', 'case-3']);
    });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 99) });

    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-1', 'case-4']);
    });
  });

  it('clears the reported case ids when the pointer leaves the chart', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart, screen } = await renderAreaChart({ onCaseIdsChange });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });
    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-2', 'case-3']);
    });

    await userEvent.hover(screen.getByTestId(OUTSIDE_CHART_ID));

    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith([]);
    });
  });

  it('reports the case ids of the clicked series and the mouse event', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderAreaChart({ onPointMouseUp });

    await userEvent.click(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });

    await vi.waitFor(() => {
      expect(onPointMouseUp).toHaveBeenCalledTimes(1);
    });
    const payload = onPointMouseUp.mock.calls[0][0] as PointMouseUpPayload;
    expect(payload.caseIds).toEqual(['case-2', 'case-3']);
    expect(payload.focussedDate).toBeUndefined();
    expect(payload.mouseEvent).toBeInstanceOf(MouseEvent);
  });

  it('reports the event name as focussed date for a mouse up on a named point', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderAreaChart({ onPointMouseUp });
    const mouseEvent = createMouseEventAt(chart, getPixelPoint(chart, 0, 25));

    triggerChartEvent(chart, 'mouseup', { event: { event: mouseEvent }, name: DAY_1_LABEL });

    expect(onPointMouseUp).toHaveBeenCalledWith({ caseIds: [], focussedDate: DAY_1_LABEL, mouseEvent });
  });

  it('does not fail on hover or click when no callbacks are provided', async () => {
    const { chart } = await renderAreaChart();
    const dom = chart.getDom();

    await userEvent.hover(dom, { position: getPixelPoint(chart, 0, 25) });
    await userEvent.click(dom, { position: getPixelPoint(chart, 0, 25) });

    expect(chart.isDisposed()).toBeFalsy();
  });

  it('renders an empty chart without stratification', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({
      onCaseIdsChange,
      stratification: createStratification([]),
    });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 25) });

    expect(chart.getOption().series).toEqual([]);
    expect(onCaseIdsChange).not.toHaveBeenCalled();
  });

  it('highlights the areas of the highlighted case ids in series and data order', async () => {
    const highlightSubject = new Subject<Highlighting>();
    const { chart } = await renderAreaChart({ highlightSubject });
    const highlightBatches = recordHighlightBatches(chart);

    highlightSubject.next({ caseIds: ['case-4', 'case-3', 'case-2'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(highlightBatches.length).toBeGreaterThan(0);
    });
    expect(highlightBatches.at(-1)).toEqual([
      { dataIndex: 0, seriesIndex: 0 },
      { dataIndex: 1, seriesIndex: 0 },
      { dataIndex: 2, seriesIndex: 1 },
    ]);
  });

  it('downplays all areas when the highlighted case ids are empty', async () => {
    const highlightSubject = new Subject<Highlighting>();
    const { chart } = await renderAreaChart({ highlightSubject });
    const downplayCount = countEvents(chart, 'downplay');

    highlightSubject.next({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(downplayCount.count).toBeGreaterThan(0);
    });
  });

  it('ignores highlights originating from the epi curve itself', async () => {
    const highlightSubject = new Subject<Highlighting>();
    const { chart } = await renderAreaChart({ highlightSubject });
    const highlightCount = countEvents(chart, 'highlight');
    const downplayCount = countEvents(chart, 'downplay');

    highlightSubject.next({ caseIds: ['case-2'], origin: DASHBOARD_COMPONENT_NAME.EPI_CURVE });
    highlightSubject.next({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.EPI_CURVE });

    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    expect(highlightCount.count).toBe(0);
    expect(downplayCount.count).toBe(0);
  });

  it('stops reacting to highlights after unmount', async () => {
    const highlightSubject = new Subject<Highlighting>();
    const { chart, screen } = await renderAreaChart({ highlightSubject });
    const highlightCount = countEvents(chart, 'highlight');

    await screen.unmount();
    highlightSubject.next({ caseIds: ['case-2'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    expect(highlightCount.count).toBe(0);
  });

  it('highlights every point of a case that appears on several dates and skips unknown case ids', async () => {
    const highlightSubject = new Subject<Highlighting>();
    const items = [...createItems(), { date: DAY_3, row: createDashboardCase({ id: 'case-1' }), value: 1 }];
    const { chart } = await renderAreaChart({ highlightSubject, items });
    const highlightBatches = recordHighlightBatches(chart);

    highlightSubject.next({ caseIds: ['case-1', 'unknown-case'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(highlightBatches.length).toBeGreaterThan(0);
    });
    expect(highlightBatches.at(-1)).toEqual([
      { dataIndex: 0, seriesIndex: 1 },
      { dataIndex: 2, seriesIndex: 1 },
    ]);
  });

  it('renders without stratification and reports hovered case ids unchanged', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({ onCaseIdsChange, stratification: null });

    triggerChartEvent(chart, 'mouseover', { data: [DAY_1_LABEL, 50, JSON.stringify(['case-1'])] });

    expect(chart.getOption().series).toEqual([]);
    expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-1']);
  });

  it('does not report case ids for a stratum without any cases', async () => {
    const onCaseIdsChange = vi.fn();
    const stratification = createStratification([
      ...createStratification().legendaItems,
      {
        caseIds: [],
        color: '#00ff00',
        rowValue: { full: 'Green', long: 'Green', raw: 'green', short: 'Green' },
      },
    ]);
    const { chart } = await renderAreaChart({ onCaseIdsChange, stratification });

    triggerChartEvent(chart, 'mouseover', { seriesIndex: 2 });

    expect(onCaseIdsChange).not.toHaveBeenCalled();
  });

  it('keeps unknown case ids as they are and ignores hovers without case ids', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({ onCaseIdsChange });

    triggerChartEvent(chart, 'mouseover', { data: [DAY_1_LABEL, 50, JSON.stringify(['unknown-case'])] });
    expect(onCaseIdsChange).toHaveBeenLastCalledWith(['unknown-case']);

    onCaseIdsChange.mockClear();
    triggerChartEvent(chart, 'mouseover', { data: [DAY_1_LABEL, 50, '[]'] });
    triggerChartEvent(chart, 'mouseover', { data: [DAY_1_LABEL, 50] });
    triggerChartEvent(chart, 'mouseover', {});
    triggerChartEvent(chart, 'mouseover', { seriesIndex: 99 });
    expect(onCaseIdsChange).not.toHaveBeenCalled();
  });

  it('expands a hovered point without series index to the case ids of its stratum', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderAreaChart({ onCaseIdsChange });

    triggerChartEvent(chart, 'mouseover', { data: [DAY_1_LABEL, 50, JSON.stringify(['case-1'])] });

    expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-1', 'case-4']);
  });

  it('reports the series case ids regardless of the pointer position of a series click', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderAreaChart({ onPointMouseUp });
    const pointY = getPixelPoint(chart, 0, 25).y;

    const leftMouseEvent = createMouseEventAt(chart, { x: -200, y: pointY });
    triggerSeriesMouseUp(chart, { mouseEvent: leftMouseEvent, seriesIndex: BLUE_SERIES_INDEX });
    const rightMouseEvent = createMouseEventAt(chart, { x: 5000, y: pointY });
    triggerSeriesMouseUp(chart, { mouseEvent: rightMouseEvent, seriesIndex: BLUE_SERIES_INDEX });

    expect(onPointMouseUp).toHaveBeenNthCalledWith(1, { caseIds: ['case-2', 'case-3'], focussedDate: undefined, mouseEvent: leftMouseEvent });
    expect(onPointMouseUp).toHaveBeenNthCalledWith(2, { caseIds: ['case-2', 'case-3'], focussedDate: undefined, mouseEvent: rightMouseEvent });
  });

  it('reports no case ids and no date for a mouse up without series index or name, and no mouse event when absent', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderAreaChart({ onPointMouseUp });
    const mouseEvent = createMouseEventAt(chart, getPixelPoint(chart, 0, 25));

    triggerSeriesMouseUp(chart, { mouseEvent });
    triggerSeriesMouseUp(chart, {});

    expect(onPointMouseUp).toHaveBeenNthCalledWith(1, { caseIds: [], focussedDate: undefined, mouseEvent });
    expect(onPointMouseUp).toHaveBeenNthCalledWith(2, { caseIds: [], focussedDate: undefined, mouseEvent: undefined });
  });

  it('highlights the series under the axis pointer', async () => {
    const { chart } = await renderAreaChart();
    const downplayCount = countEvents(chart, 'downplay');
    const axisPointerCount = countEvents(chart, 'updateAxisPointer');
    const hoverPoint = getPixelPoint(chart, 1, 50);

    chart.dispatchAction({ currTrigger: 'mousemove', type: 'updateAxisPointer', x: hoverPoint.x, y: hoverPoint.y });
    chart.dispatchAction({ currTrigger: 'leave', type: 'updateAxisPointer' });

    expect(axisPointerCount.count).toBe(2);
    expect(downplayCount.count).toBeGreaterThanOrEqual(2);
  });

  it('highlights a series when the axis pointer hovers a data point', async () => {
    const { chart } = await renderAreaChart();
    const highlightCount = countEvents(chart, 'highlight');
    const hoverPoint = getPixelPoint(chart, 1, 50);

    chart.dispatchAction({ currTrigger: 'mousemove', type: 'updateAxisPointer', x: hoverPoint.x, y: hoverPoint.y });

    expect(highlightCount.count).toBeGreaterThanOrEqual(1);
  });
});
