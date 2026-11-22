import type {
  CaseDbCase,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbEtlStatus } from '@gen-epix/api-casedb';
import { createElement } from 'react';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { StringUtil } from '@gen-epix/ui-core/utils/StringUtil';

import {
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from './completeCaseType';

export const DASHBOARD_CASE_ID = 'case-dashboard-1';

export const INJECTED_DASHBOARD_COMPONENT_TEXT = 'Injected dashboard component';

export const InjectedDashboardComponent = () => createElement('div', undefined, INJECTED_DASHBOARD_COMPONENT_TEXT);

/**
 * Removes the persisted dashboard table store for the shared complete case type and the persisted user profile.
 */
export const clearDashboardStorage = () => {
  localStorage.removeItem(`GENEPIX-TableStore-epiDashboardStoreLoader-${StringUtil.createSlug(COMPLETE_CASE_TYPE_NAME)}-${StringUtil.createHash(COMPLETE_CASE_TYPE_ID)}`);
  localStorage.removeItem('GENEPIX-User-Profile');
};

/**
 * Creates a minimal case of the shared complete case type.
 */
export const createDashboardCase = (overrides: Partial<CaseDbCase> = {}): CaseDbCase => {
  return {
    case_type_id: COMPLETE_CASE_TYPE_ID,
    id: DASHBOARD_CASE_ID,
    ...overrides,
  } as CaseDbCase;
};

/**
 * Creates a complete case type with the operational props the dashboard reads.
 */
export const createDashboardCompleteCaseType = (overrides: Partial<CaseDbCompleteCaseType> = {}): CaseDbCompleteCaseType => {
  return createCompleteCaseType({
    props: { read_max_n_cases: 1000, read_max_tree_size: 100 },
    ...overrides,
  });
};

/**
 * Registers the endpoints needed to render the dashboard: the complete case type loader, case querying, case rights and case upload.
 */
export const mockDashboardApi = (completeCaseType: CaseDbCompleteCaseType = createDashboardCompleteCaseType()) => {
  mockCompleteCaseTypeLoaderApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: [], is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json([]));
  mockApiRequest('POST', '/v1/retrieve/case_rights', () => Response.json([]));
  mockApiRequest('POST', '/v1/upload/cases', () => Response.json({ cases: [], status: CaseDbEtlStatus.SUCCESS }));
};
