import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbTaxon } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
  SeqDbTaxonRank,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { TaxaAdminPage } from './TaxaAdminPage';

type TaxonFixture = { readonly id: null | string } & Partial<Omit<SeqDbTaxon, 'id'>>;

const TAXA_PATH = '/v1/taxa';
const ROUTE_PATH = '/management/taxa';
const URL = '/management/taxa';
const NCB_JSON_LABEL = 'NCBI ancestor tax IDs (JSON array)';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const TAXA_PERMISSIONS = [
  { command_name: SeqDbCommandName.TaxonCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.TaxonCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.TaxonCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const taxonAlphaFixture: TaxonFixture = {
  code: 'ALP',
  id: 'taxon-alpha',
  name: 'Alpha',
  ncbi_ancestor_taxids: [1, 2],
  ncbi_taxid: 562,
  rank: SeqDbTaxonRank.SPECIES,
};

const taxonCodeOnlyFixture: TaxonFixture = {
  code: 'CODEONLY',
  id: 'taxon-code-only',
  rank: SeqDbTaxonRank.GENUS,
};

const taxonIdOnlyFixture: TaxonFixture = {
  id: 'taxon-id-only',
  rank: SeqDbTaxonRank.FAMILY,
};

const taxonNoIdFixture: TaxonFixture = {
  code: 'NOID',
  id: null,
  name: 'No ID',
  rank: SeqDbTaxonRank.CLASS,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: TaxonFixture[] = [taxonAlphaFixture, taxonCodeOnlyFixture, taxonIdOnlyFixture],
  permissions: CommonDbApiPermission[] = TAXA_PERMISSIONS,
) => {
  const mock = mockCrudApi(TAXA_PATH, initialItems as ({ readonly id: string } & SeqDbTaxon)[]);
  const screen = await renderRoutedPage(
    <TaxaAdminPage />, {
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
const mockTaxonPost = (responseBody: (body: Partial<SeqDbTaxon>) => unknown) => {
  const postBodies: Partial<SeqDbTaxon>[] = [];
  mockApiRequest('POST', TAXA_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbTaxon>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const fillNewTaxonRequiredFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('NEW');
  await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('New taxon');
  await screen.getByRole('combobox', { name: 'Rank' }).click();
  await screen.getByRole('option', { exact: true, name: 'SPECIES' }).click();
};

describe('TaxaAdminPage', () => {
  it('lists the taxa with their rank and NCBI tax ID', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ALP' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SPECIES' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '562' })).toBeInTheDocument();
  });

  it('creates a taxon with parsed NCBI ancestor tax IDs', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonPost(body => ({ ...body, id: 'created-taxon' }));

    await fillNewTaxonRequiredFields(screen);
    await screen.getByRole('textbox', { exact: true, name: NCB_JSON_LABEL }).fill('[10, 20]');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      code: 'NEW',
      name: 'New taxon',
      ncbi_ancestor_taxids: [10, 20],
      rank: SeqDbTaxonRank.SPECIES,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('shows a validation error and does not post when the NCBI ancestor tax IDs are not a valid array', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonPost(body => ({ ...body, id: 'created-taxon' }));

    await fillNewTaxonRequiredFields(screen);
    const ancestorField = screen.getByRole('textbox', { exact: true, name: NCB_JSON_LABEL });

    const invalidValues = ['{"a": 1}', '[1.5]', '["a"]', '[0]', '[-3]', 'not json'];
    for (const invalidValue of invalidValues) {
      await ancestorField.fill(invalidValue);
      await screen.getByRole('button', { name: 'Save' }).click();
      await expect.element(screen.getByText('Enter a JSON array of NCBI tax IDs.', { exact: true })).toBeVisible();
    }

    expect(postBodies).toHaveLength(0);
  });

  it('updates a taxon with edited NCBI ancestor tax IDs', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: NCB_JSON_LABEL }).fill('[7]');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${TAXA_PATH}/taxon-alpha`);
    expect(putCall?.body).toMatchObject({ id: 'taxon-alpha', ncbi_ancestor_taxids: [7] });
  });

  it('deletes a taxon', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'Alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${TAXA_PATH}/taxon-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).not.toBeInTheDocument();
  });

  it('names a taxon by its code when it has no name', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'CODEONLY' }).click();
    await expect.element(screen.getByText('Edit item: CODEONLY', { exact: true })).toBeVisible();
  });

  it('names a taxon by its ID when it has no name or code', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'FAMILY' }).click();
    await expect.element(screen.getByText('Edit item: taxon-id-only', { exact: true })).toBeVisible();
  });

  it('confirms deletion of a taxon with no name, code or ID without failing', async () => {
    const { mock, screen } = await renderPage([{ id: null, ncbi_taxid: 9606, rank: SeqDbTaxonRank.SPECIES }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('creates instead of updating when saving a taxon without an ID', async () => {
    const { mock, screen } = await renderPage([taxonNoIdFixture]);

    await screen.getByRole('cell', { exact: true, name: 'No ID' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Name' }).fill('Changed name');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created')]));
    expect(mock.calls.filter(({ method }) => method === 'PUT')).toHaveLength(0);
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(1);
  });

  it('shows an error notification when deleting a taxon without an ID', async () => {
    const { mock, screen } = await renderPage([taxonNoIdFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([taxonAlphaFixture], []);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
