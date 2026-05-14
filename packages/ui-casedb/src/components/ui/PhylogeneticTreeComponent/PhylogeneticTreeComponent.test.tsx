import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  ConfigManager,
  DevicePixelRatioManager,
  Subject,
} from '@gen-epix/ui';
import { customRender } from '@gen-epix/ui/test-lib';

import type {
  Highlighting,
  Stratification,
} from '../../../models/epi';
import {
  EPI_ZONE,
  STRATIFICATION_MODE,
} from '../../../models/epi';
import type { TreeNode } from '../../../models/tree';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';
import { NewickUtil } from '../../../utils/NewickUtil';
import type { CaseDbConfig } from '../../../models/config';

import type {
  PhylogeneticTreeComponentPathClickEvent,
  PhylogeneticTreeComponentRef,
  PhylogeneticTreeComponentViewState,
} from './PhylogeneticTreeComponent';
import { PhylogeneticTreeComponent } from './PhylogeneticTreeComponent';

const DEFAULT_HEIGHT = 320;
const DEFAULT_ITEM_HEIGHT = 32;
const DEFAULT_WIDTH = 640;
const HEADER_HEIGHT = ConfigManager.getInstance<CaseDbConfig>().config.epiTree.HEADER_HEIGHT;
const LARGE_TREE_NEWICK = '(A:1,B:1,C:1,D:1,E:1,F:1,G:1,H:1,I:1,J:1);';
const TREE_PADDING = ConfigManager.getInstance<CaseDbConfig>().config.epiTree.TREE_PADDING;

let ariaLabelCounter = 0;

type RenderTreeOptions = {
  externalScrollSubject?: Subject<{ origin: HTMLElement; position: number }>;
  externalVisibleRangeSubject?: Subject<{ endIndex: number; startIndex: number }>;
  height?: number;
  highlightingSubject?: Subject<Highlighting>;
  itemHeight?: number;
  leafOrder?: string[];
  newick?: string;
  onCanvasChange?: (canvas?: HTMLCanvasElement) => void;
  onLinkStateChange?: (isLinked: boolean) => void;
  onPathClick?: (event: PhylogeneticTreeComponentPathClickEvent) => void;
  onViewStateChange?: (viewState: PhylogeneticTreeComponentViewState) => void;
  ref?: { current: null | PhylogeneticTreeComponentRef };
  shouldShowDistances?: boolean;
  shouldShowSupportLinesWhenUnlinked?: boolean;
  stratification?: Stratification;
  tree?: TreeNode;
  width?: number;
};

type ResolvedRenderTreeOptions = {
  ariaLabel: string;
  height: number;
  itemHeight: number;
  leafOrder: string[];
  width: number;
} & RenderTreeOptions;

type TreeLayout = {
  pixelToGeneticDistanceRatio: number;
  positions: Map<string, TreeLayoutNode>;
  supportLines: Map<string, { fromX: number; fromY: number; toX: number; toY: number }>;
};

type TreeLayoutNode = {
  caseIds: string[];
  dotX: number;
  labelX: number;
  labelY: number;
  startX: number;
  y: number;
};

const createComponentRef = (): { current: null | PhylogeneticTreeComponentRef } => {
  return { current: null };
};

const nextFrame = async (count = 1) => {
  for (let index = 0; index < count; index++) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        resolve();
      });
    });
  }
};

const waitForAssertion = async (assertion: () => void, attempts = 60) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await nextFrame();
    }
  }

  throw lastError instanceof Error ? lastError : new Error('The expected browser assertion did not pass in time.');
};

const toCanvasY = (bodyY: number) => HEADER_HEIGHT + bodyY;

const getLast = <TData,>(values: TData[]) => {
  return values[values.length - 1];
};

