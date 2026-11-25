import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeqProfileIdentifier } from '@gen-epix/api-seqdb';
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

import { SeqProfileIdentifiersAdminPage } from './SeqProfileIdentifiersAdminPage';

type SeqProfileIdentifierFixture = { readonly id: string } & SeqDbSeqProfileIdentifier;

const SEQ_PROFILE_IDENTIFIERS_PATH = '/v1/seq_profile_identifiers';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const ROUTE_PATH = '/management/seq_profile_identifiers';
const URL = '/management/seq_profile_identifiers';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const SEQ_PROFILE_IDENTIFIER_PERMISSIONS = [
  { command_name: SeqDbCommandName.SeqProfileIdentifierCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.SeqProfileIdentifierCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.SeqProfileIdentifierCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const identifierAlphaFixture: SeqProfileIdentifierFixture = {
  external_id: 'EXT-1',
  id: 'seq-profile-identifier-alpha',
  identifier_issuer_id: 'issuer-1',
  internal_id: 'INT-1',
};

const identifierBetaFixture: SeqProfileIdentifierFixture = {
  external_id: '',
  id: 'seq-profile-identifier-beta',
  identifier_issuer_id: 'issuer-2',
  internal_id: 'INT-2',
};

const identifierGammaFixture: SeqProfileIdentifierFixture = {
  external_id: '',
  id: 'seq-profile-identifier-gamma',
  identifier_issuer_id: 'issuer-unknown',
  internal_id: '',
};

const identifierDeltaFixture: SeqProfileIdentifierFixture = {
  external_id: 'EXT-4',
  id: 'seq-profile-identifier-delta',
  identifier_issuer_id: 'issuer-unknown',
  internal_id: '',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockIdentifierIssuers = () => {
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json([
    { id: 'issuer-1', name: 'Issuer One' },
    { id: 'issuer-2', name: 'Issuer Two' },
  ]));
};

const renderPage = async (initialItems: SeqProfileIdentifierFixture[] = [identifierAlphaFixture, identifierBetaFixture], permissions = SEQ_PROFILE_IDENTIFIER_PERMISSIONS) => {
  mockIdentifierIssuers();
  const mock = mockCrudApi(SEQ_PROFILE_IDENTIFIERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SeqProfileIdentifiersAdminPage />, {
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
const mockIdentifierPost = (responseBody: (body: Partial<SeqDbSeqProfileIdentifier>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SEQ_PROFILE_IDENTIFIERS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbSeqProfileIdentifier>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

describe('SeqProfileIdentifiersAdminPage', () => {
  it('lists the sequence profile identifiers with their issuer names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'INT-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'INT-2' })).toBeInTheDocument();
  });

  it('creates a sequence profile identifier via the sequence profile identifiers endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockIdentifierPost(body => ({ ...body, id: 'created-identifier' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence profile identifier', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Identifier issuer' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer Two' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'External identifier' }).fill('EXT-9');
    await screen.getByRole('textbox', { exact: true, name: 'Internal identifier' }).fill('INT-9');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      external_id: 'EXT-9',
      identifier_issuer_id: 'issuer-2',
      internal_id: 'INT-9',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not create a sequence profile identifier while required values are missing', async () => {
    const { screen } = await renderPage();
    const postBodies = mockIdentifierPost(body => ({ ...body, id: 'created-identifier' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'External identifier' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await screen.getByRole('combobox', { name: 'Identifier issuer' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'External identifier' }).fill('EXT-9');
    await screen.getByRole('textbox', { exact: true, name: 'Internal identifier' }).fill('INT-9');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ external_id: 'EXT-9', identifier_issuer_id: 'issuer-1', internal_id: 'INT-9' }));
  });

  it('shows an error notification when the created sequence profile identifier has no ID', async () => {
    const { screen } = await renderPage();
    mockIdentifierPost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Identifier issuer' }).click();
    await screen.getByRole('option', { exact: true, name: 'Issuer One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'External identifier' }).fill('EXT-9');
    await screen.getByRole('textbox', { exact: true, name: 'Internal identifier' }).fill('INT-9');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('updates a sequence profile identifier with its fixed issuer and external identifier', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'EXT-1' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One: EXT-1', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { exact: true, name: 'External identifier' })).toBeDisabled();
    await screen.getByRole('textbox', { exact: true, name: 'Internal identifier' }).fill('INT-1-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SEQ_PROFILE_IDENTIFIERS_PATH}/seq-profile-identifier-alpha`);
    expect(putCall?.body).toMatchObject({ internal_id: 'INT-1-UPDATED' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('shows an error notification when the updated sequence profile identifier has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${SEQ_PROFILE_IDENTIFIERS_PATH}/seq-profile-identifier-alpha`, async (request) => {
      const body = await request.json() as Partial<SeqDbSeqProfileIdentifier>;
      return Response.json({ ...body, id: null });
    });

    await screen.getByRole('cell', { exact: true, name: 'EXT-1' }).click();
    await expect.element(screen.getByText('Edit item: Issuer One: EXT-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Internal identifier' }).fill('INT-1-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('deletes a sequence profile identifier', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'EXT-1' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SEQ_PROFILE_IDENTIFIERS_PATH}/seq-profile-identifier-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-1' })).not.toBeInTheDocument();
  });

  it('names a sequence profile identifier without an external identifier by its internal identifier', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'INT-2' }).click();
    await expect.element(screen.getByText('Edit item: INT-2', { exact: true })).toBeVisible();
  });

  it('names a sequence profile identifier with an unknown issuer by the raw issuer ID', async () => {
    const { screen } = await renderPage([identifierDeltaFixture]);

    await screen.getByRole('cell', { exact: true, name: 'EXT-4' }).click();
    await expect.element(screen.getByText('Edit item: issuer-unknown: EXT-4', { exact: true })).toBeVisible();
  });

  it('names a sequence profile identifier without identifiers by its ID', async () => {
    const { screen } = await renderPage([identifierGammaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: seq-profile-identifier-gamma', { exact: true })).toBeVisible();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([identifierAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the sequence profile identifiers when an identifier has an empty ID', async () => {
    mockIdentifierIssuers();
    mockApiRequest('GET', SEQ_PROFILE_IDENTIFIERS_PATH, () => Response.json([{ ...identifierAlphaFixture, id: '' }]));
    const screen = await renderRoutedPage(
      <SeqProfileIdentifiersAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_PROFILE_IDENTIFIER_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-1' })).not.toBeInTheDocument();
  });

  it('fails to load the sequence profile identifiers when an identifier has no ID', async () => {
    mockIdentifierIssuers();
    mockApiRequest('GET', SEQ_PROFILE_IDENTIFIERS_PATH, () => Response.json([{ ...identifierAlphaFixture, id: null }]));
    const screen = await renderRoutedPage(
      <SeqProfileIdentifiersAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_PROFILE_IDENTIFIER_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-1' })).not.toBeInTheDocument();
  });
});
