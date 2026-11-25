import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbTaxonSet } from '@gen-epix/api-seqdb';
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

import { TaxonSetsAdminPage } from './TaxonSetsAdminPage';

type TaxonSetFixture = { readonly id: null | string } & Partial<Omit<SeqDbTaxonSet, 'id'>>;

const TAXON_SETS_PATH = '/v1/taxon_sets';
const ROUTE_PATH = '/management/taxon-sets';
const URL = '/management/taxon-sets';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const TAXON_SET_PERMISSIONS = [
  { command_name: SeqDbCommandName.TaxonSetCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.TaxonSetCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.TaxonSetCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const taxonSetAlphaFixture: TaxonSetFixture = {
  code: 'ALPHASET',
  id: 'taxon-set-alpha',
  name: 'Alpha set',
};

const taxonSetIdOnlyFixture: TaxonSetFixture = {
  code: 'IDONLYCODE',
  id: 'taxon-set-id-only',
  name: '',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: TaxonSetFixture[] = [taxonSetAlphaFixture, taxonSetIdOnlyFixture],
  permissions: CommonDbApiPermission[] = TAXON_SET_PERMISSIONS,
) => {
  const mock = mockCrudApi(TAXON_SETS_PATH, initialItems as ({ readonly id: string } & SeqDbTaxonSet)[]);
  const screen = await renderRoutedPage(
    <TaxonSetsAdminPage />, {
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
const mockTaxonSetPost = (responseBody: (body: Partial<SeqDbTaxonSet>) => unknown) => {
  const postBodies: Partial<SeqDbTaxonSet>[] = [];
  mockApiRequest('POST', TAXON_SETS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbTaxonSet>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

describe('TaxonSetsAdminPage', () => {
  it('lists the taxon sets with their code and name', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ALPHASET' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'IDONLYCODE' })).toBeInTheDocument();
  });

  it('creates a taxon set with the entered code and name', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonSetPost(body => ({ ...body, id: 'created-taxon-set' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('NEWSET');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ code: 'NEWSET', name: 'New set' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not post a new taxon set while the required code and name are empty', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonSetPost(body => ({ ...body, id: 'created-taxon-set' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('   ');
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('   ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByRole('textbox', { exact: true, name: 'Code' })).toBeInTheDocument();
    expect(postBodies).toHaveLength(0);
  });

  it('updates a taxon set with the edited name', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Alpha set' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Renamed set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${TAXON_SETS_PATH}/taxon-set-alpha`);
    expect(putCall?.body).toMatchObject({ id: 'taxon-set-alpha', name: 'Renamed set' });
  });

  it('names an edited taxon set by its ID when it has no name', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'IDONLYCODE' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: taxon-set-id-only', { exact: true })).toBeVisible();
  });

  it('deletes a taxon set', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Alpha set' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${TAXON_SETS_PATH}/taxon-set-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).not.toBeInTheDocument();
  });

  it.each([
    { description: 'without an ID', taxonSet: { code: 'NOIDSET', id: null, name: 'No ID set' } },
    { description: 'with no name or ID', taxonSet: { code: 'CODEONLYSET', id: null, name: '' } },
    { description: 'with no name, code or ID', taxonSet: { code: '', id: null, name: '' } },
  ])('shows an error notification and does not call the API when deleting a taxon set $description', async ({ taxonSet }) => {
    const { mock, screen } = await renderPage([taxonSet]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([taxonSetAlphaFixture], []);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
