import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbTreeAlgorithmClass } from '@gen-epix/api-seqdb';
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

import { TreeAlgorithmClassesAdminPage } from './TreeAlgorithmClassesAdminPage';

type TreeAlgorithmClassFixture = { readonly id: null | string } & Partial<Omit<SeqDbTreeAlgorithmClass, 'id'>>;

const TREE_ALGORITHM_CLASSES_PATH = '/v1/tree_algorithm_classes';
const ROUTE_PATH = '/management/tree-algorithm-classes';
const URL = '/management/tree-algorithm-classes';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const TREE_ALGORITHM_CLASS_PERMISSIONS = [
  { command_name: SeqDbCommandName.TreeAlgorithmClassCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.TreeAlgorithmClassCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.TreeAlgorithmClassCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const classOneFixture: TreeAlgorithmClassFixture = {
  code: 'CODE-1',
  id: 'class-one',
  is_dist_based: true,
  is_seq_based: false,
  name: 'Class one',
  rank: 1,
};

const classNoNameFixture: TreeAlgorithmClassFixture = {
  code: 'CODE-X',
  id: 'class-no-name',
  is_dist_based: false,
  is_seq_based: true,
  name: '',
  rank: null,
};

const classNoIdFixture: TreeAlgorithmClassFixture = {
  code: 'CODE-Y',
  id: null,
  is_dist_based: false,
  is_seq_based: false,
  name: '',
  rank: null,
};

const classNoIdNoCodeFixture: TreeAlgorithmClassFixture = {
  code: '',
  id: null,
  is_dist_based: false,
  is_seq_based: false,
  name: '',
  rank: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: TreeAlgorithmClassFixture[] = [classOneFixture],
  permissions: CommonDbApiPermission[] = TREE_ALGORITHM_CLASS_PERMISSIONS,
) => {
  const mock = mockCrudApi(TREE_ALGORITHM_CLASSES_PATH, initialItems as ({ readonly id: string } & SeqDbTreeAlgorithmClass)[]);
  const screen = await renderRoutedPage(
    <TreeAlgorithmClassesAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowMenuItem = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('TreeAlgorithmClassesAdminPage', () => {
  it('lists the tree algorithm classes', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Class one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'CODE-1' })).toBeInTheDocument();
  });

  it('creates a tree algorithm class with its switches and rank', async () => {
    const { screen } = await renderPage([]);
    const postBodies: Partial<SeqDbTreeAlgorithmClass>[] = [];
    mockApiRequest('POST', TREE_ALGORITHM_CLASSES_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbTreeAlgorithmClass>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-class' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new tree algorithm class', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CODE-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New class');
    await screen.getByRole('switch', { name: 'Sequence-based' }).click();
    await screen.getByRole('switch', { name: 'Distance-based' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({
      code: 'CODE-NEW',
      is_dist_based: true,
      is_seq_based: true,
      name: 'New class',
      rank: 3,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New class')]));
  });

  it('does not create a tree algorithm class with a negative rank', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', TREE_ALGORITHM_CLASSES_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({}, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('CODE-NEG');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Negative rank');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('-1');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new tree algorithm class', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);
  });

  it('titles the edit dialog with the name of the item', async () => {
    const { screen } = await renderPage();

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: Class one', { exact: true })).toBeVisible();
  });

  it('titles the edit dialog with the ID of an item without a name', async () => {
    const { screen } = await renderPage([classNoNameFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: class-no-name', { exact: true })).toBeVisible();
  });

  it('updates a tree algorithm class', async () => {
    const { mock, screen } = await renderPage();

    await openRowMenuItem(screen, 'Edit');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Class renamed');
    await screen.getByRole('switch', { name: 'Sequence-based' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${TREE_ALGORITHM_CLASSES_PATH}/class-one`);
    expect(putCall?.body).toMatchObject({ id: 'class-one', is_seq_based: true, name: 'Class renamed' });
  });

  it('deletes a tree algorithm class', async () => {
    const { mock, screen } = await renderPage();

    await openRowMenuItem(screen, 'Delete');
    await expect.element(screen.getByRole('heading', { name: 'Delete item: Class one' })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${TREE_ALGORITHM_CLASSES_PATH}/class-one`);
  });

  it('names the failed deletion of an item without an ID by its code', async () => {
    const { mock, screen } = await renderPage([classNoIdFixture]);

    await openRowMenuItem(screen, 'Delete');
    await expect.element(screen.getByRole('heading', { name: 'Delete item: CODE-Y' })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Tree algorithm class "CODE-Y" could not be deleted.']));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('reports a failed deletion of an item without an ID, code or name without a name', async () => {
    const { screen } = await renderPage([classNoIdNoCodeFixture]);

    await openRowMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Tree algorithm class could not be deleted.']));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([classOneFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Class one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
  });
});
