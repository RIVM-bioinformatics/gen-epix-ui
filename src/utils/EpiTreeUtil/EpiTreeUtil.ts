import Decimal from 'decimal.js';
import first from 'lodash/first';
import intersection from 'lodash/intersection';
import last from 'lodash/last';
import round from 'lodash/round';
import { type Theme } from '@mui/material';

import { NumberUtil } from '../NumberUtil';
import type { CompleteCaseType } from '../../api';
import { ColType } from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import type {
  Stratification,
  TreeConfiguration,
} from '../../models/epi';
import type {
  TreeNode,
  TreePathProperties,
} from '../../models/tree';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

type SanitizeResult = { node: TreeNode; nodesToMove: TreeNode[] };

type PathPropertiesMap = Map<Path2D, TreePathProperties>;

export type TreeAssembly = {
  verticalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  horizontalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  ancestorNodes: Array<{ nodeNames: string[]; shape: Path2D }>;
  leafNodes: Array<{ nodeName: string; shape: Path2D }>;
  leafTreeLines: Array<{ nodeName: string; shape: Path2D }>;
  supportLines: Array<{ nodeName: string; fromX: number; toX: number; y: number }>;
  distanceTexts: Array<{ nodeNames: string[]; x: number; y: number; text: string }>;
  nodePathPropertiesMap: PathPropertiesMap;
  horizontalLinePathPropertiesMap: PathPropertiesMap;
  verticalLinePathPropertiesMap: PathPropertiesMap;
};

type TreeAssemblyContext = {
  rootNode: TreeNode;
  treeCanvasWidth: number;
  treeAssembly: TreeAssembly;
  pixelToGeneticDistanceRatio: number;
};

type NodeAssemblyResult = {
  x: number;
  y: number;
  caseIds: string[];
};

// [number of lines to draw, genetic distance of single line, minGeneticScaleUnit]
export type TickerMarkScale = [number, number, number];

export class EpiTreeUtil {
  public static getScrollPositionFromTreeVisibility(kwArgs: {
    treeCanvasHeight: number;
    treeHeight: number;
    treeSize: number;
    verticalScrollPosition: number;
    zoomLevel: number;
  }): number {
    const { treeCanvasHeight, treeHeight, verticalScrollPosition, zoomLevel, treeSize } = kwArgs;

    const scaledItemHeight = ConfigManager.instance.config.epiLineList.TABLE_ROW_HEIGHT / zoomLevel;
    const scrolledByItems = Math.round(verticalScrollPosition / scaledItemHeight);
    const maxItemsInView = Math.round(treeCanvasHeight / scaledItemHeight);

    const firstItemInView = Math.max(0, scrolledByItems);
    const lastItemInView = Math.min(scrolledByItems + maxItemsInView, treeSize);
    const averageItemInView = (firstItemInView + lastItemInView) / 2;

    const newScrollPosition = Math.max(0, Math.min(treeHeight - treeCanvasHeight, averageItemInView * ConfigManager.instance.config.epiLineList.TABLE_ROW_HEIGHT - treeCanvasHeight / 2));
    return newScrollPosition;
  }


  public static sanitizeTree(rootNode: TreeNode): TreeNode {
    const sanitize = (node: TreeNode): SanitizeResult => {
      const results: SanitizeResult[] = [];
      node.children?.forEach(child => {
        results.push(sanitize(child));
      });
      results.filter(x => !!x).forEach((result) => {
        node.children.splice(node.children.indexOf(result.node), result.node.children.length === result.nodesToMove.length ? 1 : 0, ...result.nodesToMove);
        node.subTreeNames.splice(node.subTreeNames.indexOf(result.node.name), result.node.children.length === result.nodesToMove.length ? 1 : 0, ...result.nodesToMove.map(n => n.subTreeNames).flat());
      });

      if (node.children?.length) {
        const nodesToMove: TreeNode[] = [];
        node.children.forEach(child => {
          if ((node.branchLength?.toNumber() ?? 0) === 0 && (node.children?.length || (child.branchLength?.toNumber() ?? 0) === 0)) {
            nodesToMove.push(child);
          }
        });
        return {
          node,
          nodesToMove,
        };
      }
      return null;
    };
    sanitize(rootNode);
    return rootNode;
  }

