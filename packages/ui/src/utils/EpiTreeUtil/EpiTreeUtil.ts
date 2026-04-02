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
  TreeAssembly,
  TreeNode,
  TreePathProperties,
} from '../../models/tree';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

type SanitizeResult = { node: TreeNode; nodesToMove: TreeNode[] };

type TreeAssemblyContext = {
  rootNode: TreeNode;
  treeCanvasWidth: number;
  treeAssembly: TreeAssembly;
  pixelToGeneticDistanceRatio: number;
  itemHeight: number;
};

type NodeAssemblyResult = {
  x: number;
  y: number;
  caseIds: string[];
};

// [number of lines to draw, genetic distance of single line, minGeneticScaleUnit]
type TickerMarkScale = [number, number, number];

export class EpiTreeUtil {
  /**
   * Calculates the vertical scroll position for a tree canvas based on the
   * currently visible rows in a linked table/list view.
   *
   * The goal is to keep the visible portion of the tree centered on the same
   * items that are currently visible in the linked view, accounting for zoom.
   *
   * @param kwArgs.treeCanvasHeight - Height of the visible tree canvas area in pixels.
   * @param kwArgs.treeHeight - Total rendered height of the full tree in pixels.
   * @param kwArgs.treeSize - Total number of leaf items (rows) in the tree.
   * @param kwArgs.verticalScrollPosition - Current vertical scroll position of the linked view in pixels.
   * @param kwArgs.zoomLevel - Current zoom level (>1 means zoomed out, items appear smaller).
   * @returns The new vertical scroll position for the tree canvas, clamped to [0, treeHeight - treeCanvasHeight].
   */
  public static getScrollPositionFromTreeVisibility(kwArgs: {
    treeCanvasHeight: number;
    treeHeight: number;
    treeSize: number;
    verticalScrollPosition: number;
    zoomLevel: number;
    itemHeight: number;
  }): number {
    const { treeCanvasHeight, treeHeight, verticalScrollPosition, zoomLevel, treeSize, itemHeight } = kwArgs;

    const scaledItemHeight = itemHeight / zoomLevel;
    const scrolledByItems = Math.round(verticalScrollPosition / scaledItemHeight);
    const maxItemsInView = Math.round(treeCanvasHeight / scaledItemHeight);

    const firstItemInView = Math.max(0, scrolledByItems);
    const lastItemInView = Math.min(scrolledByItems + maxItemsInView, treeSize);
    const averageItemInView = (firstItemInView + lastItemInView) / 2;

    const newScrollPosition = Math.max(0, Math.min(treeHeight - treeCanvasHeight, averageItemInView * itemHeight - treeCanvasHeight / 2));
    return newScrollPosition;
  }


