import {
  describe,
  expect,
  it,
} from 'vitest';

import { CaseSelectionUtil } from './CaseSelectionUtil';

describe('CaseSelectionUtil.addComponentCaseIdsToSelection', () => {
  it('merges IDs in input order and removes duplicates', () => {
    expect(CaseSelectionUtil.addComponentCaseIdsToSelection(
      ['case-2', 'case-3', 'case-2'],
      ['case-1', 'case-2'],
    )).toEqual(['case-1', 'case-2', 'case-3']);
  });

  it('handles empty inputs', () => {
    expect(CaseSelectionUtil.addComponentCaseIdsToSelection([], ['case-1'])).toEqual(['case-1']);
    expect(CaseSelectionUtil.addComponentCaseIdsToSelection([], [])).toEqual([]);
  });
});

describe('CaseSelectionUtil.canAddToSelection', () => {
  it.each([
    [['case-1'], ['case-1'], false],
    [['case-1', 'case-2'], ['case-1'], true],
    [[], ['case-1'], false],
    [['case-1'], [], true],
  ])('returns %s for component IDs %j and selected IDs %j', (componentCaseIds, selectedIds, expected) => {
    expect(CaseSelectionUtil.canAddToSelection(componentCaseIds, selectedIds)).toBe(expected);
  });
});

describe('CaseSelectionUtil.canRefineSelection', () => {
  it.each([
    [['case-1'], ['case-2'], false],
    [['case-1'], ['case-1'], false],
    [['case-1'], ['case-1', 'case-2'], true],
    [['case-1', 'case-2'], ['case-2', 'case-3'], true],
    [[], [], false],
  ])('returns %s for component IDs %j and selected IDs %j', (componentCaseIds, selectedIds, expected) => {
    expect(CaseSelectionUtil.canRefineSelection(componentCaseIds, selectedIds)).toBe(expected);
  });
});

describe('CaseSelectionUtil.canRemoveFromSelection', () => {
  it.each([
    [['case-1'], ['case-1'], true],
    [['case-1'], ['case-2'], false],
    [[], ['case-1'], false],
    [['case-1'], [], false],
  ])('returns %s for component IDs %j and selected IDs %j', (componentCaseIds, selectedIds, expected) => {
    expect(CaseSelectionUtil.canRemoveFromSelection(componentCaseIds, selectedIds)).toBe(expected);
  });
});

describe('CaseSelectionUtil.refineSelectionWithComponentCaseIds', () => {
  it('preserves component order and duplicate matching IDs', () => {
    expect(CaseSelectionUtil.refineSelectionWithComponentCaseIds(
      ['case-3', 'case-1', 'case-3', 'case-2'],
      ['case-2', 'case-3'],
    )).toEqual(['case-3', 'case-3', 'case-2']);
  });

  it('returns an empty intersection for disjoint or empty inputs', () => {
    expect(CaseSelectionUtil.refineSelectionWithComponentCaseIds(['case-1'], ['case-2'])).toEqual([]);
    expect(CaseSelectionUtil.refineSelectionWithComponentCaseIds([], ['case-1'])).toEqual([]);
  });
});

describe('CaseSelectionUtil.removeComponentCaseIdsFromSelection', () => {
  it('removes all matching IDs and preserves the order of the remaining selection', () => {
    expect(CaseSelectionUtil.removeComponentCaseIdsFromSelection(
      ['case-2', 'case-3'],
      ['case-1', 'case-2', 'case-3', 'case-2'],
    )).toEqual(['case-1']);
  });

  it('preserves selection when there is no overlap', () => {
    const selectedIds = ['case-1', 'case-2'];
    expect(CaseSelectionUtil.removeComponentCaseIdsFromSelection(['case-3'], selectedIds)).toEqual(selectedIds);
    expect(CaseSelectionUtil.removeComponentCaseIdsFromSelection([], selectedIds)).toEqual(selectedIds);
  });
});
