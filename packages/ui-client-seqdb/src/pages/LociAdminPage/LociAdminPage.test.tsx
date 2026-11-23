import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbLocus } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbLocusType,
  SeqDbPermissionType,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { LociAdminPage } from './LociAdminPage';

type LocusFixture = { readonly id: string } & SeqDbLocus;

const LOCI_PATH = '/v1/loci';
const ROUTE_PATH = '/management/loci';
const URL = '/management/loci';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const LOCUS_PERMISSIONS = [
  { command_name: SeqDbCommandName.LocusCrudCommand, permission_type: SeqDbPermissionType.CREATE },
] as unknown as CommonDbApiPermission[];

const locusAlphaFixture: LocusFixture = {
  code: 'LOC-A',
  description: 'First locus',
  gene_product_code: 'GP-A',
  id: 'locus-1',
  locus_type: SeqDbLocusType.GENE,
  name: 'Alpha locus',
};

const locusBetaFixture: LocusFixture = {
  code: 'LOC-B',
  description: 'Second locus',
  id: 'locus-2',
  locus_type: SeqDbLocusType.PCR,
  name: 'Beta locus',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: LocusFixture[] = [locusAlphaFixture, locusBetaFixture]) => {
  const mock = mockCrudApi(LOCI_PATH, initialItems);
  const screen = await renderRoutedPage(
    <LociAdminPage />, {
      path: ROUTE_PATH,
      permissions: LOCUS_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], values: { code?: string; description?: string; geneProductCode?: string; name?: string }) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new locus', { exact: true })).toBeVisible();
  if (values.code !== undefined) {
    await screen.getByRole('textbox', { name: 'Code' }).fill(values.code);
  }
  if (values.name !== undefined) {
    await screen.getByRole('textbox', { name: 'Name' }).fill(values.name);
  }
  if (values.description !== undefined) {
    await screen.getByRole('textbox', { name: 'Description' }).fill(values.description);
  }
  if (values.geneProductCode !== undefined) {
    await screen.getByRole('textbox', { name: 'Gene product code' }).fill(values.geneProductCode);
  }
};

const selectLocusType = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], optionName: string) => {
  await screen.getByRole('combobox', { name: 'Locus type' }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

describe('LociAdminPage', () => {
  it('lists the loci with their code, name, description, locus type and gene product code', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'LOC-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha locus' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'First locus' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Gene' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GP-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'PCR' })).toBeInTheDocument();
  });

  it('creates a locus with a gene product code when the locus type is gene', async () => {
    const { mock, screen } = await renderPage();

    await fillCreateForm(screen, { code: 'LOC-C', description: 'Third locus', geneProductCode: 'GP-C', name: 'Gamma locus' });
    await selectLocusType(screen, 'Gene');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.body).toEqual(expect.objectContaining({
      code: 'LOC-C',
      description: 'Third locus',
      gene_product_code: 'GP-C',
      locus_type: SeqDbLocusType.GENE,
      name: 'Gamma locus',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Gamma locus" has been created.')]));
  });

  it('names the created notification by the code when the created locus has no name', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCI_PATH, async request => {
      const body = (await request.json()) as SeqDbLocus;
      return Response.json({ code: body.code, id: 'created-bare' }, { status: 201 });
    });

    await fillCreateForm(screen, { code: 'BARE-LOCUS', name: 'Bare locus' });
    await selectLocusType(screen, 'Other');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"BARE-LOCUS" has been created.')]));
  });

  it('names the created notification by the ID when the created locus has no name or code', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCI_PATH, () => Response.json({ id: 'created-id-only' }, { status: 201 }));

    await fillCreateForm(screen, { code: 'ID-ONLY', name: 'Id only locus' });
    await selectLocusType(screen, 'Other');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-id-only" has been created.')]));
  });

  it('does not save a gene product code for a locus type other than gene', async () => {
    const { mock, screen } = await renderPage();

    await fillCreateForm(screen, { code: 'LOC-D', geneProductCode: 'GP-D', name: 'Delta locus' });
    await selectLocusType(screen, 'PCR');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('does not save a locus without a code', async () => {
    const { mock, screen } = await renderPage();

    await fillCreateForm(screen, { name: 'No code locus' });
    await selectLocusType(screen, 'Other');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('shows an error notification when the created locus has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCI_PATH, async request => Response.json(await request.json(), { status: 201 }));

    await fillCreateForm(screen, { code: 'NOID', name: 'No id locus' });
    await selectLocusType(screen, 'Other');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('fails to load the loci when a locus has an empty ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([{ code: 'EMPTY-ID', id: '' }]));
    const screen = await renderRoutedPage(
      <LociAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'EMPTY-ID' })).not.toBeInTheDocument();
  });

  it('fails to load the loci when a locus has no ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json([{ code: 'NULL-ID', id: null }]));
    const screen = await renderRoutedPage(
      <LociAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'NULL-ID' })).not.toBeInTheDocument();
  });
});