  public static createTreeAddresses(rootNode: TreeNode): { [key: string]: string } {
    const treeAddresses: { [key: string]: string } = {};
    const traverse = (node: TreeNode, address: number[] = []): TreeNode => {
      treeAddresses[node.name] = address.join('.');
      if (node.children?.length) {
        const hasZeroBranchLength = node.children.some(child => (child.branchLength?.toNumber() ?? 0) === 0);

        let index = hasZeroBranchLength ? 2 : 1;
        node.children.forEach((child) => {
          if ((child.branchLength?.toNumber() ?? 0) === 0) {
            traverse(child, [...address, 1]);
          } else {
            traverse(child, [...address, index]);
            index++;
          }
        });
      }
      return node;
    };
    traverse(rootNode);
    return treeAddresses;
  }

  public static findNewTreeRoot(rootNode: TreeNode, nodeName: string, selector: 'node' | 'parent'): TreeNode {
    let newRoot: TreeNode;
    const findNewRoot = (node: TreeNode) => {
      if (newRoot) {
        return;
      }

      if (selector === 'node' && node.name === nodeName) {
        newRoot = node;
      }
      if (node.children) {
        const matchingChild = node.children.find(childNode => childNode.name === nodeName);
        if (selector === 'parent' && matchingChild) {
          newRoot = node;
        } else {
          node.children.forEach(childNode => findNewRoot(childNode));
        }
      }
    };
    findNewRoot(rootNode);
    return {
      ...newRoot,
      branchLength: new Decimal(0),
      maxBranchLength: newRoot.maxBranchLength.sub(newRoot.branchLength),
    };
  }

  public static getMinGeneticScaleUnit(tree: TreeNode): number {
    if (!tree) {
      return Infinity;
    }
    let min: number = Infinity;
    const traverse = (node: TreeNode) => {
      const branchLength = node.branchLength?.toNumber() ?? 0;
      if (!node.children?.length && branchLength && branchLength < min) {
        min = node.branchLength?.toNumber() ?? 0;
      }
      node?.children?.forEach(child => traverse(child));
    };
    traverse(tree);
    return min;
  }

  /**
   * getTickMarkScale
   *
   * @param treeWidthMinusPadding width of the canvas in pixels
   * @param geneticTreeWidth
   * @param minGeneticScaleUnit
   * @param zoomLevel
   * @returns [number of lines to draw, genetic distance of single line, minGeneticScaleUnit]
   */
  public static getTickMarkScale(params: { treeWidthMinusPadding: number; geneticTreeWidth: Decimal; minGeneticScaleUnit: number; zoomLevel: number }): TickerMarkScale {
    const { treeWidthMinusPadding, geneticTreeWidth, minGeneticScaleUnit, zoomLevel } = params;
    if (!treeWidthMinusPadding || !geneticTreeWidth || !minGeneticScaleUnit) {
      return [0, 0, 0];
    }
    const width = treeWidthMinusPadding / zoomLevel;

    let minNumLines = Math.floor(width / ConfigManager.instance.config.epiTree.MAX_SCALE_WIDTH_PX) + 1;
    let maxNumLines = Math.ceil(width / ConfigManager.instance.config.epiTree.MIN_SCALE_WIDTH_PX) + 1;

    if (geneticTreeWidth.div(minGeneticScaleUnit).add(1).lessThan(maxNumLines)) {
      maxNumLines = Math.max(geneticTreeWidth.div(minGeneticScaleUnit).ceil().toNumber(), 2);
    }
    if (minNumLines > maxNumLines) {
      minNumLines = maxNumLines;
    }
    if (maxNumLines === 2) {
      return [2, minGeneticScaleUnit, minGeneticScaleUnit];
    }

    const geneticTreeWidthDecimal = new Decimal(geneticTreeWidth);
    const multiplier = new Decimal(10).pow(geneticTreeWidthDecimal.log(10).floor().minus(1));
    const multipliedIncrements = ConfigManager.instance.config.epiTree.SCALE_INCREMENTS.map(i => new Decimal(i).times(multiplier));

    let bestCombination: [Decimal, Decimal, Decimal] = [new Decimal(0), new Decimal(0), new Decimal(Infinity)];

    for (let numLines = minNumLines; numLines <= maxNumLines; numLines++) {
      for (const increment of multipliedIncrements) {
        if (increment.lt(minGeneticScaleUnit)) {
          continue;
        }
        const product = increment.times(numLines);
        const leftover = product.minus(geneticTreeWidthDecimal).abs();
        if (leftover.lt(bestCombination[2])) {
          bestCombination = [Decimal(numLines), increment, leftover];
        }
      }
    }

    return [bestCombination[0].add(1).toNumber(), bestCombination[1].toNumber(), minGeneticScaleUnit];
  }

