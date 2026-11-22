import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';

import { CaseSetDescription } from './CaseSetDescription';

const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_set_category_id: 'category-1',
    case_set_date: '2024-03-05T14:30:00.000Z',
    case_set_status_id: 'status-1',
    case_type_id: 'case-type-1',
    code: 'event-code',
    created_in_data_collection_id: 'data-collection-1',
    description: 'Event description',
    id: 'case-set-1',
    name: 'Event one',
    ...overrides,
  };
};

describe('CaseSetDescription', () => {
  it('shows the title and the description of the case set', async () => {
    const screen = await renderComponent(
      <CaseSetDescription caseSet={createCaseSet({ description: 'Event description text' })} />,
    );

    await expect.element(screen.getByText('Description', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Event description text')).toBeInTheDocument();
    await expect.element(screen.getByText('None', { exact: true })).not.toBeInTheDocument();
  });

  it('shows "None" when the case set has no description', async () => {
    const screen = await renderComponent(
      <CaseSetDescription caseSet={createCaseSet({ description: '' })} />,
    );

    await expect.element(screen.getByText('Description', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('None', { exact: true })).toBeInTheDocument();
  });
});
