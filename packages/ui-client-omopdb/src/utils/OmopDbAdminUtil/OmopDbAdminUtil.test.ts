import {
  describe,
  expect,
  it,
} from 'vitest';

import { OmopDbAdminUtil } from './OmopDbAdminUtil';

describe('OmopDbAdminUtil', () => {
  it('uses the SDK identity field for CrudPage row identity', () => {
    expect(OmopDbAdminUtil.withId({ concept_id: 'concept-id' }, 'concept_id', 'Concept')).toEqual({
      concept_id: 'concept-id',
      id: 'concept-id',
    });
  });

  it('falls back to the temporary id of an optimistic row without the SDK identity field', () => {
    const optimisticRow: { id: string; person_id: number; visit_detail_id?: number } = { id: 'temporary-id', person_id: 1 };

    expect(OmopDbAdminUtil.withId(optimisticRow, 'visit_detail_id', 'Visit detail')).toEqual({
      id: 'temporary-id',
      person_id: 1,
    });
  });

  it('throws when the SDK identity field is missing', () => {
    expect(() => OmopDbAdminUtil.withId({ concept_id: null }, 'concept_id', 'Concept')).toThrow('Concept is missing a valid concept_id.');
  });
});