  /**
   * Sanitizes the tree by collapsing intermediate ancestor nodes that have a
   * zero branch length, hoisting their children up to the parent level.
   *
   * This normalises Newick-parsed trees where polytomies or zero-distance
   * internal nodes would otherwise produce visually redundant branching points.
   *
   * @param rootNode - The root of the tree to sanitize. Mutated in place.
   * @returns The sanitized root node.
   */
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
          if ((node.branchLength?.toNumber() ?? 0) === 0) {
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

  /**
   * Assigns a dot-notation address to every node in the tree, representing its
   * position in the hierarchy (e.g. `"1.2.1"`). Zero-branch-length children are
   * always placed at index `1`; other children are indexed starting at `1` or
   * `2` depending on whether a zero-branch sibling is present.
   *
   * @param rootNode - The root of the tree to address.
   * @returns A map from node name to its dot-notation address string.
   */
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

  /**
   * Finds and returns a new root node for re-rooting the tree.
   *
   * When `selector` is `'node'`, the node with the given name becomes the new root.
   * When `selector` is `'parent'`, the parent of the node with the given name is returned.
   *
   * The returned node has its `branchLength` reset to `0` and its `maxBranchLength`
   * adjusted by subtracting the original branch length, so the scale remains consistent.
   *
   * @param rootNode - The current root of the tree.
   * @param nodeName - Name of the node to search for.
   * @param selector - Whether to return the matching node itself (`'node'`) or its parent (`'parent'`).
   * @returns A shallow copy of the new root with adjusted branch length properties.
   */
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

  /**
   * Finds the smallest non-zero branch length among all leaf nodes in the tree.
   *
   * This value is used as the minimum scale unit when computing tick mark
   * intervals, ensuring the scale never subdivides below a single measurable step.
   *
   * @param tree - The root node of the tree to inspect.
   * @returns The minimum positive branch length found on any leaf, or `Infinity`
   *   if the tree is empty or all leaves have zero/undefined branch lengths.
   */
  public static getMinGeneticScaleUnit(tree: TreeNode): number {
    if (!tree) {
      return Infinity;
    }
    let min: number = Infinity;
    const traverse = (node: TreeNode) => {
      const branchLength = node.branchLength?.toNumber() ?? 0;
      if (!node.children?.length && branchLength && branchLength < min) {
        min = branchLength;
      }
      node?.children?.forEach(child => traverse(child));
    };
    traverse(tree);
    return min;
  }

  /**
   * Determines the optimal tick mark scale for the genetic distance axis.
   *
   * Selects the number of scale lines and the genetic distance represented by
   * each interval by searching for the combination with the least leftover
   * (i.e. the product of `numLines × increment` closest to `geneticTreeWidth`).
   * Increments are drawn from `SCALE_INCREMENTS` scaled by an order-of-magnitude
   * multiplier derived from `geneticTreeWidth`, and those smaller than
   * `minGeneticScaleUnit` are skipped.
   *
   * @param params.treeWidthMinusPadding - Width of the drawable canvas area in pixels (excluding padding).
   * @param params.geneticTreeWidth - Total genetic distance represented by the full tree width.
   * @param params.minGeneticScaleUnit - The smallest meaningful genetic distance unit (see {@link getMinGeneticScaleUnit}).
   * @param params.zoomLevel - Current zoom level; divides the effective pixel width.
   * @returns A {@link TickerMarkScale} tuple: `[numberOfLines, geneticDistancePerLine, minGeneticScaleUnit]`.
   *   Returns `[0, 0, 0]` when any required input is falsy.
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

  /**
   * Traverses the tree and produces a {@link TreeAssembly} containing all
   * pre-computed `Path2D` shapes and metadata needed to render the tree.
   *
   * Leaf nodes are assembled in DFS order (incrementing `leafIndex`), which
   * determines their vertical position. Ancestor nodes are positioned vertically
   * at the midpoint of their first and last child.
   *
   * @param params.rootNode - The root of the tree to assemble.
   * @param params.treeCanvasWidth - Width of the tree canvas in pixels, used for support lines.
   * @param params.pixelToGeneticDistanceRatio - Pixels per unit of genetic distance.
   * @param params.itemHeight - Height of each row/item in pixels.
   * @param params.externalLeafSorting - Custom sorting order of leaf nodes by name, derived from external ordering (e.g. table row order). Must contain all leaf node names.
   * @returns A fully populated {@link TreeAssembly} ready for rendering.
   */
  public static assembleTree(params: { rootNode: TreeNode; treeCanvasWidth: number; pixelToGeneticDistanceRatio: number; itemHeight: number; externalLeafSorting: string[] }): TreeAssembly {
    const { rootNode, treeCanvasWidth, pixelToGeneticDistanceRatio, itemHeight, externalLeafSorting } = params;
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
      itemHeight,
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
        const result = EpiTreeUtil.assembleLeafNode(treeAssemblyContext, node, distance, leafIndex, externalLeafSorting.indexOf(node.name));
        leafIndex++;
        return result;
      }

      return EpiTreeUtil.assembleAncestorNode(treeAssemblyContext, node, nodeRenderResults);
    };

    traverseTree(rootNode);

