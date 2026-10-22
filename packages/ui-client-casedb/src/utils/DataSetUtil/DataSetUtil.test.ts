import {
  describe,
  expect,
  it,
} from 'vitest';

import { DataSetUtil } from './DataSetUtil';

describe('DataSetUtil.getCategorizedSetMembers', () => {
  it('returns empty results when the parent and child sets have no common members', () => {
    expect(DataSetUtil.getCategorizedSetMembers({
      childMemberIds: ['child'],
      mappedSetMembers: new Map([['set-1', ['parent']]]),
      parentMemberIds: ['parent'],
      parentSetId: 'parent-set',
    })).toEqual({
      categorizedMemberIds: [],
      setIds: [],
      uncategorizedMemberIds: [],
    });
  });

  it('uses the parent set when both member lists match completely', () => {
    expect(DataSetUtil.getCategorizedSetMembers({
      childMemberIds: ['a', 'b'],
      mappedSetMembers: new Map([['child-set', ['a', 'b']]]),
      parentMemberIds: ['a', 'b'],
      parentSetId: 'parent-set',
    })).toEqual({
      categorizedMemberIds: ['a', 'b'],
      setIds: ['parent-set'],
      uncategorizedMemberIds: [],
    });
  });

  it('deduplicates overlapping categories, omits empty sets, and reports uncategorized members', () => {
    expect(DataSetUtil.getCategorizedSetMembers({
      childMemberIds: ['a', 'b', 'c', 'd', 'outside'],
      mappedSetMembers: new Map([
        ['empty-set', []],
        ['set-a', ['a']],
        ['set-ab', ['a', 'b']],
        ['set-bc', ['b', 'c']],
        ['set-incomplete', ['a', 'outside']],
      ]),
      parentMemberIds: ['a', 'b', 'c', 'd', 'parent-only'],
      parentSetId: 'parent-set',
    })).toEqual({
      categorizedMemberIds: ['a', 'b', 'c'],
      setIds: ['set-ab', 'set-bc'],
      uncategorizedMemberIds: ['d'],
    });
  });

  it('keeps a single mapped set and identifies its uncovered members', () => {
    expect(DataSetUtil.getCategorizedSetMembers({
      childMemberIds: ['a', 'b', 'c'],
      mappedSetMembers: new Map([['set-ab', ['a', 'b']]]),
      parentMemberIds: ['a', 'b', 'c', 'd'],
      parentSetId: 'parent-set',
    })).toEqual({
      categorizedMemberIds: ['a', 'b'],
      setIds: ['set-ab'],
      uncategorizedMemberIds: ['c'],
    });
  });
});

describe('DataSetUtil.getMappedSetMembers', () => {
  it('returns an empty map for an empty list', () => {
    expect(DataSetUtil.getMappedSetMembers({
      items: [],
      memberProperty: 'memberId',
      setProperty: 'setId',
    })).toEqual(new Map());
  });

  it('groups member IDs by set ID and preserves item order', () => {
    expect(DataSetUtil.getMappedSetMembers({
      items: [
        { memberId: 'member-1', setId: 'set-1' },
        { memberId: 'member-2', setId: 'set-2' },
        { memberId: 'member-3', setId: 'set-1' },
      ],
      memberProperty: 'memberId',
      setProperty: 'setId',
    })).toEqual(new Map([
      ['set-1', ['member-1', 'member-3']],
      ['set-2', ['member-2']],
    ]));
  });
});
