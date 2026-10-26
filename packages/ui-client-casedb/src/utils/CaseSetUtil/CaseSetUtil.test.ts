import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import { CaseSetUtil } from './CaseSetUtil';

const createCaseSet = (): CaseDbCaseSet => ({
  case_set_category_id: 'category-1',
  case_set_date: '2024-01-01',
  case_set_status_id: 'status-1',
  case_type_id: 'case-type-1',
  code: 'CS-1',
  created_in_data_collection_id: 'data-collection-1',
  description: '',
  id: 'case-set-1',
  name: 'My Case Set',
});

describe('CaseSetUtil.createCaseSetLink', () => {
  it('creates a relative event path by default and when full is false', () => {
    expect(CaseSetUtil.createCaseSetLink(createCaseSet())).toBe('/events/my-case-set/case-set-1');
    expect(CaseSetUtil.createCaseSetLink(createCaseSet(), false)).toBe('/events/my-case-set/case-set-1');
  });

  it('prefixes the current origin when a full link is requested', () => {
    const origin = container.resolve(WindowService).window.location.origin;

    expect(CaseSetUtil.createCaseSetLink(createCaseSet(), true)).toBe(`${origin}/events/my-case-set/case-set-1`);
  });
});
