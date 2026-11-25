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
  CaseDbCase,
  CaseDbCaseDataCollectionLink,
  CaseDbCaseRights,
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

import { CaseSharingForm } from './CaseSharingForm';

const FORM_ID = 'case-sharing-form';
const SUBMIT_BUTTON_TEST_ID = 'CaseSharingForm-submitButton';
const CASE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CASE_TYPE_ID = '3b4c5d6e-7f80-4912-8b3c-4d5e6f7a8b9c';
const LINK_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const DATA_COLLECTION_1_ID = '0c7d2a4e-8b1f-4e6a-9d3c-5f2b1a0e9d8c';
const DATA_COLLECTION_2_ID = '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b';
const DATA_COLLECTION_1: CaseDbDataCollection = { id: DATA_COLLECTION_1_ID, name: 'Data collection one' };
const DATA_COLLECTION_2: CaseDbDataCollection = { id: DATA_COLLECTION_2_ID, name: 'Data collection two' };

const createCase = (): CaseDbCase => {
  return {
    case_type_id: CASE_TYPE_ID,
    content: {},
    created_in_data_collection_id: DATA_COLLECTION_1_ID,
    id: CASE_ID,
  };
};

const createRights = (overrides: Partial<CaseDbCaseRights> = {}): CaseDbCaseRights => {
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
    ...overrides,
  };
};

const createLink = (): CaseDbCaseDataCollectionLink => {
  return {
    case_id: CASE_ID,
    data_collection_id: DATA_COLLECTION_1_ID,
    id: LINK_ID,
  };
};

const createCaseAbac = ({
  itemDataCollectionLinks = [[createLink()]],
  rights = [createRights()],
}: {
  itemDataCollectionLinks?: CaseDbCaseDataCollectionLink[][];
  rights?: CaseDbCaseRights[];
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
  withContext = true,
}: {
  caseAbac?: CaseAbacContext;
  onFinish?: ReturnType<typeof vi.fn<() => void>>;
  onIsSavingChange?: ReturnType<typeof vi.fn<(isSaving: boolean) => void>>;
  withContext?: boolean;
} = {}) => {
  const form = (
    <CaseSharingForm
      caseDbCase={createCase()}
      formId={FORM_ID}
      onFinish={onFinish}
      onIsSavingChange={onIsSavingChange}
    />
  );
  const screen = await renderComponent(
    <>
      {withContext
        ? (
          <CaseAbacContextProvider caseAbac={caseAbac}>
            {form}
          </CaseAbacContextProvider>
        )
        : form}
      <button
        {...TestIdUtil.createAttributes(SUBMIT_BUTTON_TEST_ID)}
        form={FORM_ID}
        type={'submit'}
      >
        {'Save'}
      </button>
    </>,
  );
  return { onFinish, onIsSavingChange, screen };
};

const toggleDataCollection = async (screen: Awaited<ReturnType<typeof renderForm>>['screen'], dataCollectionName: string) => {
  await screen.getByRole('combobox', { name: 'Data collections' }).click();
  await screen.getByRole('option', { exact: true, name: dataCollectionName }).click();
  await userEvent.keyboard('{Escape}');
};

