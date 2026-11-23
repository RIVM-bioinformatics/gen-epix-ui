import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSampleDataCollectionLink } from '@gen-epix/api-seqdb';
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

import { SampleDataCollectionLinksAdminPage } from './SampleDataCollectionLinksAdminPage';

type LinkFixture = { readonly id: string } & SeqDbSampleDataCollectionLink;

const LINKS_PATH = '/v1/sample_data_collection_links';
const SAMPLES_PATH = '/v1/samples';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const ROUTE_PATH = '/management/sample-data-collection-links';
const URL = '/management/sample-data-collection-links';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const LINK_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SampleDataCollectionLinkCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const linkAlphaFixture: LinkFixture = {
  data_collection_id: 'dc-1',
  id: 'link-alpha',
  sample_id: 'sample-1',
};

const linkBetaFixture: LinkFixture = {
  data_collection_id: 'dc-unknown',
  id: 'link-beta',
  sample_id: 'sample-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
    { code: 'S-1', id: 'sample-1' },
    { id: 'sample-2' },
  ]));
  mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([
    { id: 'dc-1', name: 'Collection 1' },
  ]));
};

const renderPage = async (initialItems: LinkFixture[] = [linkAlphaFixture, linkBetaFixture]) => {
  mockLookups();
  const mock = mockCrudApi(LINKS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SampleDataCollectionLinksAdminPage />, {
      path: ROUTE_PATH,
      permissions: LINK_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockLinkPost = (responseBody: (body: Partial<SeqDbSampleDataCollectionLink>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', LINKS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbSampleDataCollectionLink>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('SampleDataCollectionLinksAdminPage', () => {
  it('lists the links with their sample and data collection labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'S-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Collection 1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'sample-2' })).toBeInTheDocument();
  });

  it('creates a link via the sample data collection links endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockLinkPost(body => ({ ...body, id: 'created-link' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sample data collection link', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('combobox', { name: 'Data collection' }).click();
    await screen.getByRole('option', { exact: true, name: 'Collection 1' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ data_collection_id: 'dc-1', sample_id: 'sample-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('S-1 - Collection 1')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not create a link when a required field is missing', async () => {
    const { screen } = await renderPage();
    const postBodies = mockLinkPost(body => ({ ...body, id: 'created-link' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sample data collection link', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('creates a link when a row without an ID is saved', async () => {
    mockLookups();
    mockApiRequest('GET', LINKS_PATH, () => Response.json([{ data_collection_id: 'dc-1', id: '', sample_id: 'sample-1' }]));
    const postBodies = mockLinkPost(body => ({ ...body, id: 'created-link' }));
    const screen = await renderRoutedPage(
      <SampleDataCollectionLinksAdminPage />, {
        path: ROUTE_PATH,
        permissions: LINK_PERMISSIONS,
        url: URL,
      },
    );

    await screen.getByRole('cell', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ data_collection_id: 'dc-1', sample_id: 'sample-1' }));
  });

  it('names a link by its raw data collection ID when no option matches', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'sample-2' }).click();
    await expect.element(screen.getByText('Edit item: sample-2 - dc-unknown', { exact: true })).toBeVisible();
  });

  it('names a link by its ID when its sample and data collection are empty', async () => {
    mockLookups();
    mockApiRequest('GET', LINKS_PATH, () => Response.json([{ data_collection_id: '', id: 'link-gamma', sample_id: '' }]));
    const screen = await renderRoutedPage(
      <SampleDataCollectionLinksAdminPage />, {
        path: ROUTE_PATH,
        permissions: LINK_PERMISSIONS,
        url: URL,
      },
    );

    await openRowActionMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: link-gamma', { exact: true })).toBeVisible();
  });

  it('omits the name from the delete error when a link has no ID and no sample or data collection', async () => {
    mockLookups();
    mockApiRequest('GET', LINKS_PATH, () => Response.json([{ data_collection_id: '', id: '', sample_id: '' }]));
    const screen = await renderRoutedPage(
      <SampleDataCollectionLinksAdminPage />, {
        path: ROUTE_PATH,
        permissions: LINK_PERMISSIONS,
        url: URL,
      },
    );

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sample data collection link could not be deleted.']));
  });

  it('shows an error notification when deleting a link without an ID', async () => {
    mockLookups();
    mockApiRequest('GET', LINKS_PATH, () => Response.json([{ data_collection_id: 'dc-1', id: '', sample_id: 'sample-1' }]));
    const screen = await renderRoutedPage(
      <SampleDataCollectionLinksAdminPage />, {
        path: ROUTE_PATH,
        permissions: LINK_PERMISSIONS,
        url: URL,
      },
    );

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });

  it('deletes a link with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('saves an edited link with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('hides the create action without permissions', async () => {
    mockLookups();
    mockCrudApi(LINKS_PATH, [linkAlphaFixture]);
    const screen = await renderRoutedPage(
      <SampleDataCollectionLinksAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'S-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
