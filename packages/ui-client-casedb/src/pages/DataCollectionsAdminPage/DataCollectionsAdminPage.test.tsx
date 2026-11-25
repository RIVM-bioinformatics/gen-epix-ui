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
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { DataCollectionsAdminPage } from './DataCollectionsAdminPage';

type DataCollectionFixture = { readonly id: string } & CaseDbDataCollection;

const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const ROUTE_PATH = '/management/data-collections';
const URL = '/management/data-collections';

const DATA_COLLECTION_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const collectionAlphaFixture: DataCollectionFixture = {
  description: 'Alpha description',
  id: 'collection-alpha',
  name: 'Alpha collection',
};

const collectionBetaFixture: DataCollectionFixture = {
  description: null,
  id: 'collection-beta',
  name: 'Beta collection',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: DataCollectionFixture[] = [collectionAlphaFixture, collectionBetaFixture], permissions = DATA_COLLECTION_PERMISSIONS) => {
  const mock = mockCrudApi(DATA_COLLECTIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DataCollectionsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('DataCollectionsAdminPage', () => {
  it('lists the data collections from the data collections endpoint', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha collection' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta collection' })).toBeInTheDocument();
  });

  it('creates a data collection via the data collections endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new data collection', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma collection');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(DATA_COLLECTIONS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ name: 'Gamma collection' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a data collection via the data collections endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha collection', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DATA_COLLECTIONS_PATH}/collection-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'collection-alpha', name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a data collection via the data collections endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DATA_COLLECTIONS_PATH}/collection-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([collectionAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha collection' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
