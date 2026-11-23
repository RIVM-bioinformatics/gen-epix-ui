import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbModelFile } from '@gen-epix/api-seqdb';
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

import { FilesAdminPage } from './FilesAdminPage';

type FileFixture = { readonly id: string } & SeqDbModelFile;

const FILES_PATH = '/v1/files';
const ROUTE_PATH = '/management/files';
const URL = '/management/files';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const FILE_PERMISSIONS = [
  { command_name: SeqDbCommandName.FileCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.FileCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.FileCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const fileOneFixture: FileFixture = {
  content: 'Alpha file content',
  id: 'file-1',
};

const fileTwoFixture: FileFixture = {
  content: 'Beta file content',
  id: 'file-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: FileFixture[] = [fileOneFixture, fileTwoFixture], permissions = FILE_PERMISSIONS) => {
  const mock = mockCrudApi(FILES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <FilesAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockFilePost = (responseBody: (body: Partial<SeqDbModelFile>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', FILES_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbModelFile>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

describe('FilesAdminPage', () => {
  it('lists the files with their IDs and content', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'file-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'file-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha file content' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta file content' })).toBeInTheDocument();
  });

  it('creates a file and names it by its content while saving', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postReleased = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const postBodies: unknown[] = [];
    mockApiRequest('POST', FILES_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbModelFile>;
      postBodies.push(body);
      await postReleased;
      return Response.json({ ...body, id: 'created-file' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new file', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Content' }).fill('Gamma file content');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ content: 'Gamma file content' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Gamma file content')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('shows an error notification when the created file has no ID', async () => {
    const { screen } = await renderPage();
    mockFilePost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Content' }).fill('Gamma file content');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('does not save a file without content', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new file', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new file', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('edits a file and saves the changed content', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: file-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Content' }).fill('Updated file content');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${FILES_PATH}/file-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ content: 'Updated file content', id: 'file-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('shows an error notification when the updated file has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${FILES_PATH}/file-1`, async (request) => {
      const body = await request.json() as Partial<SeqDbModelFile>;
      return Response.json({ content: body.content });
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: file-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Content' }).fill('Updated file content');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('deletes a file and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${FILES_PATH}/file-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([fileOneFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'file-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the files when a file has an empty ID', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([{ content: 'Orphan content', id: '' }]));
    const screen = await renderRoutedPage(
      <FilesAdminPage />, {
        path: ROUTE_PATH,
        permissions: FILE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Orphan content' })).not.toBeInTheDocument();
  });

  it('fails to load the files when a file has no content', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([{ content: 42, id: 'file-broken' }]));
    const screen = await renderRoutedPage(
      <FilesAdminPage />, {
        path: ROUTE_PATH,
        permissions: FILE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'file-broken' })).not.toBeInTheDocument();
  });

  it('fails to load the files when a file has no ID', async () => {
    mockApiRequest('GET', FILES_PATH, () => Response.json([{ content: 'No ID content', id: null }]));
    const screen = await renderRoutedPage(
      <FilesAdminPage />, {
        path: ROUTE_PATH,
        permissions: FILE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'No ID content' })).not.toBeInTheDocument();
  });
});
