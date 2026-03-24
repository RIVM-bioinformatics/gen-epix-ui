import type Decimal from 'decimal.js';

export type TreeNode = {
  children?: TreeNode[];
  name?: string;
  subTreeNames?: string[];
  subTreeLeaveNames?: string[];
  branchLength?: Decimal;
  maxBranchLength?: Decimal;
  size?: number;
  address?: string;
};

export type TreePathProperties = {
  subTreeLeaveNames: string[];
  treeNode?: TreeNode;
};

type TreeAssemblyPathPropertiesMap = Map<Path2D, TreePathProperties>;

export type TreeAssembly = {
  verticalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  horizontalAncestorTreeLines: Array<{ nodeNames: string[]; shape: Path2D }>;
  ancestorNodes: Array<{ nodeNames: string[]; shape: Path2D }>;
  leafNodes: Array<{ nodeName: string; shape: Path2D }>;
  leafTreeLines: Array<{ nodeName: string; shape: Path2D }>;
  supportLines: Array<{ nodeName: string; fromX: number; toX: number; y: number }>;
  distanceTexts: Array<{ nodeNames: string[]; x: number; y: number; text: string }>;
  nodePathPropertiesMap: TreeAssemblyPathPropertiesMap;
  horizontalLinePathPropertiesMap: TreeAssemblyPathPropertiesMap;
  verticalLinePathPropertiesMap: TreeAssemblyPathPropertiesMap;
};
