import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type {
  CaseDbCaseRights,
  CaseDbCaseSet,
  CaseDbCaseSetDataCollectionLink,
  CaseDbCaseSetRights,
  CaseDbDataCollection,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { container } from 'tsyringe';

import { renderComponent } from '../../../test/lib';
import { CaseAbacContextProvider } from '../../../context/caseAbac';
import type { CaseAbacContext } from '../../../context/caseAbac';

import { CaseSetSharingForm } from './CaseSetSharingForm';

const FORM_ID = 'case-set-sharing-form';
const SUBMIT_BUTTON_TEST_ID = 'CaseSetSharingForm-submitButton';
const CASE_SET_ID = '6b1c3a9e-2f4d-4c8a-9e7b-1a2b3c4d5e6f';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const CASE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const LINK_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const DATA_COLLECTION_1_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const DATA_COLLECTION_2_ID = '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b';
const DATA_COLLECTION_1: CaseDbDataCollection = { id: DATA_COLLECTION_1_ID, name: 'Data collection one' };
const DATA_COLLECTION_2: CaseDbDataCollection = { id: DATA_COLLECTION_2_ID, name: 'Data collection two' };
const APPLY_LABEL = 'Should the same sharing be applied to the cases in the event?';

const createCaseSet = (): CaseDbCaseSet => {
  return {
    case_set_category_id: '1f2e3d4c-5b6a-4789-8abc-0d1e2f3a4b5c',
    case_set_status_id: '2a3b4c5d-6e7f-4801-9a2b-3c4d5e6f7a8b',
    case_type_id: CASE_TYPE_ID,
    code: 'event-code',
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    description: 'Event description',
    id: CASE_SET_ID,
    name: 'Event one',
  };
};

const createRights = (overrides: Partial<CaseDbCaseSetRights> = {}): CaseDbCaseSetRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_set_id: CASE_SET_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    data_collection_ids: [DATA_COLLECTION_1_ID, DATA_COLLECTION_2_ID],
    is_full_access: true,
    read_case_set: true,
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_1_ID],
    write_case_set: true,
    ...overrides,
  };
};

const createLink = (): CaseDbCaseSetDataCollectionLink => {
  return {
    case_set_id: CASE_SET_ID,
    data_collection_id: DATA_COLLECTION_1_ID,
    id: LINK_ID,
  };
};

const createCaseRightsRow = (): CaseDbCaseRights => {
  return {
    add_data_collection_ids: [],
    can_delete: false,
    case_id: CASE_ID,
    case_type_id: CASE_TYPE_ID,
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    data_collection_ids: [DATA_COLLECTION_1_ID, DATA_COLLECTION_2_ID],
    is_full_access: true,
    read_col_ids: [],
    remove_data_collection_ids: [],
    shared_in_data_collection_ids: [DATA_COLLECTION_1_ID],
    write_col_ids: [],
  };
};

const createCaseAbac = ({
  itemDataCollectionLinks = [[createLink()]],
  rights = [createRights()],
}: {
  itemDataCollectionLinks?: CaseDbCaseSetDataCollectionLink[][];
  rights?: CaseDbCaseSetRights[];
} = {}): CaseAbacContext => {
  return {
    createdInDataCollection: DATA_COLLECTION_1,
    itemDataCollectionLinks,
    rights,
    userDataCollectionOptions: [
      { label: DATA_COLLECTION_1.name, value: DATA_COLLECTION_1_ID },
      { label: DATA_COLLECTION_2.name, value: DATA_COLLECTION_2_ID },
    ],
    userDataCollections: [DATA_COLLECTION_1, DATA_COLLECTION_2],
    userDataCollectionsMap: new Map([
      [DATA_COLLECTION_1_ID, DATA_COLLECTION_1],
      [DATA_COLLECTION_2_ID, DATA_COLLECTION_2],
    ]),
  };
};

const getNotifications = () => {
  return container.resolve(NotificationService).data.map((notification) => {
    return { message: notification.message, severity: notification.severity };
  });
};

const renderForm = async ({
  caseAbac = createCaseAbac(),
  onFinish = vi.fn<() => void>(),
  onIsSavingChange = vi.fn<(isSaving: boolean) => void>(),
}: {
  caseAbac?: CaseAbacContext;
  onFinish?: ReturnType<typeof vi.fn<() => void>>;
  onIsSavingChange?: ReturnType<typeof vi.fn<(isSaving: boolean) => void>>;
} = {}) => {
  const screen = await renderComponent(
    <CaseAbacContextProvider caseAbac={caseAbac}>
      <CaseSetSharingForm
        caseSet={createCaseSet()}
        caseTypeId={CASE_TYPE_ID}
        formId={FORM_ID}
        onFinish={onFinish}
        onIsSavingChange={onIsSavingChange}
      />
      <button
        {...TestIdUtil.createAttributes(SUBMIT_BUTTON_TEST_ID)}
        form={FORM_ID}
        type={'submit'}
      >
        {'Save'}
      </button>
    </CaseAbacContextProvider>,
  );
  return { onFinish, onIsSavingChange, screen };
};

