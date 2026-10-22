import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCaseTypeAccessAbac } from '@gen-epix/api-casedb';

import { AbacUtil } from './AbacUtil';

const createAccess = (readColIds: string[], writeColIds: string[]): CaseDbCaseTypeAccessAbac => ({
  add_case: false,
  add_case_set: false,
  case_type_id: 'case-type-1',
  data_collection_id: 'data-collection-1',
  is_private: false,
  read_case_set: false,
  read_col_ids: readColIds,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
  write_col_ids: writeColIds,
});

describe('AbacUtil.createEffectieveColumnAccessRights', () => {
  it('returns an empty map when there are no policies', () => {
    expect(AbacUtil.createEffectieveColumnAccessRights([])).toEqual(new Map());
  });

  it('combines read and write rights across policies and duplicate column IDs', () => {
    const result = AbacUtil.createEffectieveColumnAccessRights([
      createAccess(['shared', 'read-only'], ['shared', 'write-only']),
      createAccess(['write-only'], ['read-only']),
    ]);

    expect(result).toEqual(new Map([
      ['read-only', { read: true, write: true }],
      ['shared', { read: true, write: true }],
      ['write-only', { read: true, write: true }],
    ]));
  });
});
