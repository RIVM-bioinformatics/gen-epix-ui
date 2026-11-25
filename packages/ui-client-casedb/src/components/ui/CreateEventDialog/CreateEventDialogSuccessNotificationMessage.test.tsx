import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { MemoryRouter } from 'react-router-dom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';

import { CreateEventDialogSuccessNotificationMessage } from './CreateEventDialogSuccessNotificationMessage';

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

const renderMessage = async ({
  caseSet = createCaseSet(),
  initialPath = '/',
  isCreating,
}: {
  readonly caseSet?: CaseDbCaseSet;
  readonly initialPath?: string;
  readonly isCreating?: boolean;
} = {}) => {
  return await renderComponent(
    <MemoryRouter initialEntries={[initialPath]}>
      <CreateEventDialogSuccessNotificationMessage
        caseSet={caseSet}
        isCreating={isCreating}
      />
    </MemoryRouter>,
  );
};

describe('CreateEventDialogSuccessNotificationMessage', () => {
  it('shows the created message when isCreating is true', async () => {
    const screen = await renderMessage({ isCreating: true });

    await expect.element(screen.getByText('Successfully created event: My Case Set')).toBeVisible();
    await expect.element(screen.getByText('Successfully edited event: My Case Set')).not.toBeInTheDocument();
  });

  it('shows the edited message when isCreating is false', async () => {
    const screen = await renderMessage({ isCreating: false });

    await expect.element(screen.getByText('Successfully edited event: My Case Set')).toBeVisible();
    await expect.element(screen.getByText('Successfully created event: My Case Set')).not.toBeInTheDocument();
  });

  it('shows the edited message when isCreating is not provided', async () => {
    const screen = await renderMessage();

    await expect.element(screen.getByText('Successfully edited event: My Case Set')).toBeVisible();
  });

  it('renders a link to the event when the current location is not the event', async () => {
    const caseSet = createCaseSet();
    const screen = await renderMessage({ caseSet, isCreating: true });

    const link = screen.getByRole('link', { name: 'View event: My Case Set' });
    await expect.element(link).toBeVisible();
    await expect.element(link).toHaveAttribute('href', CaseSetUtil.createCaseSetLink(caseSet));
  });

  it('renders the event link as text when the current location is the event', async () => {
    const caseSet = createCaseSet();
    const screen = await renderMessage({
      caseSet,
      initialPath: CaseSetUtil.createCaseSetLink(caseSet),
      isCreating: true,
    });

    await expect.element(screen.getByText('View event: My Case Set')).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'View event: My Case Set' })).not.toBeInTheDocument();
  });
});
