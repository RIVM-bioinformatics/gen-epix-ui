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
