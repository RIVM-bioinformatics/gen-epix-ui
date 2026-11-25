import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createRef } from 'react';
import type {
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetRights,
  CaseDbCaseSetStatus,
  CaseDbCaseType,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';

import { CaseSetInfoDialog } from './CaseSetInfoDialog';
import type { CaseSetInfoDialogRefMethods } from './CaseSetInfoDialog';

const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const CATEGORY_ID = '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c';
const STATUS_ID = '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b';
const DATA_COLLECTION_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';

const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: CATEGORY_ID, name: 'Outbreak', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: STATUS_ID, name: 'Open', rank: 1 };
const CASE_TYPE: CaseDbCaseType = { id: CASE_TYPE_ID, name: 'Case type one' };
const DATA_COLLECTION: CaseDbDataCollection = { id: DATA_COLLECTION_ID, name: 'Data collection one' };

const createCaseSet = (overrides: Partial<CaseDbCaseSet> = {}): CaseDbCaseSet => {
  return {
    case_set_category_id: CATEGORY_ID,
    case_set_status_id: STATUS_ID,
    case_type_id: CASE_TYPE_ID,
    code: 'event-code',
    created_in_data_collection_id: DATA_COLLECTION_ID,
    description: 'Event description',
    id: CASE_SET_ID,
    name: 'Event one',
    ...overrides,
  };
};

const createRights = (overrides: Partial<CaseDbCaseSetRights> = {}): CaseDbCaseSetRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_set_id: CASE_SET_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_ID,
    data_collection_ids: [DATA_COLLECTION_ID],
    is_full_access: false,
    read_case_set: true,
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_ID],
    write_case_set: false,
    ...overrides,
  };
};

const registerHandlers = ({
  caseSet = createCaseSet(),
  links = [],
  rights = [createRights({ is_full_access: true })],
}: {
  caseSet?: CaseDbCaseSet;
  links?: unknown[];
  rights?: CaseDbCaseSetRights[];
} = {}) => {
  mockApiRequest('GET', `/v1/case_sets/${CASE_SET_ID}`, () => Response.json(caseSet));
  mockApiRequest('POST', '/v1/retrieve/case_set_rights', () => Response.json(rights));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([DATA_COLLECTION]));
  mockApiRequest('POST', '/v1/case_set_data_collection_links/query', () => Response.json(links));
  mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json([]));
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([CASE_TYPE]));
};

const renderDialog = async ({
  onClose = vi.fn<() => void>(),
  showNavigationButton = false,
}: {
  onClose?: ReturnType<typeof vi.fn<() => void>>;
  showNavigationButton?: boolean;
} = {}) => {
  const ref = createRef<CaseSetInfoDialogRefMethods>();
  const screen = await renderComponent(
    <CaseSetInfoDialog
      onClose={onClose}
      ref={ref}
      showNavigationButton={showNavigationButton}
    />,
  );
  ref.current?.open({ caseSetId: CASE_SET_ID, caseTypeId: CASE_TYPE_ID });
  return { onClose, screen };
};

