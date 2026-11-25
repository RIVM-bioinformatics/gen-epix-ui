import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbProtocol } from '@gen-epix/api-seqdb';
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

import { ProtocolsAdminPage } from './ProtocolsAdminPage';

const PROTOCOLS_PATH = '/v1/protocols';
const ROUTE_PATH = '/management/protocols';
const URL = '/management/protocols';
const PROPS_LABEL = 'Additional properties (JSON object)';
const PROTOCOL_TYPE_SEQUENCING = 3;

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const createPermissions = (permissionTypes: SeqDbPermissionType[]) => permissionTypes.map((permissionType) => ({
  command_name: SeqDbCommandName.ProtocolCrudCommand,
  permission_type: permissionType,
})) as unknown as CommonDbApiPermission[];

const ALL_PERMISSIONS = createPermissions([SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE]);

const protocolOneFixture: SeqDbProtocol = {
  code: 'P-1',
  id: 'protocol-1',
  is_integer_distance: false,
  locus_set_id: 'locus-set-1',
  name: 'Protocol One',
  props: { depth: 5 },
  protocol_type: PROTOCOL_TYPE_SEQUENCING,
  seq_category_set_id: 'seq-category-set-1',
  seq_distance_type: 1,
  seq_profile_type: 1,
};

const protocolTwoFixture: SeqDbProtocol = {
  code: 'P-2',
  id: 'protocol-2',
  name: 'Protocol Two',
  protocol_type: PROTOCOL_TYPE_SEQUENCING,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', '/v1/locus_sets', () => Response.json([{ code: 'LS-1', id: 'locus-set-1', name: 'Locus Set One' }]));
  mockApiRequest('GET', '/v1/ref_seqs', () => Response.json([{ code: 'RS-1', id: 'ref-seq-1', name: 'Ref Seq One' }]));
  mockApiRequest('GET', '/v1/seq_category_sets', () => Response.json([{ code: 'SC-1', id: 'seq-category-set-1', name: 'Seq Category Set One' }]));
};

