import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSampleIdentifier } from '@gen-epix/api-seqdb';
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

import { SampleIdentifiersAdminPage } from './SampleIdentifiersAdminPage';

const IDENTIFIERS_PATH = '/v1/sample_identifiers';
const SAMPLES_PATH = '/v1/samples';
const ISSUERS_PATH = '/v1/identifier_issuers';
const ROUTE_PATH = '/management/sample-identifiers';
const URL = '/management/sample-identifiers';

const IDENTIFIER_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SampleIdentifierCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const sampleFixture = { code: 'SAMPLE-1', id: 'sample-one' };
const issuerFixture = { id: 'issuer-one', name: 'Issuer one' };

const identifierAlphaFixture: SeqDbSampleIdentifier = {
  external_id: 'EXT-ALPHA',
  id: 'identifier-alpha',
  identifier_issuer_id: 'issuer-one',
  internal_id: 'sample-one',
};

const identifierBetaFixture: SeqDbSampleIdentifier = {
  external_id: 'EXT-BETA',
  id: 'identifier-beta',
  identifier_issuer_id: 'issuer-one',
  internal_id: 'sample-one',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([sampleFixture]));
  mockApiRequest('GET', ISSUERS_PATH, () => Response.json([issuerFixture]));
};

const renderPageWithItems = async (items: SeqDbSampleIdentifier[]) => {
  mockLookups();
  const mock = mockCrudApi(IDENTIFIERS_PATH, items as ({ readonly id: string } & SeqDbSampleIdentifier)[]);
  const screen = await renderRoutedPage(
    <SampleIdentifiersAdminPage />, {
      path: ROUTE_PATH,
      permissions: IDENTIFIER_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const renderPageWithRow = async (row: SeqDbSampleIdentifier) => renderPageWithItems([row]);

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPageWithItems>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPageWithItems>>['screen'], { externalId, issuerName, sampleName }: { externalId?: string; issuerName?: string; sampleName?: string }) => {
  if (sampleName) {
    await screen.getByRole('combobox', { name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: sampleName }).click();
  }
  if (issuerName) {
    await screen.getByRole('combobox', { name: 'Identifier issuer' }).click();
    await screen.getByRole('option', { exact: true, name: issuerName }).click();
  }
  if (externalId) {
    await screen.getByRole('textbox', { exact: true, name: 'External identifier' }).fill(externalId);
  }
};

describe('SampleIdentifiersAdminPage', () => {
  it('lists the identifiers with their sample, issuer and external identifier', async () => {
    const { screen } = await renderPageWithItems([identifierAlphaFixture, identifierBetaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Issuer one' }).first()).toBeInTheDocument();
  });

  it('creates an identifier from the selected sample, issuer and external identifier', async () => {
    const { screen } = await renderPageWithItems([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', IDENTIFIERS_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbSampleIdentifier>;
      postBodies.push(body);
      return Response.json({ ...body, id: 'created-identifier' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sample identifier', { exact: true })).toBeVisible();
    await fillCreateForm(screen, { externalId: 'EXT-NEW', issuerName: 'Issuer one', sampleName: 'SAMPLE-1' });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({
      external_id: 'EXT-NEW',
      identifier_issuer_id: 'issuer-one',
      internal_id: 'sample-one',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-1 - EXT-NEW - Issuer one" has been created.')]));
  });

  it('does not create an identifier when the sample is missing', async () => {
    const { screen } = await renderPageWithItems([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', IDENTIFIERS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-identifier' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen, { externalId: 'EXT-NEW', issuerName: 'Issuer one' });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sample identifier', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('does not create an identifier when the identifier issuer is missing', async () => {
    const { screen } = await renderPageWithItems([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', IDENTIFIERS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-identifier' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen, { externalId: 'EXT-NEW', sampleName: 'SAMPLE-1' });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sample identifier', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('does not create an identifier when the external identifier is missing', async () => {
    const { screen } = await renderPageWithItems([]);
    const postBodies: unknown[] = [];
    mockApiRequest('POST', IDENTIFIERS_PATH, async (request) => {
      postBodies.push(await request.json());
      return Response.json({ id: 'created-identifier' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen, { issuerName: 'Issuer one', sampleName: 'SAMPLE-1' });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sample identifier', { exact: true })).toBeVisible();
    await expect.poll(() => postBodies.length).toBe(0);
  });

  it('saves an edited identifier with an ID', async () => {
    const { mock, screen } = await renderPageWithItems([identifierAlphaFixture]);

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-1 - EXT-ALPHA - Issuer one" has been saved.')]));
  });

  it('deletes an identifier with an ID', async () => {
    const { mock, screen } = await renderPageWithItems([identifierAlphaFixture]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"SAMPLE-1 - EXT-ALPHA - Issuer one" has been deleted.')]));
  });

  it('falls back to the raw sample and issuer IDs when the lookups do not contain them', async () => {
    const { screen } = await renderPageWithRow({
      external_id: 'EXT-RAW',
      id: 'identifier-raw',
      identifier_issuer_id: 'issuer-unknown',
      internal_id: 'sample-unknown',
    });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"sample-unknown - EXT-RAW - issuer-unknown" has been deleted.')]));
  });

  it('names an identifier by its ID when it has no sample, external identifier or issuer', async () => {
    const { screen } = await renderPageWithRow({
      external_id: '',
      id: 'identifier-id-only',
      identifier_issuer_id: '',
      internal_id: '',
    });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"identifier-id-only" has been deleted.')]));
  });

  it('reports a delete error for an identifier without an ID, without a name', async () => {
    const { screen } = await renderPageWithRow({
      external_id: '',
      id: '',
      identifier_issuer_id: '',
      internal_id: '',
    });

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining(['Sample identifier could not be deleted.']));
  });

  it('hides the create action without permissions', async () => {
    mockLookups();
    mockCrudApi(IDENTIFIERS_PATH, [identifierAlphaFixture] as ({ readonly id: string } & SeqDbSampleIdentifier)[]);
    const screen = await renderRoutedPage(
      <SampleIdentifiersAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EXT-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
