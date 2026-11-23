import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSample } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { SamplesAdminPage } from './SamplesAdminPage';

const SAMPLES_PATH = '/v1/samples';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const ROUTE_PATH = '/management/samples';
const URL = '/management/samples';

const SAMPLE_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SampleCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const dataCollectionFixture = { id: 'collection-one', name: 'Collection one' };

const sampleWithCodeFixture: SeqDbSample = {
  code: '  SAMPLE-A  ',
  created_in_data_collection_id: 'collection-one',
  id: 'sample-a',
  props: { note: 'kept' },
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPageWithItems = async (items: SeqDbSample[]) => {
  mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([dataCollectionFixture]));
  const mock = mockCrudApi(SAMPLES_PATH, items as ({ readonly id: string } & SeqDbSample)[]);
  const screen = await renderRoutedPage(
    <SamplesAdminPage />, {
      path: ROUTE_PATH,
      permissions: SAMPLE_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPageWithItems>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('SamplesAdminPage', () => {
  it('lists the samples with their code and data collection', async () => {
    const { screen } = await renderPageWithItems([
      sampleWithCodeFixture,
      { created_in_data_collection_id: 'collection-unknown', id: 'sample-b' },
    ]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Collection one' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-A' })).toBeInTheDocument();
  });

  it('creates a sample with a code and a data collection', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sample', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Created in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: 'Collection one' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('SAMPLE-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(1);
    expect(mock.calls.find(call => call.method === 'POST')?.body).toEqual({
      code: 'SAMPLE-NEW',
      created_in_data_collection_id: 'collection-one',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-NEW" has been created.')]));
  });

  it('names a created sample without a code by its data collection', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Created in data collection' }).click();
    await screen.getByRole('option', { exact: true, name: 'Collection one' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Collection one" has been created.')]));
  });

  it('does not create a sample without a data collection', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('SAMPLE-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sample', { exact: true })).toBeVisible();
    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(0);
  });

  it('saves an edited sample with its id and properties and a trimmed code name', async () => {
    const { mock, screen } = await renderPageWithItems([sampleWithCodeFixture]);

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    expect(mock.calls.find(call => call.method === 'PUT')?.body).toEqual({
      code: '  SAMPLE-A  ',
      created_in_data_collection_id: 'collection-one',
      id: 'sample-a',
      props: { note: 'kept' },
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-A" has been saved.')]));
  });

  it('deletes a sample with an ID', async () => {
    const { mock, screen } = await renderPageWithItems([sampleWithCodeFixture]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-A" has been deleted.')]));
  });

  it('names a sample by its raw data collection ID when the code is missing and the lookup does not contain it', async () => {
    const { screen } = await renderPageWithItems([{ created_in_data_collection_id: 'collection-unknown', id: 'sample-b' }]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"collection-unknown" has been deleted.')]));
  });

  it('names a sample by its ID when it has no code and no data collection', async () => {
    const { screen } = await renderPageWithItems([{ code: null, created_in_data_collection_id: '', id: 'sample-c' }]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"sample-c" has been deleted.')]));
  });

  it('reports a delete error for a sample without an ID, without a name', async () => {
    const { screen } = await renderPageWithItems([{ code: '   ', created_in_data_collection_id: '', id: '' }]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sample could not be deleted.']));
  });

  it('hides the create action without permissions', async () => {
    mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([dataCollectionFixture]));
    mockCrudApi(SAMPLES_PATH, [sampleWithCodeFixture] as ({ readonly id: string } & SeqDbSample)[]);
    const screen = await renderRoutedPage(
      <SamplesAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Collection one' }).first()).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