  public static assembleTree(rootNode: TreeNode, treeCanvasWidth: number, pixelToGeneticDistanceRatio: number): TreeAssembly {
    let leafIndex = 0;
    const treeAssembly: TreeAssembly = {
      verticalAncestorTreeLines: [],
      horizontalAncestorTreeLines: [],
      ancestorNodes: [],
      leafNodes: [],
      leafTreeLines: [],
      supportLines: [],
      distanceTexts: [],
      nodePathPropertiesMap: new Map(),
      horizontalLinePathPropertiesMap: new Map(),
      verticalLinePathPropertiesMap: new Map(),
    };

    const treeAssemblyContext: TreeAssemblyContext = {
      treeAssembly,
      treeCanvasWidth,
      pixelToGeneticDistanceRatio,
      rootNode,
    };

    const traverseTree = (node: TreeNode, distance = 0): NodeAssemblyResult => {
      if (!node) {
        return;
      }
      const nodeRenderResults: NodeAssemblyResult[] = [];
      node.children?.forEach(child => {
        nodeRenderResults.push(traverseTree(child, distance + (node.branchLength?.toNumber() ?? 0)));
      });

      if (!node.children?.length) {
        const result = EpiTreeUtil.assembleLeafNode(treeAssemblyContext, node, distance, leafIndex);
        leafIndex++;
        return result;
      }

      return EpiTreeUtil.assembleAncestorNode(treeAssemblyContext, node, nodeRenderResults);
    };

    traverseTree(rootNode);

    return treeAssembly;
  }

  private static assembleLeafNode(treeAssemblyContext: TreeAssemblyContext, node: TreeNode, distance = 0, leafIndex = 0): NodeAssemblyResult {
    const leafX = (distance ?? 0) + (node.branchLength?.toNumber() ?? 0);
    const leafXPxEnd = leafX * treeAssemblyContext.pixelToGeneticDistanceRatio + ConfigManager.instance.config.epiTree.TREE_PADDING;
    const leafYPx = ((leafIndex) * ConfigManager.instance.config.epiLineList.TABLE_ROW_HEIGHT) + (ConfigManager.instance.config.epiLineList.TABLE_ROW_HEIGHT / 2);
    const leafXPxDistance = (node.branchLength?.toNumber() ?? 0) * treeAssemblyContext.pixelToGeneticDistanceRatio;
    const leafXPxStart = leafXPxEnd - leafXPxDistance;
    const label = EpiTreeUtil.getDistanceLabel(treeAssemblyContext, node.branchLength);

    // add horizontal line according to distance
    const horizontalLineAccordingToDistancePath = new Path2D();
    horizontalLineAccordingToDistancePath.moveTo(leafXPxStart - 0.5, leafYPx);
    horizontalLineAccordingToDistancePath.lineTo(leafXPxEnd, leafYPx);
    horizontalLineAccordingToDistancePath.closePath();
    treeAssemblyContext.treeAssembly.leafTreeLines.push({ nodeName: node.name, shape: horizontalLineAccordingToDistancePath });
    treeAssemblyContext.treeAssembly.horizontalLinePathPropertiesMap.set(horizontalLineAccordingToDistancePath, {
      subTreeLeaveNames: node.subTreeLeaveNames,
    });

    // add distance text
    if (label) {
      treeAssemblyContext.treeAssembly.distanceTexts.push({ nodeNames: [node.name], x: (leafXPxStart + leafXPxEnd) / 2, y: leafYPx + 12, text: label });
    }
    // add horizontal support line to max width
    treeAssemblyContext.treeAssembly.supportLines.push({ nodeName: node.name, fromX: leafXPxEnd, toX: treeAssemblyContext.treeCanvasWidth, y: leafYPx });

    // add a dot to represent the node
    const circlePath = new Path2D();
    circlePath.arc(leafXPxEnd, leafYPx, ConfigManager.instance.config.epiTree.LEAF_DOT_RADIUS, 0, 2 * Math.PI, false);
    circlePath.closePath();

    treeAssemblyContext.treeAssembly.nodePathPropertiesMap.set(circlePath, {
      subTreeLeaveNames: node.subTreeLeaveNames,
      treeNode: node,
    });
    treeAssemblyContext.treeAssembly.leafNodes.push({ nodeName: node.name, shape: circlePath });

    return {
      x: leafXPxStart,
      y: leafYPx,
      caseIds: [node.name],
    };
  }