describe('CaseSharingForm', () => {
  let linkBatchBodies: unknown[];
  let linkDeleteIds: string[];

  beforeEach(() => {
    linkBatchBodies = [];
    linkDeleteIds = [];

    mockApiRequest('POST', '/v1/case_data_collection_links/batch', async (request) => {
      linkBatchBodies.push(await request.json());
      return Response.json([]);
    });
    mockApiRequest('DELETE', '/v1/case_data_collection_links/batch', (request) => {
      linkDeleteIds.push(new URL(request.url).searchParams.get('ids') ?? '');
      return new Response(null, { status: 204 });
    });
    mockApiRequest('POST', '/v1/retrieve/case_rights', () => {
      return Response.json([createRights()]);
    });
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
  });

  it('renders the data collection field with the options of the case rights', async () => {
    const { screen } = await renderForm();

    await expect.element(screen.getByRole('heading', { name: 'Data collections' })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Data collections' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: DATA_COLLECTION_1.name })).toBeVisible();
    await expect.element(screen.getByRole('option', { exact: true, name: DATA_COLLECTION_2.name })).toBeVisible();
  });

  it('adds and removes data collections', async () => {
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await toggleDataCollection(screen, DATA_COLLECTION_1.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(linkBatchBodies).toEqual([[{ case_id: CASE_ID, data_collection_id: DATA_COLLECTION_2_ID }]]);
    expect(linkDeleteIds).toEqual([LINK_ID]);
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
    await expect.poll(getNotifications).toContainEqual({ message: 'Successfully saved case data collections.', severity: 'success' });
  });

  it('only adds data collections when none are removed', async () => {
    const { onFinish, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(linkBatchBodies).toEqual([[{ case_id: CASE_ID, data_collection_id: DATA_COLLECTION_2_ID }]]);
    expect(linkDeleteIds).toEqual([]);
  });

  it('only removes data collections when none are added', async () => {
    const { onFinish, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_1.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(linkBatchBodies).toEqual([]);
    expect(linkDeleteIds).toEqual([LINK_ID]);
  });

  it('does not change any links when the data collections are unchanged', async () => {
    const { onFinish, screen } = await renderForm();

    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    expect(linkBatchBodies).toEqual([]);
    expect(linkDeleteIds).toEqual([]);
    await expect.poll(getNotifications).toContainEqual({ message: 'Successfully saved case data collections.', severity: 'success' });
  });

  it('shows a spinner while saving and the form again afterwards', async () => {
    let resolveSave: (response: Response) => void = () => undefined;
    mockApiRequest('POST', '/v1/case_data_collection_links/batch', async () => {
      return new Promise<Response>((resolve) => {
        resolveSave = resolve;
      });
    });
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.element(screen.getByText('Saving case data collections')).toBeVisible();
    await expect.poll(() => onIsSavingChange.mock.calls).toEqual([[true]]);

    resolveSave(Response.json([]));

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole('combobox', { name: 'Data collections' })).toBeVisible();
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
  });

  it('shows an error notification when saving fails and still finishes', async () => {
    mockApiRequest('POST', '/v1/case_data_collection_links/batch', () => new Response(null, { status: 500 }));
    const { onFinish, onIsSavingChange, screen } = await renderForm();

    await toggleDataCollection(screen, DATA_COLLECTION_2.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case data collections.', severity: 'error' });
    expect(onIsSavingChange.mock.calls).toEqual([[true], [false]]);
    expect(linkDeleteIds).toEqual([]);
  });

  it('shows an error notification when the links to remove are not loaded', async () => {
    const { onFinish, screen } = await renderForm({ caseAbac: createCaseAbac({ itemDataCollectionLinks: [] }) });

    await toggleDataCollection(screen, DATA_COLLECTION_1.name);
    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case data collections.', severity: 'error' });
    expect(linkDeleteIds).toEqual([]);
  });

  it('shows an error notification when the case rights are not loaded', async () => {
    const { onFinish, screen } = await renderForm({ caseAbac: createCaseAbac({ rights: [] }) });

    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case data collections.', severity: 'error' });
    expect(linkBatchBodies).toEqual([]);
  });

  it('shows an error notification without a case access context', async () => {
    const { onFinish, screen } = await renderForm({ withContext: false });

    await screen.getByTestId(SUBMIT_BUTTON_TEST_ID).click();

    await expect.poll(() => onFinish).toHaveBeenCalledTimes(1);
    await expect.poll(getNotifications).toContainEqual({ message: 'Could not save case data collections.', severity: 'error' });
    expect(linkBatchBodies).toEqual([]);
    expect(linkDeleteIds).toEqual([]);
  });
});
