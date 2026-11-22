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
import { BarChart } from 'echarts/charts';
import {
  DataZoomComponent,
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

import { EpiCurveBarChart } from './EpiCurveBarChart';

const echartsCore = {
  dispose,
  getInstanceByDom,
  init,
};

registerECharts([TooltipComponent, GridComponent, DataZoomComponent, BarChart, CanvasRenderer]);

type HighlightBatchEntry = { dataIndex: number; seriesIndex: number };
type PointMouseUpPayload = { caseIds: string[]; focussedDate: string; mouseEvent: MouseEvent };

const CHART_CONTAINER_ID = 'epi-curve-bar-chart-container';
const BLUE_COLOR = '#0000ff';
const RED_COLOR = '#ff0000';
const DAY_1 = new Date(2024, 0, 1);
const DAY_2 = new Date(2024, 0, 2);
const DAY_3 = new Date(2024, 0, 3);
const X_AXIS_INTERVALS = [DAY_1, DAY_2, DAY_3];
const DAY_1_LABEL = '2024-01-01';

const getXAxisLabel = (value: Date) => format(value, DATE_FORMAT.DATE);
const noopSetChartRef = (): void => undefined;

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

const renderChartTree = async ({
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
  stratification?: Stratification;
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
        <EpiCurveBarChart
          echarts={echartsCore}
          getXAxisLabel={getXAxisLabel}
          items={items}
          onCaseIdsChange={onCaseIdsChange}
          onChartReady={onChartReady}
          onPointMouseUp={onPointMouseUp}
          setChartRef={noopSetChartRef}
          stratification={stratification}
          xAxisIntervals={X_AXIS_INTERVALS}
        />
      </div>
    </DashboardContext>,
  );
};

const renderBarChart = async ({
  items = createItems(),
  onCaseIdsChange,
  onPointMouseUp,
  stratification,
}: {
  items?: EpiCurveChartItem[];
  onCaseIdsChange?: (caseIds: string[]) => void;
  onPointMouseUp?: (payload: PointMouseUpPayload) => void;
  stratification?: Stratification;
} = {}) => {
  const highlightSubject = new Subject<Highlighting>();

  let resolveChart: (chart: EChartsType) => void = () => undefined;
  const chartPromise = new Promise<EChartsType>((resolve) => {
    resolveChart = resolve;
  });

  const screen = await renderChartTree({
    highlightSubject,
    items,
    onCaseIdsChange,
    onChartReady: resolveChart,
    onPointMouseUp,
    stratification,
  });

  const chart = await chartPromise;
  await new Promise<void>((resolve) => {
    chart.on('finished', () => resolve());
  });

  return { chart, highlightSubject, screen };
};

const getPixelPoint = (chart: EChartsType, dataIndex: number, value: number) => {
  const [x, y] = chart.convertToPixel({ gridIndex: 0 }, [dataIndex, value]);
  return { x, y };
};

const collectHighlightBatches = (chart: EChartsType) => {
  const highlightBatches: HighlightBatchEntry[][] = [];
  chart.on('highlight', (event: unknown) => {
    const batch = (event as { batch: HighlightBatchEntry[] }).batch;
    highlightBatches.push(batch.map(({ dataIndex, seriesIndex }) => ({ dataIndex, seriesIndex })));
  });
  return highlightBatches;
};

describe('EpiCurveBarChart', () => {
  it('shows a count tooltip for a bar when not stratified', async () => {
    const { chart, screen } = await renderBarChart();

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 0.5) });

    await expect.element(screen.getByText(`${DAY_1_LABEL} (n=2)`)).toBeInTheDocument();
  });

  it('shows the series name in the tooltip when stratified', async () => {
    const { chart, screen } = await renderBarChart({ stratification: createStratification() });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 0.5) });

    await expect.element(screen.getByText(`${DAY_1_LABEL} - Blue (n=1)`)).toBeInTheDocument();
  });

  it('shows a plain count tooltip when stratification has no legenda items', async () => {
    const { chart, screen } = await renderBarChart({ stratification: createStratification([]) });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 0.5) });

    await expect.element(screen.getByText(`${DAY_1_LABEL} (n=2)`)).toBeInTheDocument();
  });

  it('reports the case ids of a hovered bar and clears them when the pointer leaves', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderBarChart({ onCaseIdsChange });
    const dom = chart.getDom();

    await userEvent.hover(dom, { position: getPixelPoint(chart, 0, 0.5) });
    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-1', 'case-2']);
    });

    await userEvent.hover(dom, { position: getPixelPoint(chart, 1, 1.5) });
    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith([]);
    });
  });

  it('reports the case ids of a stratified segment when hovered', async () => {
    const onCaseIdsChange = vi.fn();
    const { chart } = await renderBarChart({ onCaseIdsChange, stratification: createStratification() });

    await userEvent.hover(chart.getDom(), { position: getPixelPoint(chart, 0, 1.5) });

    await vi.waitFor(() => {
      expect(onCaseIdsChange).toHaveBeenLastCalledWith(['case-1']);
    });
  });

  it('reports the clicked bar with its focussed date and mouse event', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderBarChart({ onPointMouseUp });

    await userEvent.click(chart.getDom(), { position: getPixelPoint(chart, 0, 0.5) });

    await vi.waitFor(() => {
      expect(onPointMouseUp).toHaveBeenCalledTimes(1);
    });
    const payload = onPointMouseUp.mock.calls[0][0] as PointMouseUpPayload;
    expect(payload.caseIds).toEqual(['case-1', 'case-2']);
    expect(payload.focussedDate).toBe(DAY_1_LABEL);
    expect(payload.mouseEvent).toBeInstanceOf(MouseEvent);
  });

  it('does not report a point when clicking empty chart space', async () => {
    const onPointMouseUp = vi.fn();
    const { chart } = await renderBarChart({ onPointMouseUp });

    await userEvent.click(chart.getDom(), { position: getPixelPoint(chart, 1, 1.5) });

    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    expect(onPointMouseUp).not.toHaveBeenCalled();
  });

  it('does not fail on hover or click when no callbacks are provided', async () => {
    const { chart } = await renderBarChart();
    const dom = chart.getDom();

    await userEvent.hover(dom, { position: getPixelPoint(chart, 0, 0.5) });
    await userEvent.click(dom, { position: getPixelPoint(chart, 0, 0.5) });

    expect(chart.isDisposed()).toBeFalsy();
  });

  it('highlights the bars of the highlighted case ids in series and data order', async () => {
    const { chart, highlightSubject } = await renderBarChart({ stratification: createStratification() });
    const highlightBatches = collectHighlightBatches(chart);

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

  it('highlights every bar that contains a case id', async () => {
    const items = [
      { date: DAY_1, row: createDashboardCase({ id: 'case-1' }), value: 1 },
      { date: DAY_2, row: createDashboardCase({ id: 'case-1' }), value: 1 },
    ];
    const { chart, highlightSubject } = await renderBarChart({ items });
    const highlightBatches = collectHighlightBatches(chart);

    highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(highlightBatches.length).toBeGreaterThan(0);
    });
    expect(highlightBatches.at(-1)).toEqual([
      { dataIndex: 0, seriesIndex: 0 },
      { dataIndex: 1, seriesIndex: 0 },
    ]);
  });

  it('clears the highlight when the highlighted case ids are empty', async () => {
    const { chart, highlightSubject } = await renderBarChart();
    const downplayEvents: unknown[] = [];
    chart.on('downplay', (event: unknown) => {
      downplayEvents.push(event);
    });

    highlightSubject.next({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(downplayEvents.length).toBeGreaterThan(0);
    });
  });

  it('highlights no bars for case ids that are not in the chart', async () => {
    const { chart, highlightSubject } = await renderBarChart();
    const highlightBatches = collectHighlightBatches(chart);

    highlightSubject.next({ caseIds: ['unknown-case'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await vi.waitFor(() => {
      expect(highlightBatches.length).toBeGreaterThan(0);
    });
    expect(highlightBatches.every(batch => batch.length === 0)).toBe(true);
  });

  it('ignores highlights originating from the epi curve itself', async () => {
    const { chart, highlightSubject } = await renderBarChart();
    const highlightBatches = collectHighlightBatches(chart);
    const downplayEvents: unknown[] = [];
    chart.on('downplay', (event: unknown) => {
      downplayEvents.push(event);
    });

    highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.EPI_CURVE });
    highlightSubject.next({ caseIds: [], origin: DASHBOARD_COMPONENT_NAME.EPI_CURVE });

    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    expect(highlightBatches.length).toBe(0);
    expect(downplayEvents.length).toBe(0);
  });

  it('stops reacting to highlights after unmount', async () => {
    const { chart, highlightSubject, screen } = await renderBarChart();
    const highlightBatches = collectHighlightBatches(chart);

    await screen.unmount();
    highlightSubject.next({ caseIds: ['case-1'], origin: DASHBOARD_COMPONENT_NAME.LINE_LIST });

    await new Promise(resolve => {
      setTimeout(resolve, 50);
    });
    expect(highlightBatches.length).toBe(0);
  });

  it('renders without a chart ready callback', async () => {
    const screen = await renderChartTree({
      highlightSubject: new Subject<Highlighting>(),
      items: createItems(),
    });

    await expect.element(screen.getByTestId(CHART_CONTAINER_ID)).toBeInTheDocument();
  });
});