  private static assembleAncestorNode(treeAssemblyContext: TreeAssemblyContext, node: TreeNode, childRenderResults: NodeAssemblyResult[]): NodeAssemblyResult {
    const firstChild = first(childRenderResults);
    const lastChild = last(childRenderResults);

    const ancestorXPxEnd = firstChild.x;
    const ancestorXPxDistance = (node.branchLength?.toNumber() ?? 0) * treeAssemblyContext.pixelToGeneticDistanceRatio;
    const ancestorXPxStart = ancestorXPxEnd - ancestorXPxDistance;
    const ancestorYPx = (firstChild.y + lastChild.y) / 2;
    const caseIds = childRenderResults.map(r => r.caseIds).flat();
    const label = EpiTreeUtil.getDistanceLabel(treeAssemblyContext, node.branchLength);

    const centerToTopChildRenderResults = childRenderResults.filter(c => c.y < ancestorYPx).sort((a, b) => a.y - b.y);
    const centerToBottomChildRenderResults = childRenderResults.filter(c => c.y > ancestorYPx).sort((a, b) => b.y - a.y);

    [centerToTopChildRenderResults, centerToBottomChildRenderResults].forEach(sortedChildRenderResults => {
      const chunkCaseIds: string[] = [];

      sortedChildRenderResults.forEach((childRenderResult, index) => {
        const lineToYPx = index === sortedChildRenderResults.length - 1 ? ancestorYPx : sortedChildRenderResults[index + 1].y;
        chunkCaseIds.push(...childRenderResult.caseIds);

        const chunkPath = new Path2D();
        chunkPath.moveTo(childRenderResult.x, childRenderResult.y);
        chunkPath.lineTo(childRenderResult.x, lineToYPx);
        chunkPath.closePath();
        treeAssemblyContext.treeAssembly.verticalAncestorTreeLines.push({ nodeNames: [...chunkCaseIds], shape: chunkPath });
        treeAssemblyContext.treeAssembly.verticalLinePathPropertiesMap.set(chunkPath, {
          subTreeLeaveNames: chunkCaseIds,
        });
      });
    });

    // add horizontal line according to distance
    const horizontalLineAccordingToDistancePath = new Path2D();
    horizontalLineAccordingToDistancePath.moveTo(ancestorXPxStart - 0.5, ancestorYPx);
    horizontalLineAccordingToDistancePath.lineTo(ancestorXPxEnd + 0.5, ancestorYPx);
    horizontalLineAccordingToDistancePath.closePath();
    treeAssemblyContext.treeAssembly.horizontalAncestorTreeLines.push({ nodeNames: [node.name, ...caseIds], shape: horizontalLineAccordingToDistancePath });
    treeAssemblyContext.treeAssembly.horizontalLinePathPropertiesMap.set(horizontalLineAccordingToDistancePath, {
      subTreeLeaveNames: caseIds,
    });

    // add distance text
    if (label) {
      treeAssemblyContext.treeAssembly.distanceTexts.push({ nodeNames: [node.name, ...caseIds], x: (ancestorXPxStart + ancestorXPxEnd) / 2, y: ancestorYPx + 12, text: label });
    }

    if (node.children.every(child => (child.branchLength?.toNumber() ?? 0) > 0)) {
      // add circle at beginning of the line representing the node itself
      const circlePath = new Path2D();
      circlePath.arc(ancestorXPxEnd, ancestorYPx, ConfigManager.instance.config.epiTree.ANCESTOR_DOT_RADIUS, 0, 2 * Math.PI, false);
      treeAssemblyContext.treeAssembly.ancestorNodes.push({ nodeNames: [node.name, ...caseIds], shape: circlePath });
      treeAssemblyContext.treeAssembly.nodePathPropertiesMap.set(circlePath, {
        subTreeLeaveNames: node.subTreeLeaveNames,
        treeNode: node,
      });
    }

    return {
      x: ancestorXPxStart,
      y: ancestorYPx,
      caseIds,
    };
  }