    return treeAssembly;
  }

  /**
   * Assembles the visual elements for a single leaf node and appends them to
   * the tree assembly.
   *
   * Produces: a horizontal branch line, an optional distance label, a dashed
   * support line extending to the canvas edge, and a filled dot.
   *
   * @param treeAssemblyContext - Shared context holding the assembly target and canvas dimensions.
   * @param node - The leaf tree node to assemble.
   * @param distance - Accumulated genetic distance from the root to the start of this node's branch.
   * @param leafIndex - Zero-based vertical index of this leaf, determining its Y position.
   * @param externalSortingIndex - External sorting index of this leaf derived from linked view order. Used to draw the support line.
   * @returns The pixel coordinates of the branch start and the node name, for use by the parent.
   */
  private static assembleLeafNode(treeAssemblyContext: TreeAssemblyContext, node: TreeNode, distance = 0, leafIndex = 0, externalSortingIndex = 0): NodeAssemblyResult {
    const leafX = distance + (node.branchLength?.toNumber() ?? 0);
    const leafXPxEnd = leafX * treeAssemblyContext.pixelToGeneticDistanceRatio + ConfigManager.instance.config.epiTree.TREE_PADDING;
    const leafYPx = ((leafIndex) * treeAssemblyContext.itemHeight) + (treeAssemblyContext.itemHeight / 2);
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
    const supportLineToYpx = externalSortingIndex * treeAssemblyContext.itemHeight + (treeAssemblyContext.itemHeight / 2);
    treeAssemblyContext.treeAssembly.supportLines.push({ nodeName: node.name, fromX: leafXPxEnd, toX: treeAssemblyContext.treeCanvasWidth, fromY: leafYPx, toY: supportLineToYpx });

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

  /**
   * Assembles the visual elements for an ancestor (internal) node and appends
   * them to the tree assembly.
   *
   * Produces: vertical connector lines from each child toward the ancestor's
   * Y midpoint (split into two sorted groups above and below center to allow
   * per-segment highlighting), a horizontal branch line, an optional distance
   * label, and a filled dot when all children have positive branch lengths.
   *
   * @param treeAssemblyContext - Shared context holding the assembly target and canvas dimensions.
   * @param node - The ancestor tree node to assemble.
   * @param childRenderResults - Assembly results returned by all direct children.
   * @returns The pixel coordinates of the branch start and aggregated case IDs, for use by the parent.
   */
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

  /**
   * Returns a formatted distance label string for a branch, or `null` if the
   * label should be suppressed.
   *
   * A label is suppressed when:
   * - The tree has no maximum branch length, or it is zero.
   * - The branch length is zero or undefined.
   * - The branch is shorter than `MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL`
   *   percent of the maximum branch length in the tree.
   *
   * Precision is derived from the magnitude of `maxBranchLength` to avoid
   * excessive decimal places for large values.
   *
   * @param treeAssemblyContext - Context containing the root node (for `maxBranchLength`).
   * @param branchLength - The genetic distance of the branch to label.
   * @returns A rounded numeric string, or `null` if the label should be hidden.
   */
  private static getDistanceLabel(treeAssemblyContext: TreeAssemblyContext, branchLength: Decimal): string {
    const labelPrecision = treeAssemblyContext.rootNode.maxBranchLength ? Math.max(1, 4 - String(Math.round(treeAssemblyContext.rootNode.maxBranchLength.toNumber())).length) : null;
    if (!treeAssemblyContext.rootNode.maxBranchLength || treeAssemblyContext.rootNode.maxBranchLength.toNumber() === 0 || !branchLength || branchLength.toNumber() === 0) {
      return null;
    }
    if (branchLength.div(treeAssemblyContext.rootNode.maxBranchLength).mul(100).lessThan(ConfigManager.instance.config.epiTree.MINIMUM_DISTANCE_PERCENTAGE_TO_SHOW_LABEL)) {
      return null;
    }
    return String(round(branchLength.toNumber(), labelPrecision));
  }

  /**
   * Renders the pre-assembled tree shapes onto a canvas using the 2D context.
   *
   * Applies a transform for zoom and scroll, then draws in order:
   * vertical ancestor lines → horizontal ancestor lines → (linked) support lines
   * → (highlighted) distance labels → ancestor dots → leaf branch lines → leaf dots.
   *
   * When nodes are highlighted, non-highlighted shapes are dimmed via the
   * theme's `dimFn`. Leaf dot colours come from the stratification's `caseIdColors`
   * when available.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.theme - MUI theme providing colours and font settings.
   * @param params.treeAssembly - Pre-computed tree shapes from {@link assembleTree}.
   * @param params.stratification - Colour mapping per case ID for leaf dots.
   * @param params.zoomLevel - Current zoom level applied as a canvas transform.
   * @param params.highlightedNodeNames - Node names to highlight; all others are dimmed.
   * @param params.verticalScrollPosition - Vertical scroll offset in pixels.
   * @param params.horizontalScrollPosition - Horizontal scroll offset in pixels.
   * @param params.shouldShowDistances - Whether to render branch distance labels.
   * @param params.devicePixelRatio - Screen DPR for crisp rendering on HiDPI displays.
   * @param params.isLinked - Whether to draw the dashed support lines linking leaf nodes to the table.
   */
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
    externalScrollPosition?: number;
    headerHeight?: number;
  }): void {
    const { canvas, theme, treeAssembly, stratification, zoomLevel, verticalScrollPosition, horizontalScrollPosition, shouldShowDistances, devicePixelRatio, isLinked, externalScrollPosition = 0, highlightedNodeNames = [], headerHeight = 0 } = params;
    const ctx = canvas.getContext('2d');
    const bodyStartY = headerHeight * devicePixelRatio;
    const setRegularTransform = () => {
      ctx.setTransform(
        (1 / zoomLevel) * devicePixelRatio, // The scale factor(X direction)
        0, // The skew factor (X-axis)
        0, // The skew factor (Y-axis)
        (1 / zoomLevel) * devicePixelRatio, // The scale factor(Y direction)
        -horizontalScrollPosition + 0.5, // The translation (X direction)
        -verticalScrollPosition + (headerHeight * devicePixelRatio) + 0.5, // The translation (Y direction)
      );
    };
    const setTransFormForSupportLine = () => {
      ctx.setTransform(
        devicePixelRatio, // The scale factor(X direction)
        0, // The skew factor (X-axis)
        0, // The skew factor (Y-axis)
        devicePixelRatio, // The scale factor(Y direction)
        -horizontalScrollPosition + 0.5, // The translation (X direction)
        (headerHeight * devicePixelRatio) + 0.5, // The translation (Y direction)
      );
    };
    const drawTreeElements = () => {
      setRegularTransform();

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

      treeAssembly.supportLines.forEach(({ nodeName, fromX, toX, fromY, toY }) => {
        if (isLinked) {
          ctx.setLineDash([1, 4]);
        } else {
          ctx.setLineDash([2, 2]);
        }
        ctx.beginPath();
        ctx.strokeStyle = EpiTreeUtil.getFillStyle(theme['gen-epix'].tree.color, theme['gen-epix'].tree.dimFn, highlightedNodeNames, nodeName);
        ctx.moveTo(fromX, fromY);
        setTransFormForSupportLine();
        ctx.lineTo(toX + (horizontalScrollPosition / devicePixelRatio), toY - externalScrollPosition);
        setRegularTransform();
        ctx.stroke();
        ctx.setLineDash([]);
      });

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
    };

    if (headerHeight > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.rect(0, bodyStartY, canvas.width, Math.max(0, canvas.height - bodyStartY));
      ctx.clip();
      drawTreeElements();
      ctx.restore();
      setRegularTransform();
      return;
    }

    drawTreeElements();
  }

  /**
   * Returns the fill/stroke colour for a shape, dimming it when highlighted
   * nodes are active and the shape is not among them.
   *
   * @param color - The full-brightness colour to use when highlighted or no highlight is active.
   * @param dimFn - A function that returns a dimmed version of the colour.
   * @param highlightedNodeNames - The currently highlighted node names.
   * @param nodeNames - The node name(s) associated with the shape being drawn.
   * @returns The resolved colour string.
   */
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

  /**
   * Fully redraws the tree canvas from scratch.
   *
   * Resets the canvas, resizes it to match its CSS layout size at the current
   * DPR, then sequentially calls {@link drawBackground}, {@link drawGuides},
   * and {@link drawTree}.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.theme - MUI theme used for colours and fonts.
   * @param params.treeAssembly - Pre-computed tree shapes from {@link assembleTree}.
   * @param params.stratification - Colour mapping per case ID.
   * @param params.zoomLevel - Current zoom level.
   * @param params.isLinked - Whether to draw dashed support lines.
   * @param params.highlightedNodeNames - Node names to highlight.
   * @param params.verticalScrollPosition - Vertical scroll offset in pixels.
   * @param params.horizontalScrollPosition - Horizontal scroll offset in pixels.
   * @param params.treeCanvasWidth - Logical canvas width in pixels.
   * @param params.treeCanvasHeight - Logical canvas height in pixels.
   * @param params.pixelToGeneticDistanceRatio - Pixels per unit of genetic distance.
   * @param params.tickerMarkScale - Scale tuple from {@link getTickMarkScale}.
   * @param params.shouldShowDistances - Whether to render branch labels.
   * @param params.devicePixelRatio - Screen DPR for HiDPI rendering.
   * @param params.geneticTreeWidth - Total genetic width of the tree, used for guide lines.
   */
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
    headerHeight?: number;
    pixelToGeneticDistanceRatio: number;
    tickerMarkScale: TickerMarkScale;
    shouldShowDistances: boolean;
    devicePixelRatio: number;
    geneticTreeWidth: Decimal;
    externalScrollPosition?: number;
  }): void {
    const { devicePixelRatio, geneticTreeWidth, canvas, theme, treeAssembly, stratification, zoomLevel, isLinked, highlightedNodeNames, horizontalScrollPosition, verticalScrollPosition, treeCanvasWidth, treeCanvasHeight, headerHeight = 0, tickerMarkScale, pixelToGeneticDistanceRatio, shouldShowDistances, externalScrollPosition = 0 } = params;
    const ctx = canvas.getContext('2d');
    ctx.reset();
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.imageSmoothingEnabled = zoomLevel > 1;
    ctx.imageSmoothingQuality = 'high';

    EpiTreeUtil.drawBackground({ canvas, theme, treeCanvasWidth, treeCanvasHeight: treeCanvasHeight + headerHeight, devicePixelRatio });
    EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, devicePixelRatio, horizontalScrollPosition, zoomLevel, startY: headerHeight, endY: headerHeight + treeCanvasHeight });

    if (headerHeight > 0) {
      EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, devicePixelRatio, horizontalScrollPosition, zoomLevel, startY: headerHeight * 0.7, endY: headerHeight });
      EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, devicePixelRatio, horizontalScrollPosition, zoomLevel, startY: 0, endY: headerHeight * 0.3 });
      EpiTreeUtil.drawScale({ canvas, theme, tickerMarkScale, geneticTreeWidth, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, horizontalScrollPosition });
      EpiTreeUtil.drawDivider({ canvas, y: 0, devicePixelRatio });
      EpiTreeUtil.drawDivider({ canvas, y: headerHeight - 1, devicePixelRatio });
    }

    EpiTreeUtil.drawTree({ canvas, theme, treeAssembly, stratification, highlightedNodeNames, zoomLevel, isLinked, horizontalScrollPosition, verticalScrollPosition, shouldShowDistances, devicePixelRatio, externalScrollPosition, headerHeight });
  }

  /**
   * Fills the tree canvas background with the theme's paper colour.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.theme - MUI theme providing the background colour.
   * @param params.treeCanvasWidth - Width of the area to fill in pixels.
   * @param params.treeCanvasHeight - Height of the area to fill in pixels.
   * @param params.devicePixelRatio - Screen DPR for HiDPI rendering.
   */
  private static drawBackground(params: { canvas: HTMLCanvasElement; theme: Theme; treeCanvasWidth: number; treeCanvasHeight: number; devicePixelRatio: number }): void {
    const { canvas, theme, treeCanvasWidth, treeCanvasHeight, devicePixelRatio } = params;
    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fillRect(0, 0, treeCanvasWidth, treeCanvasHeight);
    });
  }

  /**
   * Iterates over each scale line position and invokes a callback with its
   * canvas X coordinate.
   *
   * Computes the pixel offset for each tick so that the rightmost line aligns
   * with the genetic tree width, accounting for the current scroll and zoom.
   *
   * @param params.tickerMarkScale - Scale tuple from {@link getTickMarkScale}.
   * @param params.geneticTreeWidth - Total genetic width of the tree.
   * @param params.pixelToGeneticDistanceRatio - Pixels per unit of genetic distance.
   * @param params.zoomLevel - Current zoom level.
   * @param params.devicePixelRatio - Screen DPR.
   * @param params.horizontalScrollPosition - Current horizontal scroll offset in pixels (default 0).
   * @param params.callback - Called for each line with `(x, index, numberOfLines)`.
   */
  private static forEachScaleLine(params: { tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; zoomLevel: number; devicePixelRatio: number; horizontalScrollPosition?: number; callback: (x: number, i: number, numberOfLines: number) => void }): void {
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

  /**
   * Draws vertical dashed guide lines on the canvas at each tick mark position.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.tickerMarkScale - Scale tuple from {@link getTickMarkScale}.
   * @param params.geneticTreeWidth - Total genetic width of the tree.
   * @param params.pixelToGeneticDistanceRatio - Pixels per unit of genetic distance.
   * @param params.devicePixelRatio - Screen DPR.
   * @param params.paddingTop - Top inset in pixels to leave blank (default 0).
   * @param params.paddingBottom - Bottom inset in pixels to leave blank (default 0).
   * @param params.zoomLevel - Current zoom level.
   * @param params.horizontalScrollPosition - Current horizontal scroll offset in pixels.
   */
  public static drawGuides(params: { canvas: HTMLCanvasElement; tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; devicePixelRatio: number; paddingTop?: number; paddingBottom?: number; startY?: number; endY?: number; zoomLevel: number; horizontalScrollPosition: number }): void {
    const { canvas, geneticTreeWidth, tickerMarkScale, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, paddingTop = 0, paddingBottom = 0, startY, endY, horizontalScrollPosition = 0 } = params;
    const canvasHeight = canvas.clientHeight || canvas.height / devicePixelRatio;

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
          ctx.moveTo(x, startY ?? paddingTop);
          ctx.lineTo(x, endY ?? (canvasHeight - paddingBottom));
          ctx.stroke();
          ctx.closePath();
        },
      });
      ctx.setLineDash([0, 0]);
    });
  }

  /**
   * Draws the genetic distance scale labels onto the canvas header area.
   *
   * Labels are drawn in reverse order (right-to-left distance decreasing) so
   * the leftmost label shows the largest genetic distance.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.theme - MUI theme providing the font family.
   * @param params.tickerMarkScale - Scale tuple from {@link getTickMarkScale}.
   * @param params.geneticTreeWidth - Total genetic width of the tree.
   * @param params.pixelToGeneticDistanceRatio - Pixels per unit of genetic distance.
   * @param params.zoomLevel - Current zoom level.
   * @param params.devicePixelRatio - Screen DPR.
   * @param params.horizontalScrollPosition - Current horizontal scroll offset in pixels.
   */
  public static drawScale(params: { canvas: HTMLCanvasElement; theme: Theme; tickerMarkScale: TickerMarkScale; geneticTreeWidth: Decimal; pixelToGeneticDistanceRatio: number; zoomLevel: number; devicePixelRatio: number; horizontalScrollPosition: number }): void {
    const { canvas, theme, tickerMarkScale, geneticTreeWidth, pixelToGeneticDistanceRatio, devicePixelRatio, zoomLevel, horizontalScrollPosition = 0 } = params;
    EpiTreeUtil.draw(canvas, devicePixelRatio, (ctx) => {
      ctx.fillStyle = theme.palette.text.primary;
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

  /**
   * Draws a thin horizontal divider line across the full canvas width.
   *
   * Used to visually separate the scale header from the tree body.
   *
   * @param params.canvas - The canvas element to draw onto.
   * @param params.y - Vertical position of the divider in logical pixels.
   * @param params.devicePixelRatio - Screen DPR for correct positioning.
   */
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

  /**
   * Helper that wraps a canvas drawing callback with a DPR-aware scale/translate
   * transform, then restores the context to its pre-call state.
   *
   * @param canvas - The canvas element whose 2D context to use.
   * @param devicePixelRatio - Screen DPR to scale up for HiDPI rendering.
   * @param callback - Drawing operations to perform inside the transform.
   */
  private static draw(canvas: HTMLCanvasElement, devicePixelRatio: number, callback: (ctx: CanvasRenderingContext2D) => void): void {
    const ctx = canvas.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.translate(0.5, 0.5);
    callback(ctx);
    ctx.translate(-0.5, -0.5);
    ctx.scale(1 / devicePixelRatio, 1 / devicePixelRatio);
  }

  /**
   * Calculates the new scroll position after a zoom level change so that the
   * point under the cursor stays in the same visual position.
   *
   * @param params.eventOffset - Pixel offset of the zoom event (e.g. mouse position) within the canvas.
   * @param params.scrollPosition - Current scroll position before the zoom change.
   * @param params.dimensionSize - Full logical size of the scrollable dimension in pixels.
   * @param params.currentZoomLevel - The zoom level before the change.
   * @param params.newZoomLevel - The zoom level after the change.
   * @returns The adjusted scroll position that keeps the cursor-point visually stable.
   */
  public static getNewScrollPositionForZoomLevel(params: { eventOffset: number; scrollPosition: number; dimensionSize: number; currentZoomLevel: number; newZoomLevel: number }): number {
    const { eventOffset, scrollPosition, dimensionSize, currentZoomLevel, newZoomLevel } = params;

    const fullSizeTreePosition = ((eventOffset * devicePixelRatio) + scrollPosition) * currentZoomLevel;
    const currentSizeTreePosition = fullSizeTreePosition / (dimensionSize / (dimensionSize / currentZoomLevel));
    const newSizeTreePosition = fullSizeTreePosition / (dimensionSize / (dimensionSize / newZoomLevel));
    return scrollPosition - (currentSizeTreePosition - newSizeTreePosition);
  }

  /**
   * Clamps X and Y scroll positions to their valid ranges for the current
   * canvas dimensions, zoom level, and link state.
   *
   * When the tree is linked and at zoom level 1, y-scrolling is constrained
   * tightly to the tree's pixel height. When unlinked or zoomed, the bounds
   * include the full canvas extent to allow free panning.
   *
   * Also applies a device-pixel-ratio-dependent correction offset to prevent
   * subtle over-scroll artefacts at non-integer DPR values (e.g. browser zoom).
   *
   * @param params.positionX - Requested horizontal scroll position.
   * @param params.positionY - Requested vertical scroll position.
   * @param params.treeCanvasWidth - Logical canvas width in pixels.
   * @param params.treeCanvasHeight - Logical canvas height in pixels.
   * @param params.treeHeight - Total rendered height of the full tree in pixels.
   * @param params.devicePixelRatio - Current screen DPR.
   * @param params.internalZoomLevel - Internal zoom level of the tree canvas.
   * @param params.isLinked - Whether the tree is linked to the case list scroll position.
   * @returns Clamped `{ newPositionX, newPositionY }` values.
   */
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

  /**
   * Performs a hit-test against the tree assembly's path maps to find the
   * tree node or line segment under the mouse cursor.
   *
   * Checks in priority order: node dots (via `isPointInPath`) → horizontal
   * branch lines (with ±1 px vertical tolerance) → vertical connector lines
   * (with ±1 px horizontal tolerance).
   *
   * @param params.canvas - The canvas element that received the mouse event.
   * @param params.event - The mouse event providing cursor coordinates.
   * @param params.treeAssembly - The assembly containing path maps to hit-test against.
   * @param params.devicePixelRatio - Screen DPR for correct coordinate scaling.
   * @returns The {@link TreePathProperties} of the hit shape, or `undefined` if nothing was hit.
   */
  public static getPathPropertiesFromCanvas(params: { canvas: HTMLCanvasElement; event: MouseEvent; treeAssembly: TreeAssembly; devicePixelRatio: number }): TreePathProperties {
    const { canvas, event, treeAssembly, devicePixelRatio } = params;

    const ctx = canvas.getContext('2d');
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * devicePixelRatio;
    const canvasY = (event.clientY - rect.top) * devicePixelRatio;

    for (const path of treeAssembly.nodePathPropertiesMap.keys()) {
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

    for (const path of treeAssembly.horizontalLinePathPropertiesMap.keys()) {
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
    for (const path of treeAssembly.verticalLinePathPropertiesMap.keys()) {
      for (const x of canvasXs) {
        if (ctx.isPointInStroke(path, x, canvasY)) {
          return treeAssembly.verticalLinePathPropertiesMap.get(path);
        }
      }
    }
  }


  /**
   * Derives all possible tree configurations for the given case type.
   *
   * Iterates over all columns of type `GENETIC_DISTANCE`, then for each column
   * produces one {@link TreeConfiguration} per available tree algorithm.
   * Algorithms are sorted by their canonical order from `EpiDataManager`.
   *
   * @param completeCaseType - The fully-loaded case type containing columns,
   *   reference columns, genetic distance protocols, and tree algorithms.
   * @returns An array of tree configurations, one per (column × algorithm) pair.
   */
  public static getTreeConfigurations(completeCaseType: CompleteCaseType): TreeConfiguration[] {
    const treeConfigurations: TreeConfiguration[] = [];

    const geneticDistanceCols = Object.values(completeCaseType.cols).filter(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      return refCol.col_type === ColType.GENETIC_DISTANCE;
    });

    const sortedTreeAlgorithmCodes = EpiDataManager.instance.data.treeAlgorithms.map(x => x.code);

    geneticDistanceCols.forEach(col => {
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      const geneticDistanceProtocol = completeCaseType.genetic_distance_protocols[refCol.genetic_distance_protocol_id];
      const treeAlgorithms = [...col.tree_algorithm_codes].sort((a, b) => {
        return sortedTreeAlgorithmCodes.indexOf(a) - sortedTreeAlgorithmCodes.indexOf(b);
      }).map(treeAlgorithmCode => completeCaseType.tree_algorithms[treeAlgorithmCode]);

      treeAlgorithms.forEach(treeAlgorithm => {
        treeConfigurations.push({
          computedId: EpiTreeUtil.getTreeConfigurationId({ col, refCol, geneticDistanceProtocol, treeAlgorithm }),
          col,
          refCol,
          geneticDistanceProtocol,
          treeAlgorithm,
        });
      });
    });

    return treeConfigurations;
  }

  /**
   * Produces a stable, unique string ID for a tree configuration by
   * concatenating the IDs of its column, reference column, genetic distance
   * protocol, and tree algorithm.
   *
   * @param treeConfiguration - The configuration to identify (without a pre-existing `computedId`).
   * @returns A string of the form `"colId_refColId_protocolId_algorithmId"`.
   */
  public static getTreeConfigurationId(treeConfiguration: Omit<TreeConfiguration, 'computedId'>): string {
    return `${treeConfiguration.col.id}_${treeConfiguration.refCol.id}_${treeConfiguration.geneticDistanceProtocol.id}_${treeConfiguration.treeAlgorithm.id}`;
  }

  /**
   * Returns a human-readable display label for a tree configuration.
   *
   * @param config - The tree configuration to label.
   * @returns A string of the form `"<protocolName> - <algorithmName>"`.
   */
  public static getTreeConfigurationLabel(config: TreeConfiguration): string {
    return `${config.geneticDistanceProtocol.name} - ${config.treeAlgorithm.name}`;
  }
}
