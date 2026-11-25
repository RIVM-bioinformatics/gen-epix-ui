import type { CaseDbCaseSet } from '@gen-epix/api-casedb';

import { COMPLETE_CASE_TYPE_ID } from './completeCaseType';

export const CASE_SET_FIXTURE_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';

export const CASE_SET_FIXTURE_NAME = 'Case set fixture';

/**
 * Creates a minimal case set of the shared complete case type.
 */
export const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    id: CASE_SET_FIXTURE_ID,
    name: CASE_SET_FIXTURE_NAME,
    ...overrides,
  } as CaseDbCaseSet;
};
