import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm } from '@gen-epix/api-seqdb';
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

import { TreeAlgorithmsAdminPage } from './TreeAlgorithmsAdminPage';

type TreeAlgorithmFixture = { readonly id: null | string } & Partial<Omit<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm, 'id'>>;

const TREE_ALGORITHMS_PATH = '/v1/tree_algorithms';
const TREE_ALGORITHM_CLASSES_PATH = '/v1/tree_algorithm_classes';
const ROUTE_PATH = '/management/tree-algorithms';
const URL = '/management/tree-algorithms';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const TREE_ALGORITHM_PERMISSIONS = [
  { command_name: SeqDbCommandName.TreeAlgorithmCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.TreeAlgorithmCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.TreeAlgorithmCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const treeOneFixture: TreeAlgorithmFixture = {
  code: 'UPGMA',
  description: 'First tree algorithm',
  id: 'tree-one',
  is_ultrametric: true,
  name: 'Tree one',
  rank: 2,
  tree_algorithm_class_id: 'class-one',
};

const treeNoNameFixture: TreeAlgorithmFixture = {
  code: 'WPGMA',
  description: null,
  id: 'tree-no-name',
  is_ultrametric: false,
  name: '',
  rank: null,
  tree_algorithm_class_id: 'class-one',
};

const treeIdOnlyFixture: TreeAlgorithmFixture = {
  description: null,
  id: 'tree-id-only',
  is_ultrametric: false,
  name: '',
  rank: null,
  tree_algorithm_class_id: 'class-one',
};

const treeNoIdFixture: TreeAlgorithmFixture = {
  code: 'SLINK',
  description: null,
  id: null,
  is_ultrametric: false,
  name: '',
  rank: null,
  tree_algorithm_class_id: 'class-one',
};

const treeNoIdNoCodeFixture: TreeAlgorithmFixture = {
  description: null,
  id: null,
  is_ultrametric: false,
  name: '',
  rank: null,
  tree_algorithm_class_id: 'class-one',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockTreeAlgorithmClasses = () => {
  mockApiRequest('GET', TREE_ALGORITHM_CLASSES_PATH, () => Response.json([
    { code: 'CLS-1', id: 'class-one', name: 'Class one' },
  ]));
};

const renderPage = async (
  initialItems: TreeAlgorithmFixture[] = [treeOneFixture],
  permissions: CommonDbApiPermission[] = TREE_ALGORITHM_PERMISSIONS,
) => {
  mockTreeAlgorithmClasses();
  const mock = mockCrudApi(TREE_ALGORITHMS_PATH, initialItems as ({ readonly id: string } & SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm)[]);
  const screen = await renderRoutedPage(
    <TreeAlgorithmsAdminPage />, {
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

const fillRequiredFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], name: string) => {
  await screen.getByRole('combobox', { exact: true, name: 'Algorithm code' }).click();
  await screen.getByRole('option', { exact: true, name: 'UPGMA' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill(name);
  await screen.getByRole('combobox', { exact: true, name: 'Tree algorithm class' }).click();
  await screen.getByRole('option', { exact: true, name: 'CLS-1 - Class one' }).click();
  await screen.getByRole('switch', { name: 'Ultrametric' }).click();
};

describe('TreeAlgorithmsAdminPage', () => {
  it('lists the tree algorithms', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Tree one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'UPGMA' })).toBeInTheDocument();
  });

  it('creates a tree algorithm with its class, switch, rank and description', async () => {
    const { screen } = await renderPage([]);
    const postBodies: Partial<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>[] = [];
    mockApiRequest('POST', TREE_ALGORITHMS_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-tree' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new tree algorithm', { exact: true })).toBeVisible();
    await fillRequiredFields(screen, 'New tree');
    await screen.getByRole('textbox', { exact: true, name: 'Description' }).fill('Created in test');
    await screen.getByRole('spinbutton', { exact: true, name: 'Rank' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({
      code: 'UPGMA',
      description: 'Created in test',
      is_ultrametric: true,
      name: 'New tree',
      rank: 3,
      tree_algorithm_class_id: 'class-one',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New tree')]));
  });

  it('omits the rank when the field is cleared', async () => {
    const { screen } = await renderPage([]);
    const postBodies: Partial<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>[] = [];
    mockApiRequest('POST', TREE_ALGORITHMS_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbGenEpixSeqdbDomainModelSeqTreeTreeAlgorithm>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-tree' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen, 'New tree');
    const rankField = screen.getByRole('spinbutton', { exact: true, name: 'Rank' });
    await rankField.fill('3');
    await rankField.fill('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]?.rank).toBeUndefined();
  });

  it('does not create a tree algorithm without an algorithm code', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', TREE_ALGORITHMS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({}, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('No code');
    await screen.getByRole('combobox', { exact: true, name: 'Tree algorithm class' }).click();
    await screen.getByRole('option', { exact: true, name: 'CLS-1 - Class one' }).click();
    await screen.getByRole('switch', { name: 'Ultrametric' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new tree algorithm', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);
  });

  it('does not create a tree algorithm with a description longer than 1000 characters', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', TREE_ALGORITHMS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({}, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen, 'Long description');
    await screen.getByRole('textbox', { exact: true, name: 'Description' }).fill('a'.repeat(1001));
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new tree algorithm', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);
  });

  it('does not create a tree algorithm with a negative rank', async () => {
    const { screen } = await renderPage([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', TREE_ALGORITHMS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({}, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen, 'Negative rank');
    await screen.getByRole('spinbutton', { exact: true, name: 'Rank' }).fill('-1');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new tree algorithm', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);
  });

  it('titles the edit dialog with the name of the item', async () => {
    const { screen } = await renderPage();

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: Tree one', { exact: true })).toBeVisible();
  });

  it('titles the edit dialog with the code of an item without a name', async () => {
    const { screen } = await renderPage([treeNoNameFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: WPGMA', { exact: true })).toBeVisible();
  });

  it('titles the edit dialog with the ID of an item without a name or code', async () => {
    const { screen } = await renderPage([treeIdOnlyFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: tree-id-only', { exact: true })).toBeVisible();
  });

  it('updates a tree algorithm', async () => {
    const { mock, screen } = await renderPage();

    await openRowMenuItem(screen, 'Edit');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Tree renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${TREE_ALGORITHMS_PATH}/tree-one`);
    expect(putCall?.body).toMatchObject({ id: 'tree-one', name: 'Tree renamed', tree_algorithm_class_id: 'class-one' });
  });

  it('deletes a tree algorithm', async () => {
    const { mock, screen } = await renderPage();

    await openRowMenuItem(screen, 'Delete');
    await expect.element(screen.getByRole('heading', { name: 'Delete item: Tree one' })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${TREE_ALGORITHMS_PATH}/tree-one`);
  });

  it('names the failed deletion of an item without an ID by its code', async () => {
    const { mock, screen } = await renderPage([treeNoIdFixture]);

    await openRowMenuItem(screen, 'Delete');
    await expect.element(screen.getByRole('heading', { name: 'Delete item: SLINK' })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Tree algorithm "SLINK" could not be deleted.']));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('reports a failed deletion of an item without an ID, code or name without a name', async () => {
    const { screen } = await renderPage([treeNoIdNoCodeFixture]);

    await openRowMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Tree algorithm could not be deleted.']));
  });
});