const hasPixelAround = (
  canvas: HTMLCanvasElement,
  logicalX: number,
  logicalY: number,
  predicate: (red: number, green: number, blue: number, alpha: number) => boolean,
  radius = 2,
) => {
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return false;
  }

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Expected the tree canvas to expose a 2D rendering context.');
  }

  const scaleX = canvas.width / canvas.clientWidth;
  const scaleY = canvas.height / canvas.clientHeight;
  const startX = Math.max(0, Math.round((logicalX - radius) * scaleX));
  const startY = Math.max(0, Math.round((logicalY - radius) * scaleY));
  const endX = Math.min(canvas.width, Math.round((logicalX + radius) * scaleX));
  const endY = Math.min(canvas.height, Math.round((logicalY + radius) * scaleY));
  const width = Math.max(1, endX - startX);
  const height = Math.max(1, endY - startY);
  const { data } = context.getImageData(startX, startY, width, height);

  for (let index = 0; index < data.length; index += 4) {
    if (predicate(data[index], data[index + 1], data[index + 2], data[index + 3])) {
      return true;
    }
  }

  return false;
};

const hasDarkPixelAround = (canvas: HTMLCanvasElement, logicalX: number, logicalY: number, radius = 2) => {
  return hasPixelAround(canvas, logicalX, logicalY, (red, green, blue, alpha) => {
    return alpha > 0 && red < 80 && green < 80 && blue < 80;
  }, radius);
};

const hasNonBackgroundPixelAround = (canvas: HTMLCanvasElement, logicalX: number, logicalY: number, radius = 2) => {
  return hasPixelAround(canvas, logicalX, logicalY, (red, green, blue, alpha) => {
    return alpha > 0 && (red < 245 || green < 245 || blue < 245);
  }, radius);
};

const hasRedPixelAround = (canvas: HTMLCanvasElement, logicalX: number, logicalY: number, radius = 2) => {
  return hasPixelAround(canvas, logicalX, logicalY, (red, green, blue, alpha) => {
    return alpha > 0 && red > 150 && green < 120 && blue < 120;
  }, radius);
};

const waitForCanvasPaint = async (canvas: HTMLCanvasElement, assertion: () => boolean) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (canvas.width > 0 && canvas.height > 0 && assertion()) {
      return;
    }
    await nextFrame();
  }

  throw new Error('Canvas was rendered, but the expected pixels did not appear.');
};

const parseTree = (newick: string) => {
  return EpiTreeUtil.sanitizeTree(NewickUtil.parse(newick));
};

const getLayoutNode = (layout: TreeLayout, nodeName: string) => {
  const node = layout.positions.get(nodeName);

  if (!node) {
    throw new Error(`Expected tree layout to contain a node named "${nodeName}".`);
  }

  return node;
};

const getSupportLine = (layout: TreeLayout, nodeName: string) => {
  const supportLine = layout.supportLines.get(nodeName);

  if (!supportLine) {
    throw new Error(`Expected tree layout to contain a support line for "${nodeName}".`);
  }

  return supportLine;
};