  private static getDistanceLabel(treeAssemblyContext: TreeAssemblyContext, branchLength: Decimal): string {
    const labelPrecision = treeAssemblyContext.rootNode?.maxBranchLength ? Math.max(1, 4 - String(Math.round(treeAssemblyContext.rootNode.maxBranchLength.toNumber())).length) : null;
    if (!treeAssemblyContext.rootNode.maxBranchLength || treeAssemblyContext.rootNode.maxBranchLength.toNumber() === 0 || !branchLength || (branchLength?.toNumber() ?? 0) === 0) {
      return null;
    }
    if (branchLength.div(treeAssemblyContext.rootNode.maxBranchLength).mul(100).lessThan(ConfigManager.instance.config.epiTree.MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL)) {
      return null;
    }
    return String(round(branchLength?.toNumber() ?? 0, labelPrecision));
  }

  public static drawTree(params: {
    canvas: HTMLCanvasElement;
    theme: Theme;
    treeAssembly: TreeAssembly;
    stratification: Stratification;
    zoomLevel: number;
    highlightedNodeNames: string[];
    verticalScrollPosition: number;
    horizontalScrollPosition: number;
    shouldShowDistances: boolean;
    devicePixelRatio: number;
    isLinked: boolean;
  }): void {
    const { canvas, theme, treeAssembly, stratification, zoomLevel, isLinked, verticalScrollPosition, horizontalScrollPosition, shouldShowDistances, devicePixelRatio, highlightedNodeNames = [] } = params;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(
      (1 / zoomLevel) * devicePixelRatio, // The scale factor(X direction)
      0, // The skew factor (X-axis)
      0, // The skew factor (Y-axis)
      (1 / zoomLevel) * devicePixelRatio, // The scale factor(Y direction)
      -horizontalScrollPosition + 0.5, // The translation (X direction)
      -verticalScrollPosition + 0.5, // The translation (Y direction)
    );

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.textAlign = 'center';
    ctx.font = theme['gen-epix'].tree.font;
    ctx.lineWidth = 1;

    treeAssembly.verticalAncestorTreeLines.forEach(({ shape, nodeNames }) => {
      ctx.strokeStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeNames);
      ctx.stroke(shape);
    });
    treeAssembly.horizontalAncestorTreeLines.forEach(({ shape, nodeNames }) => {
      ctx.strokeStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeNames);
      ctx.stroke(shape);
    });

    if (isLinked) {
      treeAssembly.supportLines.forEach(({ nodeName, fromX, toX, y }) => {
        ctx.setLineDash([1, 4]);
        ctx.beginPath();
        ctx.strokeStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeName);
        ctx.moveTo(fromX, y);
        ctx.lineTo(toX + (horizontalScrollPosition / devicePixelRatio), y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    if (shouldShowDistances) {
      treeAssembly.distanceTexts.forEach(({ x, y, text, nodeNames }) => {
        const isHighlighted = highlightedNodeNames.length && intersection(nodeNames, highlightedNodeNames).length > 0;
        if (isHighlighted) {
          ctx.fillStyle = theme['gen-epix'].tree.color;
          ctx.fillText(text, x, y);
        }
      });
    }

    treeAssembly.ancestorNodes.forEach(({ shape, nodeNames }) => {
      ctx.fillStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeNames);
      ctx.fill(shape);
    });

    treeAssembly.leafTreeLines.forEach(({ shape, nodeName }) => {
      ctx.strokeStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeName);
      ctx.stroke(shape);
    });

    treeAssembly.leafNodes.forEach(({ shape, nodeName }) => {
      ctx.fillStyle = EpiTreeUtil.getFillStyle(stratification?.caseIdColors?.[nodeName] ?? theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeName);
      ctx.fill(shape);
    });
  }

  private static getFillStyle(color: string, dimFn: (color: string) => string, highlightedNodeNames: string[], nodeNames: string | string[]): string {
    if (highlightedNodeNames.length) {
      let isHighlighted = false;
      if (Array.isArray(nodeNames)) {
        isHighlighted = intersection(nodeNames, highlightedNodeNames).length > 0;
      } else {
        isHighlighted = highlightedNodeNames.includes(nodeNames);
      }
      if (isHighlighted) {
        return color;
      }
      return dimFn(color);
    }
    return color;
  }

  public static drawTreeCanvas(params: {
    canvas: HTMLCanvasElement;
    theme: Theme;
    treeAssembly: TreeAssembly;
    stratification: Stratification;
    zoomLevel: number;
    isLinked: boolean;
    highlightedNodeNames?: string[];
    verticalScrollPosition: number;
    horizontalScrollPosition: number;
    treeCanvasWidth: number;
    treeCanvasHeight: number;
    pixelToGeneticDistanceRatio: number;
    tickerMarkScale: TickerMarkScale;
    shouldShowDistances: boolean;
    devicePixelRatio: number;
    geneticTreeWidth: Decimal;
  }): void {
    const { devicePixelRatio, geneticTreeWidth, canvas, theme, treeAssembly, stratification, zoomLevel, isLinked, highlightedNodeNames, horizontalScrollPosition, verticalScrollPosition, treeCanvasWidth, treeCanvasHeight, tickerMarkScale, pixelToGeneticDistanceRatio, shouldShowDistances } = params;
    const ctx = canvas.getContext('2d');
    ctx.reset();
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.imageSmoothingEnabled = zoomLevel > 1;
    ctx.imageSmoothingQuality = 'high';

    EpiTreeUtil.drawBackground({ canvas, theme, treeCanvasWidth, treeCanvasHeight, devicePixelRatio });
    EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, devicePixelRatio, horizontalScrollPosition, zoomLevel });
    EpiTreeUtil.drawTree({ canvas, theme, treeAssembly, stratification, highlightedNodeNames, zoomLevel, isLinked, horizontalScrollPosition, verticalScrollPosition, shouldShowDistances, devicePixelRatio });
  }

  public static drawBackground(params: { canvas: HTMLCanvasElement; theme: Theme; treeCanvasWidth: number; treeCanvasHeight: number; devicePixelRatio: number }): void {
    const { canvas, theme, treeCanvasWidth, treeCanvasHeight, devicePixelRatio } = params;
    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fillRect(0, 0, treeCanvasWidth, treeCanvasHeight);
    });
  }

  public static forEachScaleLine(params: { tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; zoomLevel: number; devicePixelRatio: number; horizontalScrollPosition?: number; callback: (x: number, i: number, numberOfLines: number) => void }): void {
    const { tickerMarkScale, geneticTreeWidth, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, horizontalScrollPosition = 0, callback } = params;

    const numberOfLines = tickerMarkScale[0];
    const tickerGeneticWidth = tickerMarkScale[1];
    const tickerWidth = new Decimal(tickerGeneticWidth).times(pixelToGeneticDistanceRatio).div(zoomLevel);
    const totalTickerWidth = tickerWidth.times(numberOfLines - 1);
    const geneticTreeWidthPx = geneticTreeWidth.times(pixelToGeneticDistanceRatio).div(zoomLevel);
    const offset = totalTickerWidth.minus(geneticTreeWidthPx);

    for (let i = 0; i < numberOfLines; i++) {
      const x = new Decimal(i).times(tickerWidth).plus(new Decimal(ConfigManager.instance.config.epiTree.TREE_PADDING).div(zoomLevel)).minus(offset).minus(new Decimal(horizontalScrollPosition).div(devicePixelRatio)).toNumber();
      callback(x, i, numberOfLines);
    }
  }

  public static drawGuides(params: { canvas: HTMLCanvasElement; tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; devicePixelRatio: number; paddingTop?: number; paddingBottom?: number; zoomLevel: number; horizontalScrollPosition: number }): void {
    const { canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, paddingTop = 0, paddingBottom = 0, horizontalScrollPosition = 0 } = params;

    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.strokeStyle = ConfigManager.instance.config.epiTree.REGULAR_FILL_COLOR_SUPPORT_LINE;
      ctx.setLineDash([3, 1]);
      EpiTreeUtil.forEachScaleLine({
        tickerMarkScale,
        geneticTreeWidth,
        pixelToGeneticDistanceRatio,
        zoomLevel,
        devicePixelRatio,
        horizontalScrollPosition,
        callback: (x) => {
          // Draw the guide lines
          ctx.beginPath();
          ctx.moveTo(x, paddingTop);
          ctx.lineTo(x, canvas.height - paddingBottom);
          ctx.stroke();
          ctx.closePath();
        },
      });
      ctx.setLineDash([0, 0]);
    });
  }

  public static drawScale(params: { canvas: HTMLCanvasElement; theme: Theme; tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; zoomLevel: number; devicePixelRatio: number; horizontalScrollPosition: number }): void {
    const { canvas, theme, tickerMarkScale, geneticTreeWidth, pixelToGeneticDistanceRatio, devicePixelRatio, zoomLevel, horizontalScrollPosition = 0 } = params;
    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      EpiTreeUtil.forEachScaleLine({
        tickerMarkScale,
        geneticTreeWidth,
        pixelToGeneticDistanceRatio,
        zoomLevel,
        devicePixelRatio,
        horizontalScrollPosition,
        callback: (x, i, numberOfLines) => {
          ctx.beginPath();
          ctx.textAlign = 'center';
          ctx.font = `bold 11px ${theme.typography.fontFamily}`;
          const label = new Decimal(tickerMarkScale[1]).times((numberOfLines - 1) - i).toNumber();
          ctx.fillText(NumberUtil.toStringWithPrecision(label, tickerMarkScale[2]), x, ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.61);
          ctx.closePath();
        },
      });
    });
  }

  public static drawDivider(params: { canvas: HTMLCanvasElement; y: number; devicePixelRatio: number }): void {
    const { canvas, y, devicePixelRatio } = params;

    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.strokeStyle = '#EEEEEE';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
  }

  private static draw(canvas: HTMLCanvasElement, devicePixelRatio: number, callback: (ctx: CanvasRenderingContext2D) => void): void {
    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.translate(0.5, 0.5);
    callback(ctx);
    ctx.translate(-0.5, -0.5);
    ctx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
  }

  public static getNewScrollPositionForZoomLevel(params: { eventOffset: number; scrollPosition: number; dimensionSize: number; currentZoomLevel: number; newZoomLevel: number }): number {
    const { eventOffset, scrollPosition, dimensionSize, currentZoomLevel, newZoomLevel } = params;

    const fullSizeTreePosition = ((eventOffset * devicePixelRatio) + scrollPosition) * currentZoomLevel;
    const currentSizeTreePosition = fullSizeTreePosition / (dimensionSize / (dimensionSize / currentZoomLevel));
    const newSizeTreePosition = fullSizeTreePosition / (dimensionSize / (dimensionSize / newZoomLevel));
    return scrollPosition - (currentSizeTreePosition - newSizeTreePosition);
  }

  public static getSanitizedScrollPosition(params: { positionX: number; positionY: number; treeCanvasWidth: number; treeCanvasHeight: number; treeHeight: number; devicePixelRatio: number; internalZoomLevel: number; isLinked: boolean }): { newPositionX: number; newPositionY: number } {
    const { positionX, positionY, treeCanvasWidth, treeCanvasHeight, treeHeight, devicePixelRatio, internalZoomLevel, isLinked } = params;
    let positionYMax: number;
    let positionYMin: number;

    const relativeTreePadding = ((ConfigManager.instance.config.epiTree.TREE_PADDING) * devicePixelRatio);

    if (isLinked && internalZoomLevel === 1) {
      if (treeHeight < treeCanvasHeight) {
        positionYMin = 0;
        positionYMax = 0;
      } else {
        // some magic needs to be done here to prevent the tree from scrolling too far. I can't detect the exact reason, but it seems to be related to the devicePixelRatio
        // this only happens when you use the zoom functionality of the browser
        const roundedDevicePixelRatio = Math.round(devicePixelRatio * 100) / 100;
        const thresholds = [
          [1, 0],
          [1.1, 1],
          [1.25, 4],
          [1.5, 7],
          [1.75, 11],
          [2, 0],
          [2.2, 4],
          [2.5, 7],
          [3, 15],
        ];
        const divePixelRatioOffset = thresholds.find(([threshold]) => roundedDevicePixelRatio <= threshold)?.[1] ?? 0;

        positionYMin = 0;
        positionYMax = (treeHeight * devicePixelRatio) - ((treeCanvasHeight) * devicePixelRatio) - divePixelRatioOffset;
      }
    } else {
      positionYMin = (-treeCanvasHeight * devicePixelRatio) + relativeTreePadding + (ConfigManager.instance.config.epiTree.HEADER_HEIGHT * devicePixelRatio);
      positionYMax = ((treeHeight / internalZoomLevel) * devicePixelRatio) - relativeTreePadding - (ConfigManager.instance.config.epiTree.HEADER_HEIGHT * devicePixelRatio);
    }
    const newPositionY = Math.max(Math.min(positionYMax, positionY), positionYMin);

    const positionXMin = -treeCanvasWidth + (2 * relativeTreePadding);
    const positionXMax = ((treeCanvasWidth / internalZoomLevel) * devicePixelRatio) - (2 * relativeTreePadding);
    const newPositionX = Math.max(Math.min(positionXMax, positionX), positionXMin);

    return {
      newPositionX,
      newPositionY,
    };
  }

  public static getPathPropertiesFromCanvas(params: { canvas: HTMLCanvasElement; event: MouseEvent; treeAssembly: TreeAssembly; devicePixelRatio: number }): TreePathProperties {
    const { canvas, event, treeAssembly, devicePixelRatio } = params;

    const ctx = canvas.getContext('2d');
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * devicePixelRatio;
    const canvasY = (event.clientY - rect.top) * devicePixelRatio;

    for (const path of treeAssembly?.nodePathPropertiesMap?.keys() ?? []) {
      if (ctx.isPointInPath(path, canvasX, canvasY)) {
        return treeAssembly.nodePathPropertiesMap.get(path);
      }
    }

    // Allow for a 1px vertical margin around the mouse position to allow for easier clicking
    const canvasYs = [
      ((event.clientY - 1) - rect.top) * devicePixelRatio,
      canvasY,
      ((event.clientY + 1) - rect.top) * devicePixelRatio,
    ];

    for (const path of treeAssembly?.horizontalLinePathPropertiesMap?.keys() ?? []) {
      for (const y of canvasYs) {
        if (ctx.isPointInStroke(path, canvasX, y)) {
          return treeAssembly.horizontalLinePathPropertiesMap.get(path);
        }
      }
    }

    // Allow for a 1px horizontal margin around the mouse position to allow for easier clicking
    const canvasXs = [
      ((event.clientX - 1) - rect.left) * devicePixelRatio,
      canvasX,
      ((event.clientX + 1) - rect.left) * devicePixelRatio,
    ];
    for (const path of treeAssembly?.verticalLinePathPropertiesMap?.keys() ?? []) {
      for (const x of canvasXs) {
        if (ctx.isPointInStroke(path, x, canvasY)) {
          return treeAssembly.verticalLinePathPropertiesMap.get(path);
        }
      }
    }
  }


  public static getTreeConfigurations(completeCaseType: CompleteCaseType): TreeConfiguration[] {
    const treeConfigurations: TreeConfiguration[] = [];

    const geneticDistanceCaseTypeCols = Object.values(completeCaseType.case_type_cols).filter(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      return col.col_type === ColType.GENETIC_DISTANCE;
    });

    const sortedTreeAlgorithmCodes = EpiDataManager.instance.data.treeAlgorithms.map(x => x.code);

    geneticDistanceCaseTypeCols.forEach(caseTypeCol => {
      const col = completeCaseType.cols[caseTypeCol.col_id];
      if (col.col_type !== ColType.GENETIC_DISTANCE) {
        return;
      }
      const geneticDistanceProtocol = completeCaseType.genetic_distance_protocols[col.genetic_distance_protocol_id];
      const treeAlgorithms = [...caseTypeCol.tree_algorithm_codes].sort((a, b) => {
        return sortedTreeAlgorithmCodes.indexOf(a) - sortedTreeAlgorithmCodes.indexOf(b);
      }).map(treeAlgorithmCode => completeCaseType.tree_algorithms[treeAlgorithmCode]);

      treeAlgorithms.forEach(treeAlgorithm => {
        treeConfigurations.push({
          computedId: EpiTreeUtil.getTreeConfigurationId({ caseTypeCol, col, geneticDistanceProtocol, treeAlgorithm }),
          caseTypeCol,
          col,
          geneticDistanceProtocol,
          treeAlgorithm,
        });
      });
    });

    return treeConfigurations;
  }

  public static getTreeConfigurationId(treeConfiguration: Omit<TreeConfiguration, 'computedId'>): string {
    return `${treeConfiguration.caseTypeCol.id}_${treeConfiguration.col.id}_${treeConfiguration.geneticDistanceProtocol.id}_${treeConfiguration.treeAlgorithm.id}`;
  }
}
