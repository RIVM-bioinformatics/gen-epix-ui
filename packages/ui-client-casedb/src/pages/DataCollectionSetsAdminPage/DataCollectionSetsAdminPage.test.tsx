import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbDataCollection,
  CaseDbDataCollectionSet,
  CaseDbDataCollectionSetMember,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { DataCollectionSetsAdminPage } from './DataCollectionSetsAdminPage';

type DataCollectionSetFixture = { readonly id: string } & CaseDbDataCollectionSet;

type MembershipPutCall = {
  readonly body: { readonly data_collection_set_members: readonly CaseDbDataCollectionSetMember[] };
  readonly pathname: string;
};

const DATA_COLLECTION_SETS_PATH = '/v1/data_collection_sets';
const DATA_COLLECTION_SET_MEMBERS_PATH = '/v1/data_collection_set_members';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const ROUTE_PATH = '/management/data-collection-sets';
const URL = '/management/data-collection-sets';

const DATA_COLLECTION_SET_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.DataCollectionSetCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.DataCollectionSetCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.DataCollectionSetCrudCommand, permission_type: CaseDbPermissionType.DELETE },
  { command_name: CaseDbCommandName.DataCollectionSetDataCollectionUpdateAssociationCommand, permission_type: CaseDbPermissionType.EXECUTE },
];

const COLLECTION_ONE_ID = '3d2b9c1e-5f4a-4b8e-9c7d-1a2b3c4d5e6f';
const COLLECTION_TWO_ID = '7a1f0e2d-8c3b-4d6a-a5e9-2f1b0c9d8e7a';
const COLLECTION_THREE_ID = '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b';

const collectionOneFixture: CaseDbDataCollection = {
  description: null,
  id: COLLECTION_ONE_ID,
  name: 'Collection one',
};

const collectionTwoFixture: CaseDbDataCollection = {
  description: null,
  id: COLLECTION_TWO_ID,
  name: 'Collection two',
};

const collectionThreeFixture: CaseDbDataCollection = {
  description: null,
  id: COLLECTION_THREE_ID,
  name: 'Collection three',
};

const DATA_COLLECTIONS = [collectionOneFixture, collectionTwoFixture, collectionThreeFixture];

const setAlphaFixture: DataCollectionSetFixture = {
  description: 'Alpha description',
  id: 'set-alpha',
  name: 'Alpha set',
};

const setBetaFixture: DataCollectionSetFixture = {
  description: null,
  id: 'set-beta',
  name: 'Beta set',
};

const MEMBERSHIPS: CaseDbDataCollectionSetMember[] = [
  { data_collection_id: COLLECTION_ONE_ID, data_collection_set_id: 'set-alpha' },
  { data_collection_id: COLLECTION_TWO_ID, data_collection_set_id: 'set-alpha' },
];

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: DataCollectionSetFixture[] = [setAlphaFixture, setBetaFixture],
  permissions = DATA_COLLECTION_SET_PERMISSIONS,
  membershipsResponder: () => Promise<Response> | Response = () => Response.json(MEMBERSHIPS),
) => {
  const mock = mockCrudApi(DATA_COLLECTION_SETS_PATH, initialItems);
  mockApiRequest('GET', DATA_COLLECTION_SETS_PATH, () => Response.json(mock.items));
  const membershipPuts: MembershipPutCall[] = [];
  mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json(DATA_COLLECTIONS));
  mockApiRequest('GET', DATA_COLLECTION_SET_MEMBERS_PATH, membershipsResponder);
  for (const id of ['set-alpha', 'set-beta', 'created-3']) {
    const pathname = `${DATA_COLLECTION_SETS_PATH}/${id}/data_collections`;
    mockApiRequest('PUT', pathname, async (request) => {
      const body = (await request.json()) as MembershipPutCall['body'];
      membershipPuts.push({ body, pathname });
      return Response.json({});
    });
  }
  const screen = await renderRoutedPage(
    <DataCollectionSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { membershipPuts, mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('DataCollectionSetsAdminPage', () => {
  it('lists the data collection sets with their data collection count', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '2 / 3' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '0 / 3' })).toBeInTheDocument();
  });

  it('renders no rows until the data collection set memberships have loaded', async () => {
    let releaseMemberships: () => void = () => undefined;
    const membershipsGate = new Promise<void>((resolve) => {
      releaseMemberships = resolve;
    });
    const { screen } = await renderPage(undefined, undefined, async () => {
      await membershipsGate;
      return Response.json(MEMBERSHIPS);
    });

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeDisabled();
    expect(screen.getByRole('cell', { exact: true, name: 'Alpha set' }).query()).toBeNull();

    releaseMemberships();

    await expect.element(screen.getByRole('cell', { exact: true, name: '2 / 3' })).toBeInTheDocument();
  });

  it('renders no rows when the memberships response has no data', async () => {
    const { screen } = await renderPage(undefined, undefined, () => new Response(null, { status: 204 }));

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeEnabled();
    expect(screen.getByRole('cell', { exact: true, name: 'Alpha set' }).query()).toBeNull();
    expect(screen.getByRole('cell', { exact: true, name: 'Beta set' }).query()).toBeNull();
  });

  it('creates a data collection set and synchronizes its selected data collections', async () => {
    const { membershipPuts, mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new data collection set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma set');
    await screen.getByText('Collection two', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(DATA_COLLECTION_SETS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ name: 'Gamma set' }));

    await expect.poll(() => membershipPuts.length).toBe(1);
    expect(membershipPuts[0]?.pathname).toBe(`${DATA_COLLECTION_SETS_PATH}/created-3/data_collections`);
    expect(membershipPuts[0]?.body).toEqual({
      data_collection_set_members: [{ data_collection_id: COLLECTION_TWO_ID, data_collection_set_id: 'created-3' }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a data collection set and replaces its data collection membership', async () => {
    const { membershipPuts, mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByText('Collection one', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected left' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DATA_COLLECTION_SETS_PATH}/set-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'set-alpha', name: 'Alpha renamed' }));

    await expect.poll(() => membershipPuts.length).toBe(1);
    expect(membershipPuts[0]?.pathname).toBe(`${DATA_COLLECTION_SETS_PATH}/set-alpha/data_collections`);
    expect(membershipPuts[0]?.body).toEqual({
      data_collection_set_members: [{ data_collection_id: COLLECTION_TWO_ID, data_collection_set_id: 'set-alpha' }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a data collection set via the data collection sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DATA_COLLECTION_SETS_PATH}/set-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([setAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