const createTreeLayout = (params: { itemHeight: number; leafOrder: string[]; tree: TreeNode; width: number }): TreeLayout => {
  const { itemHeight, leafOrder, tree, width } = params;
  const pixelToGeneticDistanceRatio = (width - (2 * TREE_PADDING)) / tree.maxBranchLength.toNumber();
  const positions = new Map<string, TreeLayoutNode>();
  const supportLines = new Map<string, { fromX: number; fromY: number; toX: number; toY: number }>();
  let leafIndex = 0;

  const traverse = (node: TreeNode, distance = 0): { caseIds: string[]; x: number; y: number } => {
    const branchLength = node.branchLength?.toNumber() ?? 0;

    if (!node.children?.length) {
      const leafX = distance + branchLength;
      const dotX = leafX * pixelToGeneticDistanceRatio + TREE_PADDING;
      const startX = dotX - (branchLength * pixelToGeneticDistanceRatio);
      const y = (leafIndex * itemHeight) + (itemHeight / 2);

      positions.set(node.name, {
        caseIds: [node.name],
        dotX,
        labelX: (startX + dotX) / 2,
        labelY: y + 12,
        startX,
        y,
      });

      supportLines.set(node.name, {
        fromX: dotX,
        fromY: y,
        toX: width,
        toY: (leafOrder.indexOf(node.name) * itemHeight) + (itemHeight / 2),
      });

      leafIndex++;

      return {
        caseIds: [node.name],
        x: startX,
        y,
      };
    }

    const childRenderResults = node.children.map((child) => {
      return traverse(child, distance + branchLength);
    });
    const firstChild = childRenderResults[0];
    const lastChild = childRenderResults[childRenderResults.length - 1];
    const dotX = firstChild.x;
    const startX = dotX - (branchLength * pixelToGeneticDistanceRatio);
    const y = (firstChild.y + lastChild.y) / 2;
    const caseIds = childRenderResults.map(result => result.caseIds).flat();

    positions.set(node.name, {
      caseIds,
      dotX,
      labelX: (startX + dotX) / 2,
      labelY: y + 12,
      startX,
      y,
    });

    return {
      caseIds,
      x: startX,
      y,
    };
  };

  traverse(tree);

  return {
    pixelToGeneticDistanceRatio,
    positions,
    supportLines,
  };
};

const createTreeElement = (options: ResolvedRenderTreeOptions) => {
  return (
    <div
      style={{
        height: `${options.height}px`,
        width: `${options.width}px`,
      }}
    >
      <PhylogeneticTreeComponent
        ariaLabel={options.ariaLabel}
        externalScrollSubject={options.externalScrollSubject}
        externalVisibleRangeSubject={options.externalVisibleRangeSubject}
        highlightingSubject={options.highlightingSubject}
        itemHeight={options.itemHeight}
        leafOrder={options.leafOrder}
        onCanvasChange={options.onCanvasChange}
        onLinkStateChange={options.onLinkStateChange}
        onPathClick={options.onPathClick}
        onViewStateChange={options.onViewStateChange}
        ref={options.ref}
        shouldShowDistances={options.shouldShowDistances ?? false}
        shouldShowSupportLinesWhenUnlinked={options.shouldShowSupportLinesWhenUnlinked ?? false}
        stratification={options.stratification}
        tree={options.tree}
      />
    </div>
  );
};

const renderTree = async (options: RenderTreeOptions = {}) => {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const itemHeight = options.itemHeight ?? DEFAULT_ITEM_HEIGHT;
  const tree = Object.prototype.hasOwnProperty.call(options, 'tree')
    ? options.tree
    : parseTree(options.newick ?? '(LeafA:1,LeafB:2);');
  const leafOrder = options.leafOrder ?? (tree ? NewickUtil.getSortedNames(tree) : []);
  const resolvedOptions: ResolvedRenderTreeOptions = {
    ...options,
    ariaLabel: `Phylogenetic tree ${ariaLabelCounter++}`,
    height,
    itemHeight,
    leafOrder,
    tree,
    width,
  };
  const renderResult = await customRender(createTreeElement(resolvedOptions));

  if (tree?.size) {
    await waitForAssertion(() => {
      const nextCanvas = document.querySelector(`canvas[aria-label="${resolvedOptions.ariaLabel}"]`);

      if (!(nextCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Expected the tree canvas to be mounted after the initial browser render.');
      }
    });
  }

  const canvas = document.querySelector(`canvas[aria-label="${resolvedOptions.ariaLabel}"]`);

  return {
    ariaLabel: resolvedOptions.ariaLabel,
    canvas: canvas instanceof HTMLCanvasElement ? canvas : null,
    height,
    itemHeight,
    layout: tree ? createTreeLayout({ itemHeight, leafOrder, tree, width }) : null,
    renderResult,
    resolvedOptions,
    tree,
    width,
  };
};

const dispatchCanvasMouseEvent = (
  canvas: HTMLCanvasElement,
  type: 'mousedown' | 'mousemove' | 'mouseup',
  logicalX: number,
  logicalY: number,
  init: MouseEventInit = {},
) => {
  const rect = canvas.getBoundingClientRect();
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + logicalX,
    clientY: rect.top + logicalY,
    ...init,
  });

  Object.defineProperty(event, 'offsetX', { configurable: true, value: logicalX });
  Object.defineProperty(event, 'offsetY', { configurable: true, value: logicalY });

  canvas.dispatchEvent(event);
  return event;
};

