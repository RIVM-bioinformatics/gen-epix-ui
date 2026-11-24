import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbRefAllele } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
  SeqDbSeqFormat,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RefAllelesAdminPage } from './RefAllelesAdminPage';

type RefAlleleFixture = { readonly id: string } & SeqDbRefAllele;

const REF_ALLELES_PATH = '/v1/ref_alleles';
const LOCI_PATH = '/v1/loci';
const ROUTE_PATH = '/management/ref_alleles';
const URL = '/management/ref_alleles';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const REF_ALLELE_PERMISSIONS = [
  { command_name: SeqDbCommandName.RefAlleleCrudCommand, permission_type: SeqDbPermissionType.CREATE },
] as unknown as CommonDbApiPermission[];

const refAlleleAlphaFixture: RefAlleleFixture = {
  id: 'ref-allele-alpha',
  index: 1,
  length: 4,
  locus_id: 'locus-1',
  seq: 'ACGT',
  seq_format: SeqDbSeqFormat.STR_DNA,
};

const refAlleleBetaFixture: RefAlleleFixture = {
  id: 'ref-allele-beta',
  index: 2,
  locus_id: 'locus-2',
  seq: 'GGCC',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLoci = () => {
  mockApiRequest('GET', LOCI_PATH, () => Response.json([
    { code: 'A', id: 'locus-1', name: 'Alpha' },
    { code: 'B', id: 'locus-2' },
  ]));
};

const renderPage = async (initialItems: RefAlleleFixture[] = [refAlleleAlphaFixture, refAlleleBetaFixture], permissions = REF_ALLELE_PERMISSIONS) => {
  mockLoci();
  const mock = mockCrudApi(REF_ALLELES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <RefAllelesAdminPage />, {
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
const mockRefAllelePost = (responseBody: (body: Partial<SeqDbRefAllele>) => unknown) => {
  const postBodies: Partial<SeqDbRefAllele>[] = [];
  mockApiRequest('POST', REF_ALLELES_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbRefAllele>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

/**
 * Renders the page with a single row and opens its edit dialog through the row actions menu, so the edit title can be asserted.
 */
const openEditDialogForRow = async (row: RefAlleleFixture) => {
  const { screen } = await renderPage([row]);
  await screen.getByRole('button', { name: 'Row actions' }).click();
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('RefAllelesAdminPage', () => {
  it('lists the reference alleles with their option labels, index and length', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GGCC' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DNA sequence' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'A - Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'B' })).toBeInTheDocument();
    await expect.element(screen.getByTitle('1', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByTitle('2', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '4' })).toBeInTheDocument();
  });

  it('creates a reference allele via the ref alleles endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefAllelePost(body => ({ ...body, id: 'created-ref-allele' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference allele', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'A - Alpha' }).click();
    await screen.getByRole('spinbutton', { name: 'Index' }).fill('3');
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('combobox', { name: 'Sequence format' }).click();
    await screen.getByRole('option', { exact: true, name: 'DNA sequence' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ index: 3, locus_id: 'locus-1', seq: 'TTAA', seq_format: SeqDbSeqFormat.STR_DNA });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('A - Alpha - 3')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('blocks saving until the mandatory fields are filled and the index is an integer', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefAllelePost(body => ({ ...body, id: 'created-ref-allele' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference allele', { exact: true })).toBeVisible();

    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.element(screen.getByText('Field is mandatory').first()).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'B' }).click();
    await screen.getByRole('spinbutton', { name: 'Index' }).fill('1.5');
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('combobox', { name: 'Sequence format' }).click();
    await screen.getByRole('option', { exact: true, name: 'DNA sequence' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.element(screen.getByText('Create new reference allele', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('spinbutton', { name: 'Index' }).fill('4');
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({ index: 4, locus_id: 'locus-2', seq: 'TTAA', seq_format: SeqDbSeqFormat.STR_DNA });
  });

  it('shows an error notification when the created reference allele has no ID', async () => {
    const { screen } = await renderPage();
    mockRefAllelePost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'B' }).click();
    await screen.getByRole('spinbutton', { name: 'Index' }).fill('3');
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('combobox', { name: 'Sequence format' }).click();
    await screen.getByRole('option', { exact: true, name: 'DNA sequence' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('creates a reference allele without a sequence format', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefAllelePost(body => ({ ...body, id: 'created-ref-allele' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Locus' }).click();
    await screen.getByRole('option', { exact: true, name: 'B' }).click();
    await screen.getByRole('spinbutton', { name: 'Index' }).fill('3');
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({ index: 3, locus_id: 'locus-2', seq: 'TTAA' });
    expect(postBodies[0]?.seq_format ?? null).toBeNull();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([refAlleleAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the reference alleles when a reference allele has an empty ID', async () => {
    mockLoci();
    mockApiRequest('GET', REF_ALLELES_PATH, () => Response.json([{ id: '', index: 1, locus_id: 'locus-1', seq: 'ACGT' }]));
    const screen = await renderRoutedPage(
      <RefAllelesAdminPage />, {
        path: ROUTE_PATH,
        permissions: REF_ALLELE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).not.toBeInTheDocument();
  });

  it('fails to load the reference alleles when a reference allele has no ID', async () => {
    mockLoci();
    mockApiRequest('GET', REF_ALLELES_PATH, () => Response.json([{ id: null, index: 1, locus_id: 'locus-1', seq: 'ACGT' }]));
    const screen = await renderRoutedPage(
      <RefAllelesAdminPage />, {
        path: ROUTE_PATH,
        permissions: REF_ALLELE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGT' })).not.toBeInTheDocument();
  });

  it('names a reference allele by its locus and index in the edit title', async () => {
    const screen = await openEditDialogForRow(refAlleleAlphaFixture);

    await expect.element(screen.getByText('Edit item: A - Alpha - 1', { exact: true })).toBeVisible();
  });

  it('names a reference allele by its raw locus ID when the locus is not in the options', async () => {
    const screen = await openEditDialogForRow({ id: 'ref-allele-unknown', index: 1, locus_id: 'locus-9', seq: 'ACGT' });

    await expect.element(screen.getByText('Edit item: locus-9 - 1', { exact: true })).toBeVisible();
  });

  it('names a reference allele by its locus alone when its index is missing', async () => {
    const screen = await openEditDialogForRow({ id: 'ref-allele-no-index', index: null, locus_id: 'locus-1', seq: 'ACGT' });

    await expect.element(screen.getByText('Edit item: A - Alpha', { exact: true })).toBeVisible();
  });

  it('names a reference allele by its sequence when its index and locus are missing', async () => {
    const screen = await openEditDialogForRow({ id: 'ref-allele-seq-only', index: null, locus_id: '', seq: 'TTAA' });

    await expect.element(screen.getByText('Edit item: TTAA', { exact: true })).toBeVisible();
  });

  it('names a reference allele by its ID when its sequence, locus and index are all missing', async () => {
    const screen = await openEditDialogForRow({ id: 'ref-allele-epsilon', index: null, locus_id: '', seq: '' });

    await expect.element(screen.getByText('Edit item: ref-allele-epsilon', { exact: true })).toBeVisible();
  });
});