const renderPage = async (initialItems: Partial<SeqDbProtocol>[] = [protocolOneFixture, protocolTwoFixture], permissions = ALL_PERMISSIONS) => {
  mockLookups();
  const mock = mockCrudApi(PROTOCOLS_PATH, initialItems as ({ readonly id: string } & SeqDbProtocol)[]);
  const screen = await renderRoutedPage(
    <ProtocolsAdminPage />, {
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
const mockProtocolPost = () => {
  const postBodies: Record<string, unknown>[] = [];
  mockApiRequest('POST', PROTOCOLS_PATH, async (request) => {
    const body = await request.json() as Record<string, unknown>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-protocol' }, { status: 201 });
  });
  return postBodies;
};

const openCreateDialogWithRequiredFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await screen.getByRole('textbox', { name: 'Code' }).fill('P-NEW');
  await screen.getByRole('textbox', { name: 'Name' }).fill('New protocol');
  await screen.getByRole('combobox', { name: 'Protocol type' }).click();
  await screen.getByRole('option', { exact: true, name: 'SEQUENCING' }).click();
  await screen.getByRole('switch', { name: 'Integer distance' }).click();
};

describe('ProtocolsAdminPage', () => {
  it('lists the protocols with their code, name and option labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'P-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQUENCING' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'LS-1 - Locus Set One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SC-1 - Seq Category Set One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SNP' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SNP_HAMMING' })).toBeInTheDocument();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([protocolOneFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'P-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('creates a protocol with the additional properties sent as an object', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await openCreateDialogWithRequiredFields(screen);
    await screen.getByRole('textbox', { name: PROPS_LABEL }).fill('{"threshold": 3}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      code: 'P-NEW',
      name: 'New protocol',
      props: { threshold: 3 },
      protocol_type: PROTOCOL_TYPE_SEQUENCING,
    }));
    expect(postBodies[0]).not.toHaveProperty('propsJson');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('sends the integer distance default as false when it is not changed on create', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Code' }).fill('P-DEF');
    await screen.getByRole('textbox', { name: 'Name' }).fill('Default protocol');
    await screen.getByRole('combobox', { name: 'Protocol type' }).click();
    await screen.getByRole('option', { exact: true, name: 'SEQUENCING' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'P-DEF', is_integer_distance: false }));
  });

  it('sends the maximum stored distance when it is entered', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await openCreateDialogWithRequiredFields(screen);
    await screen.getByRole('spinbutton', { exact: true, name: 'Maximum stored distance' }).fill('5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'P-NEW', max_stored_distance: 5 }));
  });

  it('omits the maximum stored distance when the field is cleared', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await openCreateDialogWithRequiredFields(screen);
    const maxStoredDistanceField = screen.getByRole('spinbutton', { exact: true, name: 'Maximum stored distance' });
    await maxStoredDistanceField.fill('4');
    await maxStoredDistanceField.fill('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]?.max_stored_distance).toBeUndefined();
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'P-NEW', name: 'New protocol' }));
  });

  it('requires a code and a protocol type before submitting the create form', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('No code');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { name: 'Code' }).fill('P-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('combobox', { name: 'Protocol type' }).click();
    await screen.getByRole('option', { exact: true, name: 'SEQUENCING' }).click();
    await screen.getByRole('switch', { name: 'Integer distance' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('does not submit the create form for invalid additional properties and sends the datetime as an ISO string', async () => {
    const { screen } = await renderPage();
    const postBodies = mockProtocolPost();

    await openCreateDialogWithRequiredFields(screen);
    const invalidPropsValues = ['[]', 'null', '5', '"text"', '{'];
    for (const invalidPropsValue of invalidPropsValues) {
      await screen.getByRole('textbox', { name: PROPS_LABEL }).fill(invalidPropsValue);
      await screen.getByRole('button', { name: 'Save' }).click();
      await expect.element(screen.getByText('Create new protocol', { exact: true })).toBeVisible();
      expect(postBodies).toHaveLength(0);
    }

    await screen.getByRole('textbox', { name: PROPS_LABEL }).fill('{}');
    const startDateTimeGroup = screen.getByRole('group', { name: 'Valid start datetime' });
    await startDateTimeGroup.getByRole('spinbutton', { name: 'Year' }).fill('2024');
    await startDateTimeGroup.getByRole('spinbutton', { name: 'Month' }).fill('01');
    await startDateTimeGroup.getByRole('spinbutton', { name: 'Day' }).fill('01');
    await startDateTimeGroup.getByRole('spinbutton', { name: 'Hours' }).fill('00');
    await startDateTimeGroup.getByRole('spinbutton', { name: 'Minutes' }).fill('00');
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({ props: {}, valid_start_datetime: new Date(2024, 0, 1).toISOString() });
  });

  it('shows the stored additional properties as formatted JSON when editing', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'Protocol One' }).click();
    await expect.element(screen.getByText('Edit item: Protocol One', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: PROPS_LABEL })).toHaveValue('{\n  "depth": 5\n}');
  });

  it('shows an empty JSON object when editing a protocol without additional properties', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'Protocol Two' }).click();
    await expect.element(screen.getByText('Edit item: Protocol Two', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: PROPS_LABEL })).toHaveValue('{}');
  });

  it('updates a protocol via the protocols endpoint with the additional properties sent as an object', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'Protocol One' }).click();
    await expect.element(screen.getByText('Edit item: Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Protocol Renamed');
    await screen.getByRole('textbox', { name: PROPS_LABEL }).fill('{"depth": 7}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROTOCOLS_PATH}/protocol-1`);
    expect(putCall?.body).toMatchObject({
      code: 'P-1',
      id: 'protocol-1',
      name: 'Protocol Renamed',
      props: { depth: 7 },
    });
    expect(putCall?.body).not.toHaveProperty('propsJson');
  });

  it('deletes a protocol via the protocols endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Protocol One' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')).toEqual(expect.objectContaining({
      pathname: `${PROTOCOLS_PATH}/protocol-1`,
    }));
  });

  it('names a deleted protocol by its ID when its name and code are empty', async () => {
    const { mock, screen } = await renderPage([{ code: '', id: 'protocol-id-only', name: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"protocol-id-only" has been deleted.')]));
  });

  it('names an unsaved protocol by its code when its name and ID are empty', async () => {
    const { mock, screen } = await renderPage([{ code: 'CODE-3', id: '', name: '' }]);

    await screen.getByRole('row').filter({ hasText: 'CODE-3' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"CODE-3" could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('shows a delete error without a name when the protocol has an empty ID and no name or code', async () => {
    const { mock, screen } = await renderPage([{ code: '', id: '', name: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('shows a delete error without a name when the protocol has no ID key, name or code', async () => {
    const { mock, screen } = await renderPage([{ code: '', name: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });
});