const dispatchCanvasWheelEvent = (
  canvas: HTMLCanvasElement,
  logicalX: number,
  logicalY: number,
  init: WheelEventInit,
) => {
  const rect = canvas.getBoundingClientRect();
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + logicalX,
    clientY: rect.top + logicalY,
    ...init,
  });

  Object.defineProperty(event, 'offsetX', { configurable: true, value: logicalX });
  Object.defineProperty(event, 'offsetY', { configurable: true, value: logicalY });

  canvas.dispatchEvent(event);
  return event;
};

const dispatchCanvasMouseOut = (canvas: HTMLCanvasElement) => {
  canvas.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, cancelable: true }));
};

describe('PhylogeneticTreeComponent', () => {
  test('does not render a canvas without a tree and reports an undefined canvas', async () => {
    const onCanvasChange = vi.fn();
    const { ariaLabel, canvas, renderResult } = await renderTree({ onCanvasChange, tree: undefined });

    await nextFrame(2);

    expect(canvas).toBeNull();
    expect(document.querySelector(`canvas[aria-label="${ariaLabel}"]`)).toBeNull();
    expect(onCanvasChange).toHaveBeenCalledWith(undefined);

    await renderResult.unmount();

    expect(onCanvasChange).toHaveBeenCalledTimes(1);
  });

  test('renders a sanitized tree, applies stratification colors, and cleans up the canvas callback', async () => {
    const onCanvasChange = vi.fn();
    const stratification: Stratification = {
      caseIdColors: Object.fromEntries([['LeafB', '#ff0000']]),
      mode: STRATIFICATION_MODE.SELECTION,
    };
    const { canvas, layout, renderResult } = await renderTree({
      newick: '(((LeafA:1,LeafB:1):0,LeafC:2):0,LeafD:3);',
      onCanvasChange,
      stratification,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement) || !layout) {
      throw new Error('Expected a rendered tree canvas and computed layout.');
    }

    const leafB = getLayoutNode(layout, 'LeafB');
    const leafD = getLayoutNode(layout, 'LeafD');
    const root = getLayoutNode(layout, 'Root');

    await waitForCanvasPaint(canvas, () => {
      return hasRedPixelAround(canvas, leafB.dotX, toCanvasY(leafB.y)) && hasDarkPixelAround(canvas, leafD.dotX, toCanvasY(leafD.y));
    });
    await waitForAssertion(() => {
      expect(onCanvasChange.mock.calls.some(([value]) => value instanceof HTMLCanvasElement)).toBe(true);
    });

    expect(hasRedPixelAround(canvas, leafB.dotX, toCanvasY(leafB.y))).toBe(true);
    expect(hasDarkPixelAround(canvas, root.dotX, toCanvasY(root.y))).toBe(true);

    await renderResult.unmount();

    await waitForAssertion(() => {
      expect(getLast(onCanvasChange.mock.calls)?.[0]).toBeUndefined();
    });
  });

  test('draws highlighted distance labels only when enabled', async () => {
    const highlightingSubject = new Subject<Highlighting>({
      caseIds: ['LeafA'],
      origin: EPI_ZONE.TREE,
    });
    const { ariaLabel, canvas, layout, renderResult, resolvedOptions } = await renderTree({
      highlightingSubject,
      newick: '(LeafA:5,LeafB:10);',
      shouldShowDistances: true,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement) || !layout) {
      throw new Error('Expected a rendered tree canvas and computed layout.');
    }

    const leafA = getLayoutNode(layout, 'LeafA');

    await waitForCanvasPaint(canvas, () => {
      return hasDarkPixelAround(canvas, leafA.labelX, toCanvasY(leafA.labelY), 8);
    });

    expect(hasDarkPixelAround(canvas, leafA.labelX, toCanvasY(leafA.labelY), 8)).toBe(true);

    await renderResult.rerender(createTreeElement({
      ...resolvedOptions,
      shouldShowDistances: false,
    }));

    await nextFrame(3);

    const rerenderedCanvas = document.querySelector(`canvas[aria-label="${ariaLabel}"]`);

    expect(rerenderedCanvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(rerenderedCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected the rerendered tree canvas to exist.');
    }

    expect(hasDarkPixelAround(rerenderedCanvas, leafA.labelX, toCanvasY(leafA.labelY), 8)).toBe(false);
  });

  test('syncs external scroll and imperative link state', async () => {
    const externalOrigin = document.createElement('div');
    const externalScrollSubject = new Subject<{ origin: HTMLElement; position: number }>({ origin: externalOrigin, position: 0 });
    const ref = createComponentRef();
    const onLinkStateChange = vi.fn();
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const { renderResult } = await renderTree({
      externalScrollSubject,
      height: 240,
      newick: LARGE_TREE_NEWICK,
      onLinkStateChange,
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
      ref,
    });

    await waitForAssertion(() => {
      expect(ref.current).not.toBeNull();
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 0,
        verticalScrollPosition: 0,
        zoomLevel: 1,
      });
    });

    externalScrollSubject.next({ origin: externalOrigin, position: 64 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 0,
        verticalScrollPosition: 64,
        zoomLevel: 1,
      });
    });

    ref.current?.unlink({ positionX: 40, positionY: 96, zoomLevel: 2 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 40,
        verticalScrollPosition: 96,
        zoomLevel: 2,
      });
      expect(getLast(onLinkStateChange.mock.calls)?.[0]).toBe(false);
    });

    externalScrollSubject.next({ origin: externalOrigin, position: 12 });

    await nextFrame(3);

    expect(getLast(viewStates)).toMatchObject({
      horizontalScrollPosition: 40,
      verticalScrollPosition: 96,
      zoomLevel: 2,
    });

    ref.current?.link();

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 0,
        verticalScrollPosition: 12,
        zoomLevel: 1,
      });
      expect(getLast(onLinkStateChange.mock.calls)?.[0]).toBe(true);
    });

    let unlinkedVerticalScrollPosition = 0;

    ref.current?.unlink({ positionX: 0, positionY: 160, zoomLevel: 2 });

    await waitForAssertion(() => {
      const lastViewState = getLast(viewStates);

      expect(lastViewState?.horizontalScrollPosition).toBe(0);
      expect(lastViewState?.verticalScrollPosition).toBeGreaterThan(0);
      expect(lastViewState?.zoomLevel).toBe(2);
      unlinkedVerticalScrollPosition = lastViewState?.verticalScrollPosition ?? 0;
    });

    ref.current?.syncExternalScrollToVisibleTree();

    await waitForAssertion(() => {
      const lastViewState = getLast(viewStates);

      expect(lastViewState).toBeDefined();
      expect(lastViewState?.horizontalScrollPosition).toBe(0);
      expect(lastViewState?.verticalScrollPosition).toBeGreaterThan(0);
      expect(lastViewState?.verticalScrollPosition).not.toBe(unlinkedVerticalScrollPosition);
      expect(lastViewState?.zoomLevel).toBe(1);
      expect(getLast(onLinkStateChange.mock.calls)?.[0]).toBe(true);
    });

    expect(externalScrollSubject.data.position).toBe(getLast(viewStates)?.verticalScrollPosition);

    await renderResult.unmount();
  });

  test('highlights hovered nodes and emits path clicks for generated internal nodes', async () => {
    const highlightingSubject = new Subject<Highlighting>({
      caseIds: [],
      origin: null,
    });
    const onPathClick = vi.fn();
    const { canvas, layout, tree } = await renderTree({
      highlightingSubject,
      newick: '((LeafA:1,LeafB:1):1,LeafC:2);',
      onPathClick,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement) || !layout || !tree) {
      throw new Error('Expected a rendered tree canvas, layout, and parsed tree.');
    }

    const leafA = getLayoutNode(layout, 'LeafA');
    const generatedNodeName = tree.children?.[0]?.name;

    if (!generatedNodeName?.startsWith('Generated-')) {
      throw new Error('Expected the unnamed internal Newick node to receive a generated name.');
    }

    dispatchCanvasMouseEvent(canvas, 'mousemove', leafA.dotX, toCanvasY(leafA.y));

    await waitForAssertion(() => {
      expect(highlightingSubject.data.caseIds).toHaveLength(1);
      expect(['LeafA', 'LeafB', 'LeafC']).toContain(highlightingSubject.data.caseIds[0]);
      expect(highlightingSubject.data.origin).toBe(EPI_ZONE.TREE);
      expect(canvas.style.cursor).toBe('pointer');
    });

    dispatchCanvasMouseEvent(canvas, 'mousedown', leafA.dotX, 5);
    dispatchCanvasMouseEvent(canvas, 'mousemove', leafA.dotX, 5);

    await waitForAssertion(() => {
      expect(highlightingSubject.data.caseIds).toEqual([]);
      expect(highlightingSubject.data.origin).toBe(EPI_ZONE.TREE);
      expect(canvas.style.cursor).toBe('default');
    });

    dispatchCanvasMouseEvent(canvas, 'mouseup', leafA.dotX, 5);

    expect(onPathClick).not.toHaveBeenCalled();

    dispatchCanvasMouseEvent(canvas, 'mouseup', leafA.dotX, toCanvasY(leafA.y));

    await waitForAssertion(() => {
      expect(onPathClick).toHaveBeenCalledTimes(1);
    });

    const clickEvent = onPathClick.mock.calls[0][0] as PhylogeneticTreeComponentPathClickEvent;

    expect(clickEvent.mouseEvent.type).toBe('mouseup');
    expect(clickEvent.pathProperties.subTreeLeaveNames).toHaveLength(1);
    expect(['LeafA', 'LeafB', 'LeafC']).toContain(clickEvent.pathProperties.treeNode?.name ?? '');

    dispatchCanvasMouseOut(canvas);

    await waitForAssertion(() => {
      expect(highlightingSubject.data.caseIds).toEqual([]);
      expect(highlightingSubject.data.origin).toBe(EPI_ZONE.TREE);
    });
  });

  test('pans by dragging and keeps small horizontal deltas clamped at zoom level 1', async () => {
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const { canvas } = await renderTree({
      height: 240,
      newick: LARGE_TREE_NEWICK,
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected a rendered tree canvas.');
    }

    const startX = 320;
    const startY = HEADER_HEIGHT + 160;

    dispatchCanvasMouseEvent(canvas, 'mousedown', startX, startY);
    dispatchCanvasMouseEvent(canvas, 'mousemove', startX - 10, startY - 70);

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toBeDefined();
      expect(getLast(viewStates)?.horizontalScrollPosition).toBe(0);
      expect(getLast(viewStates)?.verticalScrollPosition).toBeGreaterThan(0);
      expect(canvas.style.cursor).toBe('move');
    });

    dispatchCanvasMouseEvent(canvas, 'mouseup', startX - 10, startY - 70);
  });

  test('zooms with the wheel, returns to zoom level 1, and handles modifier scrolling', async () => {
    const externalOrigin = document.createElement('div');
    const externalScrollSubject = new Subject<{ origin: HTMLElement; position: number }>({ origin: externalOrigin, position: 48 });
    const onLinkStateChange = vi.fn();
    const ref = createComponentRef();
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const { canvas } = await renderTree({
      externalScrollSubject,
      height: 240,
      newick: LARGE_TREE_NEWICK,
      onLinkStateChange,
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
      ref,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected a rendered tree canvas.');
    }

    await waitForAssertion(() => {
      expect(ref.current).not.toBeNull();
    });

    const bodyX = 320;
    const bodyY = HEADER_HEIGHT + 120;

    dispatchCanvasWheelEvent(canvas, bodyX, bodyY, { deltaY: -100 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.zoomLevel).toBeLessThan(1);
      expect(getLast(onLinkStateChange.mock.calls)?.[0]).toBe(false);
    });

    dispatchCanvasWheelEvent(canvas, bodyX, bodyY, { deltaY: 100 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.verticalScrollPosition).toBe(48);
      expect(getLast(viewStates)?.zoomLevel).toBe(1);
    });

    ref.current?.link(48);

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 0,
        verticalScrollPosition: 48,
        zoomLevel: 1,
      });
      expect(getLast(onLinkStateChange.mock.calls)?.[0]).toBe(true);
    });

    dispatchCanvasWheelEvent(canvas, bodyX, bodyY, {
      deltaY: 80,
      shiftKey: true,
    });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.horizontalScrollPosition).toBeGreaterThan(0);
    });

    const horizontalAfterShift = getLast(viewStates)?.horizontalScrollPosition ?? 0;

    dispatchCanvasWheelEvent(canvas, bodyX, bodyY, {
      deltaY: 40,
      metaKey: true,
    });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.horizontalScrollPosition).toBe(horizontalAfterShift);
      expect(getLast(viewStates)?.verticalScrollPosition).toBeGreaterThan(48);
    });

    const lastStateBeforeHeaderWheel = getLast(viewStates);

    dispatchCanvasWheelEvent(canvas, bodyX, 5, { deltaY: -100 });

    await nextFrame(3);

    expect(getLast(viewStates)).toEqual(lastStateBeforeHeaderWheel);
  });

  test('draws unlinked support lines for offscreen leaves when the external range matches', async () => {
    const externalVisibleRangeSubject = new Subject({ endIndex: 0, startIndex: 0 });
    const leafOrder = ['LeafF', 'LeafE', 'LeafD', 'LeafC', 'LeafB', 'LeafA'];
    const ref = createComponentRef();
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const { canvas, layout } = await renderTree({
      externalVisibleRangeSubject,
      height: 240,
      leafOrder,
      newick: '(LeafA:1,LeafB:10,LeafC:10,LeafD:10,LeafE:10,LeafF:10);',
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
      ref,
      shouldShowSupportLinesWhenUnlinked: true,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement) || !layout) {
      throw new Error('Expected a rendered tree canvas and computed layout.');
    }

    await waitForAssertion(() => {
      expect(ref.current).not.toBeNull();
    });

    ref.current?.unlink({ positionX: 0, positionY: 200, zoomLevel: 2 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.verticalScrollPosition).toBeGreaterThan(0);
      expect(getLast(viewStates)?.zoomLevel).toBe(2);
    });

    const supportLine = getSupportLine(layout, 'LeafA');
    const verticalScrollPosition = getLast(viewStates)?.verticalScrollPosition ?? 0;
    const sourceScreenX = supportLine.fromX / 2;
    const sourceScreenY = toCanvasY(supportLine.fromY / 2) - verticalScrollPosition;
    const endScreenY = toCanvasY(supportLine.toY);
    const sampleX = 480;
    const sampleY = sourceScreenY + ((sampleX - sourceScreenX) / (supportLine.toX - sourceScreenX)) * (endScreenY - sourceScreenY);

    expect(hasNonBackgroundPixelAround(canvas, sampleX, sampleY, 3)).toBe(false);

    externalVisibleRangeSubject.next({ endIndex: 5, startIndex: 5 });

    await waitForCanvasPaint(canvas, () => {
      return hasNonBackgroundPixelAround(canvas, sampleX, sampleY, 3);
    });

    expect(hasNonBackgroundPixelAround(canvas, sampleX, sampleY, 3)).toBe(true);
  });

  test('suppresses unlinked support lines when disabled', async () => {
    const externalVisibleRangeSubject = new Subject({ endIndex: 5, startIndex: 5 });
    const leafOrder = ['LeafF', 'LeafE', 'LeafD', 'LeafC', 'LeafB', 'LeafA'];
    const ref = createComponentRef();
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const { canvas, layout } = await renderTree({
      externalVisibleRangeSubject,
      height: 240,
      leafOrder,
      newick: '(LeafA:1,LeafB:10,LeafC:10,LeafD:10,LeafE:10,LeafF:10);',
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
      ref,
      shouldShowSupportLinesWhenUnlinked: false,
    });

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement) || !layout) {
      throw new Error('Expected a rendered tree canvas and computed layout.');
    }

    await waitForAssertion(() => {
      expect(ref.current).not.toBeNull();
    });

    ref.current?.unlink({ positionX: 0, positionY: 200, zoomLevel: 2 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)?.verticalScrollPosition).toBeGreaterThan(0);
      expect(getLast(viewStates)?.zoomLevel).toBe(2);
    });

    const supportLine = getSupportLine(layout, 'LeafA');
    const verticalScrollPosition = getLast(viewStates)?.verticalScrollPosition ?? 0;
    const sourceScreenX = supportLine.fromX / 2;
    const sourceScreenY = toCanvasY(supportLine.fromY / 2) - verticalScrollPosition;
    const endScreenY = toCanvasY(supportLine.toY);
    const sampleX = 480;
    const sampleY = sourceScreenY + ((sampleX - sourceScreenX) / (supportLine.toX - sourceScreenX)) * (endScreenY - sourceScreenY);

    await nextFrame(3);

    expect(hasNonBackgroundPixelAround(canvas, sampleX, sampleY, 3)).toBe(false);
  });

  test('redraws the canvas when the device pixel ratio changes', async () => {
    const originalDevicePixelRatio = DevicePixelRatioManager.getInstance().data;
    const ref = createComponentRef();
    const viewStates: PhylogeneticTreeComponentViewState[] = [];
    const tree = parseTree(LARGE_TREE_NEWICK);
    const leafOrder = NewickUtil.getSortedNames(tree);
    const ariaLabel = `Phylogenetic tree ${ariaLabelCounter++}`;
    const renderResult = await customRender(createTreeElement({
      ariaLabel,
      height: DEFAULT_HEIGHT,
      itemHeight: DEFAULT_ITEM_HEIGHT,
      leafOrder,
      onViewStateChange: (viewState) => {
        viewStates.push(viewState);
      },
      ref,
      tree,
      width: DEFAULT_WIDTH,
    }));

    await waitForAssertion(() => {
      const nextCanvas = document.querySelector(`canvas[aria-label="${ariaLabel}"]`);

      if (!(nextCanvas instanceof HTMLCanvasElement)) {
        throw new Error('Expected the tree canvas to be mounted after the initial browser render.');
      }
    });

    const canvas = document.querySelector(`canvas[aria-label="${ariaLabel}"]`);

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Expected a rendered tree canvas.');
    }

    await waitForAssertion(() => {
      expect(ref.current).not.toBeNull();
    });

    ref.current?.unlink({ positionX: 20, positionY: 30, zoomLevel: 1 });

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 20,
        verticalScrollPosition: 30,
        zoomLevel: 1,
      });
    });

    DevicePixelRatioManager.getInstance().next(originalDevicePixelRatio * 2);

    await waitForAssertion(() => {
      expect(getLast(viewStates)).toMatchObject({
        horizontalScrollPosition: 40,
        verticalScrollPosition: 60,
        zoomLevel: 1,
      });
      expect(canvas.width).toBe(canvas.clientWidth * (originalDevicePixelRatio * 2));
    });

    DevicePixelRatioManager.getInstance().next(originalDevicePixelRatio);

    await renderResult.unmount();
  });
});
