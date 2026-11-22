import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetMember,
  CaseDbCaseSetStatus,
} from '@gen-epix/api-casedb';
import { MemoryRouter } from 'react-router-dom';
import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';

import { CaseCaseSetInfo } from './CaseCaseSetInfo';

const CASE_TYPE_ID = 'case-type-1';
const CASE: CaseDbCase = {
  case_type_id: CASE_TYPE_ID,
  content: {},
  created_in_data_collection_id: 'dc-1',
  id: 'case-1',
};

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: 'cat-1', name: 'Category one', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: 'status-1', name: 'Status one', rank: 1 };

const createCaseSet = (overrides: Partial<CaseDbCaseSet> & Pick<CaseDbCaseSet, 'id' | 'name'>): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY.id,
    case_set_status_id: STATUS.id,
    case_type_id: CASE_TYPE_ID,
    code: 'code',
    created_in_data_collection_id: 'dc-1',
    description: 'description',
    ...overrides,
  };
};

const CASE_SET = createCaseSet({ id: 'cs-1', name: 'Event one' });
const CASE_SET_WITH_UNKNOWN_REFERENCES = createCaseSet({
  case_set_category_id: 'missing-category',
  case_set_status_id: 'missing-status',
  id: 'cs-2',
  name: 'Event two',
});

let caseSets: CaseDbCaseSet[] = [];
let caseSetMembers: CaseDbCaseSetMember[] = [];
let isMembersRequestFailing = false;

const renderCaseCaseSetInfo = async () => {
  return await renderComponent(
    <MemoryRouter>
      <CaseCaseSetInfo caseDbCase={CASE} />
    </MemoryRouter>,
  );
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('POST', '/v1/case_set_members/query', async (request) => {
    if (isMembersRequestFailing) {
      return Response.json({ detail: 'failure' }, { status: 500 });
    }
    const body = await request.json() as { key: 'case_id' | 'case_set_id'; members: string[] };
    const matchingMembers = caseSetMembers.filter(member => body.members.includes(member.case_id));
    return Response.json(matchingMembers);
  });
  mockApiRequest('POST', '/v1/case_sets/query', async (request) => {
    const body = await request.json() as { members: string[] };
    return Response.json(caseSets.filter(caseSet => body.members.includes(caseSet.id)));
  });
};

describe('CaseCaseSetInfo', () => {
  beforeEach(() => {
    caseSets = [CASE_SET, CASE_SET_WITH_UNKNOWN_REFERENCES];
    caseSetMembers = [
      { case_id: CASE.id, case_set_id: CASE_SET.id },
      { case_id: CASE.id, case_set_id: CASE_SET_WITH_UNKNOWN_REFERENCES.id },
    ];
    isMembersRequestFailing = false;
    registerHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the heading and "None" when the case belongs to no event', async () => {
    caseSetMembers = [];
    const screen = await renderCaseCaseSetInfo();

    await expect.element(screen.getByText('Events')).toBeVisible();
    await expect.element(screen.getByText('None')).toBeVisible();
  });

  it('shows "None" when the case has memberships but the events cannot be found', async () => {
    caseSets = [];
    const screen = await renderCaseCaseSetInfo();

    await expect.element(screen.getByText('None')).toBeVisible();
    await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
  });

  it('lists the events of the case with their name, category and status', async () => {
    const screen = await renderCaseCaseSetInfo();

    await expect.element(screen.getByText('Name')).toBeVisible();
    await expect.element(screen.getByText('Category')).toBeVisible();
    await expect.element(screen.getByText('Status')).toBeVisible();
    await expect.element(screen.getByRole('link', { name: CASE_SET.name })).toBeVisible();
    await expect.element(screen.getByText(CATEGORY.name)).toBeVisible();
    await expect.element(screen.getByText(STATUS.name)).toBeVisible();
  });

  it('shows "Unknown" for a category and status that are not in the lookup maps', async () => {
    caseSets = [CASE_SET_WITH_UNKNOWN_REFERENCES];
    caseSetMembers = [{ case_id: CASE.id, case_set_id: CASE_SET_WITH_UNKNOWN_REFERENCES.id }];
    const screen = await renderCaseCaseSetInfo();

    await expect.element(screen.getByRole('link', { name: CASE_SET_WITH_UNKNOWN_REFERENCES.name })).toBeVisible();
    await expect.element(screen.getByText('Unknown').first()).toBeVisible();
    await expect.element(screen.getByText('Unknown').nth(1)).toBeVisible();
  });

  it('shows the error when the memberships cannot be loaded', async () => {
    isMembersRequestFailing = true;
    const screen = await renderCaseCaseSetInfo();

    await expect.element(screen.getByText('Events')).toBeVisible();
    await expect.element(screen.getByText('None')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('table')).not.toBeInTheDocument();
  });
});
