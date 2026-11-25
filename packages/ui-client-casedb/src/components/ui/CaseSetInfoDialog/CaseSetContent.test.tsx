import { format } from 'date-fns';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetStatus,
  CaseDbCaseType,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';

import { CaseSetContent } from './CaseSetContent';

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: 'category-1', name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: 'status-1', name: 'Open', rank: 1 };
const CASE_TYPE: CaseDbCaseType = { id: 'case-type-1', name: 'Case type one' };
const CASE_SET_DATE = '2024-03-05T14:30:00.000Z';

const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY.id,
    case_set_date: CASE_SET_DATE,
    case_set_status_id: STATUS.id,
    case_type_id: CASE_TYPE.id,
    code: 'event-code',
    created_in_data_collection_id: 'data-collection-1',
    description: 'Event description',
    id: 'case-set-1',
    name: 'Event one',
    ...overrides,
  };
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([CASE_TYPE]));
};

const renderContent = async (caseSet: CaseDbCaseSet) => {
  return renderComponent(
    <CaseSetContent caseSet={caseSet} />,
  );
};

describe('CaseSetContent', () => {
  beforeEach(() => {
    registerHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the title and the column headers', async () => {
    const screen = await renderContent(createCaseSet());

    await expect.element(screen.getByText('Content', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('columnheader', { name: 'Column' })).toBeInTheDocument();
    await expect.element(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();
  });

  it('shows the name, status, category, type and creation date of the case set', async () => {
    const screen = await renderContent(createCaseSet());

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Event one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Open' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outbreak' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Case type one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: format(new Date(CASE_SET_DATE), DATE_FORMAT.DATE_TIME) })).toBeInTheDocument();
  });

  it('shows "Unknown" when the case set has no creation date', async () => {
    const screen = await renderContent(createCaseSet({ case_set_date: null }));

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Unknown' })).toBeInTheDocument();
  });

  it('shows empty values when the referenced category, status and type are unknown', async () => {
    const screen = await renderContent(createCaseSet({
      case_set_category_id: 'unknown-category',
      case_set_status_id: 'unknown-status',
      case_type_id: 'unknown-case-type',
    }));

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Event one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: format(new Date(CASE_SET_DATE), DATE_FORMAT.DATE_TIME) })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Open' })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outbreak' })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Case type one' })).not.toBeInTheDocument();
  });
});