const toggleDataCollection = async (screen: Awaited<ReturnType<typeof renderForm>>['screen'], dataCollectionName: string) => {
  await screen.getByRole('combobox', { name: 'Data collections' }).click();
  await screen.getByRole('option', { exact: true, name: dataCollectionName }).click();
  await userEvent.keyboard('{Escape}');
};

const setShouldApplySharingToCases = async (screen: Awaited<ReturnType<typeof renderForm>>['screen'], shouldApply: boolean) => {
  await screen.getByRole('combobox', { name: APPLY_LABEL }).click();
  await screen.getByRole('option', { exact: true, name: shouldApply ? 'Yes' : 'No' }).click();
};

describe('CaseSetSharingForm', () => {
  let caseSetLinkBatchBodies: unknown[];
  let caseSetLinkDeleteIds: string[];
  let caseLinkBatchBodies: unknown[];

  beforeEach(() => {
    caseSetLinkBatchBodies = [];
    caseSetLinkDeleteIds = [];
    caseLinkBatchBodies = [];

    mockApiRequest('POST', '/v1/case_set_data_collection_links/batch', async (request) => {
      caseSetLinkBatchBodies.push(await request.json());
      return Response.json([]);
    });
    mockApiRequest('DELETE', '/v1/case_set_data_collection_links/batch', (request) => {
      caseSetLinkDeleteIds.push(new URL(request.url).searchParams.get('ids') ?? '');
      return new Response(null, { status: 204 });
    });
    mockApiRequest('POST', '/v1/case_set_members/query', () => Response.json([{ case_id: CASE_ID }]));
    mockApiRequest('POST', '/v1/retrieve/case_rights', () => {
      return Response.json([createCaseRightsRow()]);
    });
    mockApiRequest('POST', '/v1/case_data_collection_links/batch', async (request) => {
      caseLinkBatchBodies.push(await request.json());
      return Response.json([]);
    });
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('saves added and removed data collections and does not apply them to the cases', async () => {
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_1.name);
    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(caseSetLinkBatchBodies).toEqual([[{ case_set_id: CASE_SET_ID, data_collection_id: DATA_COLLECTION_2_ID }]]);
    expect(caseSetLinkDeleteIds).toEqual([LINK_ID]);
    expect(caseLinkBatchBodies).toEqual([]);
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
    await expect.poll(getNotifications).toContainEqual({ message: 'Successfully saved case set data collections.', severity: 'success' });
  });

  it('applies the data collections to the cases of the event when requested', async () => {
    const { onFinish, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(caseSetLinkBatchBodies).toEqual([[{ case_set_id: CASE_SET_ID, data_collection_id: DATA_COLLECTION_2_ID }]]);
    expect(caseSetLinkDeleteIds).toEqual([]);
    expect(caseLinkBatchBodies).toEqual([[{ case_id: CASE_ID, data_collection_id: DATA_COLLECTION_2_ID }]]);
    await expect.poll(getNotifications).toContainEqual({ message: 'Sharing has been applied to the cases', severity: 'success' });
  });

  it('does not change any links when the data collections are unchanged', async () => {
    const { onFinish, screen } = await renderForm();

    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(caseSetLinkBatchBodies).toEqual([]);
    expect(caseSetLinkDeleteIds).toEqual([]);
    expect(caseLinkBatchBodies).toEqual([]);
    await expect.poll(getNotifications).toContainEqual({ message: 'Successfully saved case set data collections.', severity: 'success' });
  });

  it('shows a spinner while saving and the form again afterwards', async () => {
    let resolveSave: (response: Response) => void = () => undefined;
    mockApiRequest('POST', '/v1/case_set_data_collection_links/batch', async () => {
      return new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });
    });
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.element(screen.getByText('Saving case set data collections')).toBeVisible();
    await expect.poll(() => onIsSavingChange.mock.calls).toEqual([[true]]);

    resolveSave(Response.json([]));

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole('combobox', { name: 'Data collections' })).toBeVisible();
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('shows an error notification when saving fails and still finishes', async () => {
    mockApiRequest('POST', '/v1/case_set_data_collection_links/batch', () => new Response(null, { status: 500 }));
    const { onFinish, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case set data collections.', severity: 'error' });
    expect(caseLinkBatchBodies).toEqual([]);
  });

  it('shows an error notification when the links to remove are not loaded', async () => {
    const { onFinish, screen } = await renderForm({ caseAbac: createCaseAbac({ itemDataCollectionLinks: [] }) });

    await toggleDataCollection(screen, DATA_COLLECTION_1.name);
    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case set data collections.', severity: 'error' });
    expect(caseSetLinkDeleteIds).toEqual([]);
  });

  it('shows an error notification when the rights are not loaded', async () => {
    const { onFinish, screen } = await renderForm({ caseAbac: createCaseAbac({ rights: [] }) });

    await setShouldApplySharingToCases(screen, false);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case set data collections.', severity: 'error' });
    expect(caseSetLinkBatchBodies).toEqual([]);
  });
});
