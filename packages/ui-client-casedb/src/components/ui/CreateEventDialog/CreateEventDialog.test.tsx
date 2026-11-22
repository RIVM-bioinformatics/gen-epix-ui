import type {
  CaseDbCase,
  CaseDbCaseDataCollectionLink,
  CaseDbCaseSet,
  CaseDbCaseSetCategory,
  CaseDbCaseSetStatus,
  CaseDbCaseType,
  CaseDbCaseTypeAccessAbac,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { createRef } from 'react';
import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';
import {
  COMPLETE_CASE_TYPE_NAME,
  createCompleteCaseType,
} from '../../../test/fixtures/completeCaseType';

import type {
  CreateEventDialogOpenProps,
  CreateEventDialogRefMethods,
} from './CreateEventDialog';
import { CreateEventDialog } from './CreateEventDialog';

type CreateCaseSetRequestBody = {
  case_ids: string[];
  case_set: Partial<CaseDbCaseSet>;
  data_collection_ids: string[];
};

type Screen = Awaited<ReturnType<typeof renderComponent>>;

const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CATEGORY: CaseDbCaseSetCategory = { description: 'Category description', id: '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c', name: 'Category one', rank: 1 };
const STATUS: CaseDbCaseSetStatus = { description: 'Status description', id: '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b', name: 'Status one', rank: 1 };
const CASE_TYPE: CaseDbCaseType = { description: 'Case type description', id: CASE_TYPE_ID, name: COMPLETE_CASE_TYPE_NAME };
const PRIVATE_ONE: CaseDbDataCollection = { id: '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c', name: 'Private one' };
const PRIVATE_TWO: CaseDbDataCollection = { id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b', name: 'Private two' };
const SHARED: CaseDbDataCollection = { id: 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d', name: 'Shared' };
const NO_ADD: CaseDbDataCollection = { id: 'b1c2d3e4-f5a6-4b7c-9d8e-0f1a2b3c4d5e', name: 'No add' };
const UNLISTED: CaseDbDataCollection = { id: 'c2d3e4f5-a6b7-4c8d-8e9f-1a2b3c4d5e6f', name: 'Unlisted' };
const CASE_ONE = { id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' } as CaseDbCase;
const CASE_TWO = { id: 'd4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f7a' } as CaseDbCase;

const SHARING_LABEL = 'Should the same sharing be applied to the cases in the event?';

let accessMap: Record<string, CaseDbCaseTypeAccessAbac>;
let dataCollections: CaseDbDataCollection[];
let caseTypes: CaseDbCaseType[];
let requestedPaths: string[];
let createCaseSetRequests: CreateCaseSetRequestBody[];
let batchRequests: CaseDbCaseDataCollectionLink[][];

const createAccess = (dataCollectionId: string, overrides: Partial<CaseDbCaseTypeAccessAbac> = {}): CaseDbCaseTypeAccessAbac => {
  return {
    add_case: false,
    add_case_set: false,
    case_type_id: CASE_TYPE_ID,
    data_collection_id: dataCollectionId,
    is_private: false,
    read_case_set: false,
    read_col_ids: [],
    remove_case: false,
    remove_case_set: false,
    write_case_set: false,
    write_col_ids: [],
    ...overrides,
  };
};

const createDefaultAccessMap = (): Record<string, CaseDbCaseTypeAccessAbac> => {
  return {
    [NO_ADD.id]: createAccess(NO_ADD.id, { is_private: true }),
    [PRIVATE_ONE.id]: createAccess(PRIVATE_ONE.id, { add_case_set: true, is_private: true }),
    [PRIVATE_TWO.id]: createAccess(PRIVATE_TWO.id, { add_case_set: true, is_private: true }),
    [SHARED.id]: createAccess(SHARED.id, { add_case_set: true }),
  };
};

const createDialogCompleteCaseType = () => {
  return createCompleteCaseType({ case_type_access_abacs: accessMap, id: CASE_TYPE_ID });
};

const registerHandlers = () => {
  mockApiRequest('GET', '/v1/case_types', () => Response.json(caseTypes));
  mockApiRequest('GET', '/v1/case_set_categories', () => Response.json([CATEGORY]));
  mockApiRequest('GET', '/v1/case_set_statuses', () => Response.json([STATUS]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json(dataCollections));
  mockApiRequest('GET', '/v1/complete_case_types', () => {
    requestedPaths.push('GET /v1/complete_case_types');
    return Response.json(createDialogCompleteCaseType());
  });
  mockApiRequest('POST', '/v1/create/case_set', async (request) => {
    requestedPaths.push('POST /v1/create/case_set');
    const body = await request.json() as CreateCaseSetRequestBody;
    createCaseSetRequests.push(body);
    return Response.json({ ...body.case_set, id: CASE_SET_ID });
  });
  mockApiRequest('POST', '/v1/case_set_members/query', () => {
    requestedPaths.push('POST /v1/case_set_members/query');
    return Response.json([]);
  });
  mockApiRequest('POST', '/v1/case_sets/query', () => Response.json([]));
  mockApiRequest('POST', '/v1/retrieve/case_rights', async (request) => {
    requestedPaths.push('POST /v1/retrieve/case_rights');
    const body = await request.json() as { case_ids: string[] };
    return Response.json(body.case_ids.map((caseId) => ({
      add_data_collection_ids: [SHARED.id],
      case_id: caseId,
      is_full_access: false,
      shared_in_data_collection_ids: [] as string[],
    })));
  });
  mockApiRequest('POST', '/v1/case_data_collection_links/batch', async (request) => {
    requestedPaths.push('POST /v1/case_data_collection_links/batch');
    const items = await request.json() as CaseDbCaseDataCollectionLink[];
    batchRequests.push(items);
    return Response.json(items);
  });
};

const renderDialog = async (openProps: CreateEventDialogOpenProps) => {
  const onClose = vi.fn();
  const ref = createRef<CreateEventDialogRefMethods>();
  const screen = await renderComponent(
    <CreateEventDialog
      onClose={onClose}
      ref={ref}
    />,
  );
  ref.current?.open(openProps);
  return { onClose, screen };
};

const selectOption = async (screen: Screen, comboboxName: string, optionName: string) => {
  await screen.getByRole('combobox', { name: comboboxName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const closePopup = async (screen: Screen) => {
  await screen.getByTestId('CreateEventDialog-title').click();
};

const fillEventDetails = async (screen: Screen) => {
  await screen.getByRole('textbox', { name: 'Event name' }).fill('Event one');
  await screen.getByRole('textbox', { name: 'Event code' }).fill('EVENT1');
  await selectOption(screen, 'Category', CATEGORY.name);
  await selectOption(screen, 'Status', STATUS.name);
  await screen.getByTestId('RichTextEditor').getByRole('textbox').fill('Event description');
};

const getNotifications = () => {
  return container.resolve(NotificationService).data.map((notification) => {
    return { message: notification.message, severity: notification.severity };
  });
};

describe('CreateEventDialog', () => {
  beforeEach(() => {
    accessMap = createDefaultAccessMap();
    dataCollections = [PRIVATE_ONE, PRIVATE_TWO, SHARED, NO_ADD, UNLISTED];
    caseTypes = [CASE_TYPE];
    requestedPaths = [];
    createCaseSetRequests = [];
    batchRequests = [];
    registerHandlers();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('shows the title with the selected case count when a case type and rows are passed', async () => {
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType(), rows: [CASE_ONE, CASE_TWO] });

    await expect.element(screen.getByTestId('CreateEventDialog-title')).toHaveTextContent(`Create new event from 2 selected ${COMPLETE_CASE_TYPE_NAME} cases`);
  });

  it('shows the plain create title when no props are passed', async () => {
    const { screen } = await renderDialog({});

    await expect.element(screen.getByTestId('CreateEventDialog-title')).toHaveTextContent('Create event');
  });

  it('shows the plain create title when a case type is passed without rows', async () => {
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await expect.element(screen.getByTestId('CreateEventDialog-title')).toHaveTextContent('Create event');
  });

  it('prefills the event name and locks the case type when a complete case type is passed', async () => {
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await expect.element(screen.getByRole('textbox', { name: 'Event name' })).toHaveValue(`New ${COMPLETE_CASE_TYPE_NAME} event`);
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).toBeDisabled();
  });

  it('lists only private data collections that allow adding case sets as create-in options', async () => {
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await screen.getByRole('combobox', { name: 'Create in data collection' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: PRIVATE_ONE.name })).toBeVisible();

    const optionNames = screen.getByRole('option').elements().map(element => element.textContent?.trim());
    expect(optionNames).toEqual([PRIVATE_ONE.name, PRIVATE_TWO.name]);
  });

  it('excludes the create-in data collection from the share options', async () => {
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await screen.getByRole('combobox', { name: 'Share in data collections' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: SHARED.name })).toBeVisible();

    const optionNames = screen.getByRole('option').elements().map(element => element.textContent?.trim());
    expect(optionNames).toEqual([PRIVATE_TWO.name, SHARED.name]);
  });

  it('submits the event with rows, applying the share to the selected cases', async () => {
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType(), rows: [CASE_ONE, CASE_TWO] });

    await fillEventDetails(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await selectOption(screen, 'Share in data collections', SHARED.name);
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toHaveLength(1);
    expect(createCaseSetRequests[0]).toMatchObject({
      case_ids: [CASE_ONE.id, CASE_TWO.id],
      case_set: {
        case_set_category_id: CATEGORY.id,
        case_set_status_id: STATUS.id,
        case_type_id: CASE_TYPE_ID,
        code: 'EVENT1',
        created_in_data_collection_id: PRIVATE_ONE.id,
        name: 'Event one',
      },
      data_collection_ids: [SHARED.id],
    });
    expect(batchRequests).toEqual([
      [
        { case_id: CASE_ONE.id, data_collection_id: SHARED.id },
        { case_id: CASE_TWO.id, data_collection_id: SHARED.id },
      ],
    ]);
  });

  it('does not apply the share to the cases when sharing is set to No', async () => {
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType(), rows: [CASE_ONE] });

    await fillEventDetails(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await selectOption(screen, 'Share in data collections', SHARED.name);
    await closePopup(screen);
    await selectOption(screen, SHARING_LABEL, 'No');
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toHaveLength(1);
    expect(requestedPaths).not.toContain('POST /v1/retrieve/case_rights');
    expect(batchRequests).toEqual([]);
  });

  it('creates the event without rows and skips linking cases', async () => {
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await fillEventDetails(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await selectOption(screen, 'Share in data collections', SHARED.name);
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toEqual([expect.objectContaining({ case_ids: [] })]);
    expect(requestedPaths).toContain('POST /v1/case_set_members/query');
    expect(requestedPaths).not.toContain('POST /v1/retrieve/case_rights');
    expect(batchRequests).toEqual([]);
  });

  it('removes the create-in data collection from the shared data collections', async () => {
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await fillEventDetails(screen);
    await selectOption(screen, 'Share in data collections', PRIVATE_ONE.name);
    await closePopup(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toHaveLength(1);
    expect(createCaseSetRequests[0]).toMatchObject({
      case_set: { created_in_data_collection_id: PRIVATE_ONE.id },
      data_collection_ids: [],
    });
  });

  it('automatically selects the only eligible create-in data collection', async () => {
    accessMap = {
      [PRIVATE_ONE.id]: createAccess(PRIVATE_ONE.id, { add_case_set: true, is_private: true }),
      [SHARED.id]: createAccess(SHARED.id, { add_case_set: true }),
    };
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await fillEventDetails(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toHaveLength(1);
    expect(createCaseSetRequests[0]).toMatchObject({
      case_set: { created_in_data_collection_id: PRIVATE_ONE.id },
    });
  });

  it('shows a permission message and no save button when there are no case types', async () => {
    caseTypes = [];
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await expect.element(screen.getByText(/You do not have the required permissions to create an event\./)).toBeVisible();
    expect(screen.getByTestId('CreateEventDialog-saveButton').query()).toBeNull();
  });

  it('shows a permission message and no save button when there are no data collections', async () => {
    dataCollections = [];
    const { screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await expect.element(screen.getByText(/You do not have the required permissions to create an event\./)).toBeVisible();
    expect(screen.getByTestId('CreateEventDialog-saveButton').query()).toBeNull();
  });

  it('creates the event for a case type selected by the user', async () => {
    const { onClose, screen } = await renderDialog({});

    await selectOption(screen, 'Case type', CASE_TYPE.name);
    await fillEventDetails(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(createCaseSetRequests).toHaveLength(1);
    expect(createCaseSetRequests[0]).toMatchObject({
      case_set: { case_type_id: CASE_TYPE_ID, created_in_data_collection_id: PRIVATE_ONE.id },
    });
  });

  it('shows a generic error when the selected complete case type fails to load', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', () => Response.json({ detail: 'Internal error' }, { status: 500 }));
    const { screen } = await renderDialog({});

    await selectOption(screen, 'Case type', CASE_TYPE.name);

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeVisible();
  });

  it('shows an error notification and closes when creating the event fails', async () => {
    mockApiRequest('POST', '/v1/create/case_set', () => Response.json({ detail: 'Internal error' }, { status: 500 }));
    const { onClose, screen } = await renderDialog({ completeCaseType: createDialogCompleteCaseType() });

    await fillEventDetails(screen);
    await selectOption(screen, 'Create in data collection', PRIVATE_ONE.name);
    await closePopup(screen);
    await screen.getByTestId('CreateEventDialog-saveButton').click();

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(getNotifications().map(notification => notification.severity)).toContain('error');
  });
});
