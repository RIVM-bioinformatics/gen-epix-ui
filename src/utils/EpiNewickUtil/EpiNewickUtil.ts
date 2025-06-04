import Decimal from 'decimal.js';
import sum from 'lodash/sum';

import { StringUtil } from '../StringUtil';
import type { TreeNode } from '../../models/tree';

export class EpiNewickUtil {
  public static parse(newick: string): TreeNode {
    const ancestors = [];
    let tree: Partial<TreeNode> = {};
    const tokens = newick.split(/(;|\(|\)|,|:)/).map(x => x.trim()).filter(x => x);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const subtree: Partial<TreeNode> = {};
      const x = tokens[i - 1];
      switch (token) {
        case '(': // new children
          tree.children = [subtree];
          ancestors.push(tree);
          tree = subtree;
          break;
        case ',': // another branch
          ancestors[ancestors.length - 1].children.push(subtree);
          tree = subtree;
          break;
        case ')': // optional name next
          tree = ancestors.pop();
          tree.children.forEach(child => {
            if (!child.children) {
              child.size = 1;
              child.maxBranchLength = new Decimal(child.branchLength ?? 0);
              child.subTreeLeaveNames = [child.name];
            }
          });
          tree.size = sum((tree?.children ?? []).map(child => child.size ?? 0));
          tree.subTreeNames = (tree?.children ?? []).map(child => child.subTreeNames).flat().filter(n => n);
          tree.subTreeLeaveNames = (tree?.children ?? []).map(child => child.subTreeLeaveNames).flat().filter(n => n);
          break;
        case ':': // optional length next
          break;
        default:
          if (x === ')' || x === '(' || x === ',') {
            tree.name = token;
          } else if (x === ':') {
            tree.branchLength = new Decimal(token);
            tree.subTreeNames = (tree?.children ?? []).map(child => [child.name, ...child.subTreeNames]).flat().filter(n => n);
            tree.subTreeLeaveNames = (tree?.children ?? []).map(child => child.subTreeLeaveNames).flat().filter(n => n);
            tree.maxBranchLength = (tree.branchLength ?? new Decimal(0)).add(tree.children?.length ? Decimal.max(...tree.children.map(child => child.maxBranchLength ?? 0)) : 0);
            tree.name = tree.name || `Generated-${StringUtil.createHash(tree.subTreeNames.join(','))}`;
          }
      }
    }
    tree.branchLength = tree?.branchLength ?? new Decimal(0);
    tree.maxBranchLength = tree?.children?.length ? Decimal.max(...(tree.children.map(child => child.maxBranchLength ?? 0))) : new Decimal(0);
    tree.name = 'Root';
    return tree;
  }

  public static getSortedNames(node: TreeNode): string[] {
    return [
      ...(node.children ?? []).map(child => EpiNewickUtil.getSortedNames(child)).flat(),
      ...(!node.children ? [node.name] : []),
    ];
  }
}
