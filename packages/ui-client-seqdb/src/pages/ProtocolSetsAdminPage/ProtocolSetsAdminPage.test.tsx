import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbProtocolSet } from '@gen-epix/api-seqdb';
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

import { ProtocolSetsAdminPage } from './ProtocolSetsAdminPage';

type ProtocolSetFixture = { readonly id: string } & SeqDbProtocolSet;

const PROTOCOL_SETS_PATH = '/v1/protocol_sets';
const ROUTE_PATH = '/management/protocol-sets';
const URL = '/management/protocol-sets';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const createPermissions = (permissionTypes: SeqDbPermissionType[]) => permissionTypes.map((permissionType) => ({
  command_name: SeqDbCommandName.ProtocolSetCrudCommand,
  permission_type: permissionType,
})) as unknown as CommonDbApiPermission[];

const ALL_PERMISSIONS = createPermissions([SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE]);

const protocolSetOneFixture: ProtocolSetFixture = {
  code: 'PS-1',
  id: 'protocol-set-1',
  name: 'Set One',
};

const protocolSetTwoFixture: ProtocolSetFixture = {
  code: 'PS-2',
  id: 'protocol-set-2',
  name: 'Set Two',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: ProtocolSetFixture[] = [protocolSetOneFixture, protocolSetTwoFixture], permissions = ALL_PERMISSIONS) => {
  const mock = mockCrudApi(PROTOCOL_SETS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ProtocolSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockProtocolSetPost = (responseBody: (body: Partial<SeqDbProtocolSet>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', PROTOCOL_SETS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbProtocolSet>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

describe('ProtocolSetsAdminPage', () => {
  it('lists the protocol sets with their code and name', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PS-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Set One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'PS-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Set Two' })).toBeInTheDocument();
  });

  it('creates a protocol set via the protocol sets endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolSetPost(body => ({ ...body, id: 'created-protocol-set' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new protocol set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Code' }).fill('PS-NEW');
    await screen.getByRole('textbox', { name: 'Name' }).fill('New set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'PS-NEW', name: 'New set' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New set')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not submit the create form when the name exceeds the maximum length', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolSetPost(body => ({ ...body, id: 'created-protocol-set' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Code' }).fill('PS-NEW');
    await screen.getByRole('textbox', { name: 'Name' }).fill('x'.repeat(101));
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol set', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { name: 'Name' }).fill('Valid name');
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('does not submit the create form when the code is missing', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolSetPost(body => ({ ...body, id: 'created-protocol-set' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Name only');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol set', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { name: 'Code' }).fill('PS-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([protocolSetOneFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PS-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('updates a protocol set via the protocol sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'Set One' }).click();
    await expect.element(screen.getByText('Edit item: Set One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Set Renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROTOCOL_SETS_PATH}/protocol-set-1`);
    expect(putCall?.body).toMatchObject({ code: 'PS-1', name: 'Set Renamed' });
  });

  it('deletes a protocol set via the protocol sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Set One' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')).toEqual(expect.objectContaining({
      pathname: `${PROTOCOL_SETS_PATH}/protocol-set-1`,
    }));
  });

  it('names an edited protocol set by its ID when its name is empty', async () => {
    mockCrudApi(PROTOCOL_SETS_PATH, [{ code: 'CODE-2', id: 'protocol-set-gamma', name: '' }]);
    const screen = await renderRoutedPage(
      <ProtocolSetsAdminPage />, {
        path: ROUTE_PATH,
        permissions: ALL_PERMISSIONS,
        url: URL,
      },
    );

    await screen.getByRole('cell', { exact: true, name: 'CODE-2' }).click();
    await expect.element(screen.getByText('Edit item: protocol-set-gamma', { exact: true })).toBeVisible();
  });

  it('creates instead of updating when the edited protocol set has no ID', async () => {
    const { mock, screen } = await renderPage([{ code: 'CODE-EMPTY', id: '', name: 'Empty ID' }]);
    const postBodies = mockProtocolSetPost(body => ({ ...body, id: 'created-protocol-set' }));

    await screen.getByRole('row').filter({ hasText: 'Empty ID' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({ code: 'CODE-EMPTY', name: 'Renamed' });
    expect(mock.calls.filter(({ method }) => method === 'PUT')).toHaveLength(0);
  });

  it('names an unsaved protocol set by its code when its name and ID are empty', async () => {
    const { screen } = await renderPage([{ code: 'CODE-3', id: '', name: '' }]);

    await screen.getByRole('row').filter({ hasText: 'CODE-3' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"CODE-3" could not be deleted.')]));
  });

  it('shows a delete error without a name when the protocol set has no name, code or ID', async () => {
    const { screen } = await renderPage([{ code: '', id: '', name: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
  });

  it('does not send a delete and shows an error notification when the protocol set has no ID', async () => {
    const { mock, screen } = await renderPage([{ code: 'CODE-EMPTY', id: '', name: 'Empty ID' }]);

    await screen.getByRole('row').filter({ hasText: 'Empty ID' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });
});
