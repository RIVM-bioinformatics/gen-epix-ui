import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbReadSetIdentifier } from '@gen-epix/api-seqdb';
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

import { ReadSetIdentifiersAdminPage } from './ReadSetIdentifiersAdminPage';

const READ_SET_IDENTIFIERS_PATH = '/v1/read_set_identifiers';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const READ_SETS_PATH = '/v1/read_sets';
const ROUTE_PATH = '/management/read-set-identifiers';
const URL = '/management/read-set-identifiers';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const createPermissions = (permissionTypes: SeqDbPermissionType[]) => permissionTypes.map((permissionType) => ({
  command_name: SeqDbCommandName.ReadSetIdentifierCrudCommand,
  permission_type: permissionType,
})) as unknown as CommonDbApiPermission[];

const ALL_PERMISSIONS = createPermissions([SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE]);

// Read set and identifier issuer are both known to the lookups, so the name uses their labels.
const identifierAlphaFixture: SeqDbReadSetIdentifier = {
  external_id: 'EXT-ALPHA',
  id: 'ident-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'read-set-1',
};

// Read set and identifier issuer are unknown to the lookups, so the name uses their raw IDs.
const identifierBetaFixture: SeqDbReadSetIdentifier = {
  external_id: 'EXT-BETA',
  id: 'ident-beta',
  identifier_issuer_id: 'issuer-unknown',
  internal_id: 'read-set-unknown',
};

// Every name part is blank, so the name falls back to the identifier ID.
const identifierGammaFixture: SeqDbReadSetIdentifier = {
  external_id: '',
  id: 'ident-gamma',
  identifier_issuer_id: '',
  internal_id: '',
};

// Every name part is blank and the ID key is omitted, so the name is empty and deleting fails on the missing ID.
const identifierWithoutIdKeyFixture = {
  external_id: '',
  identifier_issuer_id: '',
  internal_id: '',
} as SeqDbReadSetIdentifier;

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockOptions = () => {
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json([{ id: 'issuer-1', name: 'Issuer One' }]));
  mockApiRequest('GET', READ_SETS_PATH, () => Response.json([{ code: 'RS-1', id: 'read-set-1' }]));
};

const renderPage = async (initialItems: SeqDbReadSetIdentifier[] = [identifierAlphaFixture, identifierBetaFixture], permissions = ALL_PERMISSIONS) => {
  mockOptions();
  const mock = mockCrudApi(READ_SET_IDENTIFIERS_PATH, initialItems as ({ readonly id: string } & SeqDbReadSetIdentifier)[]);
  const screen = await renderRoutedPage(
    <ReadSetIdentifiersAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

type Screen = Awaited<ReturnType<typeof renderPage>>['screen'];

/**
 * Overrides the POST handler of mockCrudApi so that the request body can be inspected per test.
 */
const mockIdentifierPost = () => {
  const postBodies: Partial<SeqDbReadSetIdentifier>[] = [];
  mockApiRequest('POST', READ_SET_IDENTIFIERS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbReadSetIdentifier>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-identifier' }, { status: 201 });
  });
  return postBodies;
};

const selectOption = async (screen: Screen, fieldName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const deleteRowByExternalId = async (screen: Screen, externalId: string) => {
  await screen.getByRole('row').filter({ hasText: externalId }).getByRole('button', { name: 'Row actions' }).click();
  await screen.getByRole('menuitem', { name: 'Delete' }).click();
  await screen.getByRole('button', { name: 'Confirm' }).click();
};

const deleteOnlyRow = async (screen: Screen) => {
  await screen.getByRole('button', { name: 'Row actions' }).click();
  await screen.getByRole('menuitem', { name: 'Delete' }).click();
  await screen.getByRole('button', { name: 'Confirm' }).click();
};

describe('ReadSetIdentifiersAdminPage', () => {
  it('lists identifiers with their external ID and the labels of their option columns', async () => {
    const { screen } = await renderPage([identifierAlphaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
  });

  it('lists identifiers whose option values are unknown', async () => {
    const { screen } = await renderPage([identifierBetaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-BETA' })).toBeInTheDocument();
  });

  it('deletes an identifier via the read set identifiers endpoint and names it by its option labels', async () => {
    const { mock, screen } = await renderPage([identifierAlphaFixture]);

    await deleteRowByExternalId(screen, 'EXT-ALPHA');

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')).toEqual(expect.objectContaining({
      pathname: `${READ_SET_IDENTIFIERS_PATH}/ident-alpha`,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"RS-1 - EXT-ALPHA - Issuer One" has been deleted.')]));
  });

  it('names an identifier by the raw IDs of its unknown read set and identifier issuer', async () => {
    const { screen } = await renderPage([identifierBetaFixture]);

    await deleteRowByExternalId(screen, 'EXT-BETA');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"read-set-unknown - EXT-BETA - issuer-unknown" has been deleted.')]));
  });

  it('names an identifier by its ID when all of its name parts are blank', async () => {
    const { screen } = await renderPage([identifierGammaFixture]);

    await deleteOnlyRow(screen);

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"ident-gamma" has been deleted.')]));
  });

  it('reports a failed delete when the identifier has no ID and no name', async () => {
    const { screen } = await renderPage([identifierWithoutIdKeyFixture]);

    await deleteOnlyRow(screen);

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
  });

  it('updates an identifier via the read set identifiers endpoint', async () => {
    const { mock, screen } = await renderPage([identifierAlphaFixture]);

    await screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' }).click();
    await screen.getByRole('textbox', { name: 'External identifier' }).fill('EXT-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${READ_SET_IDENTIFIERS_PATH}/ident-alpha`);
    expect(putCall?.body).toMatchObject({
      external_id: 'EXT-NEW',
      id: 'ident-alpha',
      identifier_issuer_id: 'issuer-1',
      internal_id: 'read-set-1',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('does not submit the create form until read set, identifier issuer and external ID are filled', async () => {
    const { screen } = await renderPage([identifierAlphaFixture]);
    const postBodies = mockIdentifierPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'External identifier' }).fill('EXT-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new read set identifier', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await selectOption(screen, 'Read set', 'RS-1');
    await selectOption(screen, 'Identifier issuer', 'Issuer One');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      external_id: 'EXT-NEW',
      identifier_issuer_id: 'issuer-1',
      internal_id: 'read-set-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
