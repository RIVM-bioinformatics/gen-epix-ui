import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  SeqDbSeqCategory,
  SeqDbSeqCategorySet,
} from '@gen-epix/api-seqdb';
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

import { SeqCategoriesAdminPage } from './SeqCategoriesAdminPage';

const CATEGORIES_PATH = '/v1/seq_categories';
const SETS_PATH = '/v1/seq_category_sets';
const ROUTE_PATH = '/management/seq-categories';
const URL = '/management/seq-categories';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const CATEGORY_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SeqCategoryCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const setFixture: SeqDbSeqCategorySet = {
  code: 'SET-1',
  id: 'set-one',
  name: 'Set one',
};

const categoryAlphaFixture: SeqDbSeqCategory = {
  code: 'CAT-ALPHA',
  id: 'cat-alpha',
  name: 'Alpha category',
  seq_category_set_id: 'set-one',
};

const categoryBetaFixture: SeqDbSeqCategory = {
  code: 'CAT-BETA',
  id: 'cat-beta',
  name: 'Beta category',
  seq_category_set_id: 'set-one',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', SETS_PATH, () => Response.json([setFixture]));
};

const renderPage = async (initialItems: SeqDbSeqCategory[] = [categoryAlphaFixture, categoryBetaFixture]) => {
  mockLookups();
  const mock = mockCrudApi(CATEGORIES_PATH, initialItems as ({ readonly id: string } & SeqDbSeqCategory)[]);
  const screen = await renderRoutedPage(
    <SeqCategoriesAdminPage />, {
      path: ROUTE_PATH,
      permissions: CATEGORY_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Renders the page with a single GET row so that the row's ID, name and code can be shaped per test.
 */
const renderPageWithRow = async (row: SeqDbSeqCategory) => {
  mockLookups();
  mockCrudApi(CATEGORIES_PATH, [row] as ({ readonly id: string } & SeqDbSeqCategory)[]);
  return renderRoutedPage(
    <SeqCategoriesAdminPage />, {
      path: ROUTE_PATH,
      permissions: CATEGORY_PERMISSIONS,
      url: URL,
    },
  );
};

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('SeqCategoriesAdminPage', () => {
  it('lists the categories with their code, name and sequence category set', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'CAT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha category' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SET-1 - Set one' }).first()).toBeInTheDocument();
  });

  it('creates a category linked to the selected sequence category set', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', CATEGORIES_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbSeqCategory>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-category' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence category', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CAT-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New category');
    await screen.getByRole('combobox', { name: 'Sequence category set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-1 - Set one' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      code: 'CAT-NEW',
      name: 'New category',
      seq_category_set_id: 'set-one',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"New category" has been created.')]));
  });

  it('does not create a category when no sequence category set is selected', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', CATEGORIES_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-category' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CAT-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New category');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence category', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('does not create a category when the name is missing', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', CATEGORIES_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-category' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CAT-NEW');
    await screen.getByRole('combobox', { name: 'Sequence category set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-1 - Set one' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence category', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('saves an edited category with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Alpha category" has been saved.')]));
  });

  it('deletes a category with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('names a category by its code when it has no name', async () => {
    const screen = await renderPageWithRow({ code: 'CAT-CODE-ONLY', id: 'cat-code', name: '', seq_category_set_id: 'set-one' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"CAT-CODE-ONLY" has been deleted.')]));
  });

  it('names a category by its ID when it has no name and no code', async () => {
    const screen = await renderPageWithRow({ code: '', id: 'cat-id-only', name: '', seq_category_set_id: 'set-one' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"cat-id-only" has been deleted.')]));
  });

  it('reports a delete error for a category without an ID, named by its name', async () => {
    const screen = await renderPageWithRow({ code: '', id: '', name: 'Orphan category', seq_category_set_id: 'set-one' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sequence category "Orphan category" could not be deleted.']));
  });

  it('omits the name from the delete error when a category has no ID, name, or code', async () => {
    const screen = await renderPageWithRow({ code: '', id: '', name: '', seq_category_set_id: 'set-one' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sequence category could not be deleted.']));
  });

  it('hides the create action without permissions', async () => {
    mockLookups();
    mockCrudApi(CATEGORIES_PATH, [categoryAlphaFixture] as ({ readonly id: string } & SeqDbSeqCategory)[]);
    const screen = await renderRoutedPage(
      <SeqCategoriesAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha category' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
