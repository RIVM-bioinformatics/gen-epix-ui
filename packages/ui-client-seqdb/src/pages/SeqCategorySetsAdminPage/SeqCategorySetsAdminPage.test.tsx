import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeqCategorySet } from '@gen-epix/api-seqdb';
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

import { SeqCategorySetsAdminPage } from './SeqCategorySetsAdminPage';

type SeqCategorySetFixture = SeqDbSeqCategorySet;

const SETS_PATH = '/v1/seq_category_sets';
const ROUTE_PATH = '/management/seq-category-sets';
const URL = '/management/seq-category-sets';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const SET_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SeqCategorySetCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const setAlphaFixture: SeqCategorySetFixture = {
  code: 'CS-ALPHA',
  id: 'set-alpha',
  name: 'Alpha set',
};

const setBetaFixture: SeqCategorySetFixture = {
  code: 'CS-BETA',
  id: 'set-beta',
  name: 'Beta set',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: SeqCategorySetFixture[] = [setAlphaFixture, setBetaFixture]) => {
  const mock = mockCrudApi(SETS_PATH, initialItems as ({ readonly id: string } & SeqDbSeqCategorySet)[]);
  const screen = await renderRoutedPage(
    <SeqCategorySetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: SET_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Renders the page with a single GET row so that the row's ID, name and code can be shaped per test.
 */
const renderPageWithRow = async (row: SeqCategorySetFixture) => {
  mockCrudApi(SETS_PATH, [row] as ({ readonly id: string } & SeqDbSeqCategorySet)[]);
  return renderRoutedPage(
    <SeqCategorySetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: SET_PERMISSIONS,
      url: URL,
    },
  );
};

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('SeqCategorySetsAdminPage', () => {
  it('lists the sets with their code and name', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'CS-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta set' })).toBeInTheDocument();
  });

  it('creates a set via the sequence category sets endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', SETS_PATH, async (request) => {
      const body = await request.json() as Partial<SeqCategorySetFixture>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-set' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence category set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CS-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'CS-NEW', name: 'New set' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"New set" has been created.')]));
  });

  it('does not create a set when the name is missing', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', SETS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-set' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CS-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence category set', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('does not create a set when the code is missing', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', SETS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-set' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence category set', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('saves an edited set with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Alpha set" has been saved.')]));
  });

  it('deletes a set with an ID', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('names a set by its ID when it has no name', async () => {
    const screen = await renderPageWithRow({ code: '', id: 'set-gamma', name: '' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"set-gamma" has been deleted.')]));
  });

  it('names a set by its code when it has no name and no ID', async () => {
    const screen = await renderPageWithRow({ code: 'CS-CODE-ONLY', id: '', name: '' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sequence category set "CS-CODE-ONLY" could not be deleted.']));
  });

  it('omits the name from the delete error when a set has no ID, name or code', async () => {
    const screen = await renderPageWithRow({ code: '', id: '', name: '' });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sequence category set could not be deleted.']));
  });

  it('hides the create action without permissions', async () => {
    mockCrudApi(SETS_PATH, [setAlphaFixture] as ({ readonly id: string } & SeqDbSeqCategorySet)[]);
    const screen = await renderRoutedPage(
      <SeqCategorySetsAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