describe('CaseSetInfoDialog', () => {
  beforeEach(() => {
    registerHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('shows the event name as title and enables delete, share and edit for full access', async () => {
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeEnabled();
  });

  it('disables delete, share and edit without any rights', async () => {
    registerHandlers({ rights: [createRights()] });
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables only delete when the case set can be deleted', async () => {
    registerHandlers({ rights: [createRights({ can_delete: true })] });
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables only edit when the case set can be written', async () => {
    registerHandlers({ rights: [createRights({ write_case_set: true })] });
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeDisabled();
  });

  it('enables only share when data collections can be added', async () => {
    registerHandlers({ rights: [createRights({ add_data_collection_ids: ['data-collection-2'] })] });
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('enables only share when data collections can be removed', async () => {
    registerHandlers({ rights: [createRights({ remove_data_collection_ids: [DATA_COLLECTION_ID] })] });
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-deleteButton')).toBeDisabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeDisabled();
  });

  it('shows the loading title while the case set is not yet loaded', async () => {
    mockApiRequest('GET', `/v1/case_sets/${CASE_SET_ID}`, async () => new Promise<Response>(() => undefined));
    const { screen } = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Loading' })).toBeInTheDocument();
  });

  it('navigates to the event page when the go to event button is clicked', async () => {
    const routerService = new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: `/events/event-one/${CASE_SET_ID}` },
      ],
    });
    container.registerInstance(RouterService, routerService);
    const { screen } = await renderDialog({ showNavigationButton: true });

    await screen.getByTestId('CaseSetInfoDialog-goToEvent').click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe(`/events/event-one/${CASE_SET_ID}`);
    await routerService.router.navigate('/');
  });

  it('does not show the go to event button without the navigation option', async () => {
    const { screen } = await renderDialog();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-goToEvent')).not.toBeInTheDocument();
  });

  it('deletes the case set after confirmation and closes the dialog', async () => {
    const deleteRequests: string[] = [];
    mockApiRequest('DELETE', `/v1/case_sets/${CASE_SET_ID}`, (request: Request) => {
      deleteRequests.push(request.url);
      return new Response(null, { status: 204 });
    });
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await expect.element(screen.getByText('Are you sure you want to delete the event?')).toBeInTheDocument();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(deleteRequests).toHaveLength(1);
  });

  it('closes the dialog when deleting the case set fails', async () => {
    mockApiRequest('DELETE', `/v1/case_sets/${CASE_SET_ID}`, () => Response.json({ message: 'failure' }, { status: 500 }));
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
  });

  it('does not delete the case set when the confirmation is cancelled', async () => {
    const deleteRequests: string[] = [];
    mockApiRequest('DELETE', `/v1/case_sets/${CASE_SET_ID}`, (request: Request) => {
      deleteRequests.push(request.url);
      return new Response(null, { status: 204 });
    });
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-cancelButton').click();

    await expect.element(screen.getByTestId('Confirmation-confirmButton')).not.toBeInTheDocument();
    expect(deleteRequests).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a refreshing spinner while the case set is being deleted', async () => {
    let resolveDelete: (response: Response) => void = () => undefined;
    const deletePromise = new Promise<Response>((resolve) => {
      resolveDelete = resolve;
    });
    mockApiRequest('DELETE', `/v1/case_sets/${CASE_SET_ID}`, async () => deletePromise);
    const { onClose, screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-deleteButton').click();
    await screen.getByTestId('Confirmation-confirmButton').click();

    await expect.element(screen.getByText('Refreshing data')).toBeInTheDocument();
    resolveDelete(new Response(null, { status: 204 }));
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
  });

  it('opens the edit form for the case content and returns to the view with go back', async () => {
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-editCaseContentButton').click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one - Edit');
    await expect.element(screen.getByRole('textbox', { name: 'Event name' })).toHaveValue('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-saveButton')).toBeEnabled();

    await screen.getByTestId('CaseSetInfoDialog-goBackButton').click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeEnabled();
  });

  it('saves the edited case content and returns to the view', async () => {
    const saveRequests: unknown[] = [];
    mockApiRequest('PUT', `/v1/case_sets/${CASE_SET_ID}`, async (request: Request) => {
      const body = await request.json() as CaseDbCaseSet;
      saveRequests.push(body);
      return Response.json({ ...createCaseSet(), ...body });
    });
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-editCaseContentButton').click();
    await screen.getByRole('textbox', { name: 'Event name' }).fill('Event renamed');
    await screen.getByTestId('CaseSetInfoDialog-saveButton').click();

    await expect.poll(() => saveRequests.length).toBe(1);
    expect(saveRequests[0]).toEqual(expect.objectContaining({ name: 'Event renamed' }));
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editCaseContentButton')).toBeEnabled();
  });

  it('opens the sharing form for the data collections and shows the share title', async () => {
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton').click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one - Share');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-saveButton')).toBeEnabled();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-goBackButton')).toBeEnabled();
  });

  it('saves the sharing form and returns to the view', async () => {
    const { screen } = await renderDialog();

    await screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton').click();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one - Share');
    await screen.getByTestId('CaseSetInfoDialog-saveButton').click();

    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
    await expect.element(screen.getByTestId('CaseSetInfoDialog-editDataCollectionsButton')).toBeEnabled();
  });

  it('shows the error when the case set cannot be loaded', async () => {
    mockApiRequest('GET', `/v1/case_sets/${CASE_SET_ID}`, () => Response.json({ message: 'failure' }, { status: 500 }));
    const { screen } = await renderDialog();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Loading');
  });

  it('shows the error when the data collection links cannot be loaded', async () => {
    mockApiRequest('POST', '/v1/case_set_data_collection_links/query', () => Response.json({ message: 'failure' }, { status: 500 }));
    const { screen } = await renderDialog();

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId('CaseSetInfoDialog-title')).toHaveTextContent('Event one');
  });
});
