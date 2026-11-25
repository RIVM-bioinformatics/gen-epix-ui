import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbRefSeq } from '@gen-epix/api-seqdb';
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

import { RefSeqsAdminPage } from './RefSeqsAdminPage';

type RefSeqFixture = { readonly id: string } & SeqDbRefSeq;

const REF_SEQS_PATH = '/v1/ref_seqs';
const TAXA_PATH = '/v1/taxa';
const ROUTE_PATH = '/management/ref_seqs';
const URL = '/management/ref_seqs';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const REF_SEQ_PERMISSIONS = [
  { command_name: SeqDbCommandName.RefSeqCrudCommand, permission_type: SeqDbPermissionType.CREATE },
] as unknown as CommonDbApiPermission[];

const refSeqAlphaFixture: RefSeqFixture = {
  code: 'RS-A',
  description: 'Alpha description',
  genbank_accession_code: 'GB-A',
  id: 'ref-seq-alpha',
  length: 8,
  name: 'Alpha Sequence',
  seq: 'ACGTACGT',
  seq_format: SeqDbSeqFormat.STR_DNA,
  taxon_id: 'taxon-1',
};

const refSeqBetaFixture: RefSeqFixture = {
  code: 'RS-B',
  id: 'ref-seq-beta',
  length: 4,
  name: 'Beta Sequence',
  seq: 'GGCC',
  taxon_id: 'taxon-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockTaxa = () => {
  mockApiRequest('GET', TAXA_PATH, () => Response.json([
    { code: 'TX-1', id: 'taxon-1', name: 'Taxon One' },
    { code: 'TX-2', id: 'taxon-2', name: 'Taxon Two' },
  ]));
};

const renderPage = async (initialItems: RefSeqFixture[] = [refSeqAlphaFixture, refSeqBetaFixture], permissions = REF_SEQ_PERMISSIONS) => {
  mockTaxa();
  const mock = mockCrudApi(REF_SEQS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <RefSeqsAdminPage />, {
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
const mockRefSeqPost = (responseBody: (body: Partial<SeqDbRefSeq>) => unknown) => {
  const postBodies: Partial<SeqDbRefSeq>[] = [];
  mockApiRequest('POST', REF_SEQS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbRefSeq>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

/**
 * Renders the page with a single row and opens its edit dialog through the row actions menu, so the edit title can be asserted.
 */
const openEditDialogForRow = async (row: RefSeqFixture) => {
  const { screen } = await renderPage([row]);
  await screen.getByRole('button', { name: 'Row actions' }).click();
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

/**
 * Fills the create form with valid values for every mandatory field.
 */
const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], code: string) => {
  await screen.getByRole('textbox', { name: 'Code' }).fill(code);
  await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma Sequence');
  await screen.getByRole('combobox', { name: 'Taxon' }).click();
  await screen.getByRole('option', { exact: true, name: 'TX-2 - Taxon Two' }).click();
  await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
  await screen.getByRole('combobox', { name: 'Sequence format' }).click();
  await screen.getByRole('option', { exact: true, name: 'DNA sequence' }).click();
};

describe('RefSeqsAdminPage', () => {
  it('lists the reference sequences with their taxon, sequence format, length and sequence', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Sequence' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'TX-1 - Taxon One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'TX-2 - Taxon Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DNA sequence' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '8' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'ACGTACGT' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GGCC' })).toBeInTheDocument();
  });

  it('creates a reference sequence via the ref seqs endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefSeqPost(body => ({ ...body, id: 'created-ref-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference sequence', { exact: true })).toBeVisible();
    await fillCreateForm(screen, 'RS-C');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({ code: 'RS-C', name: 'Gamma Sequence', seq: 'TTAA', taxon_id: 'taxon-2' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Gamma Sequence')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('creates a reference sequence without a sequence format', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefSeqPost(body => ({ ...body, id: 'created-ref-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference sequence', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Code' }).fill('RS-C');
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma Sequence');
    await screen.getByRole('combobox', { name: 'Taxon' }).click();
    await screen.getByRole('option', { exact: true, name: 'TX-2 - Taxon Two' }).click();
    await screen.getByRole('textbox', { name: 'Sequence' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toMatchObject({ code: 'RS-C', name: 'Gamma Sequence', seq: 'TTAA', taxon_id: 'taxon-2' });
    expect(postBodies[0]?.seq_format ?? null).toBeNull();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('blocks saving until the mandatory fields are filled and the code is valid', async () => {
    const { screen } = await renderPage();
    const postBodies = mockRefSeqPost(body => ({ ...body, id: 'created-ref-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference sequence', { exact: true })).toBeVisible();

    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.element(screen.getByText('Field is mandatory').first()).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await fillCreateForm(screen, 'A'.repeat(101));
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.element(screen.getByText('Create new reference sequence', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { name: 'Code' }).fill('RS-C');
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('shows an error notification when the created reference sequence has no ID', async () => {
    const { screen } = await renderPage();
    mockRefSeqPost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen, 'RS-C');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([refSeqAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-A' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the reference sequences when a reference sequence has an empty ID', async () => {
    mockTaxa();
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([{ code: 'RS-X', id: '', name: 'Empty ID', seq: 'ACGT', taxon_id: 'taxon-1' }]));
    const screen = await renderRoutedPage(
      <RefSeqsAdminPage />, {
        path: ROUTE_PATH,
        permissions: REF_SEQ_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-X' })).not.toBeInTheDocument();
  });

  it('fails to load the reference sequences when a reference sequence has no ID', async () => {
    mockTaxa();
    mockApiRequest('GET', REF_SEQS_PATH, () => Response.json([{ code: 'RS-X', id: null, name: 'Null ID', seq: 'ACGT', taxon_id: 'taxon-1' }]));
    const screen = await renderRoutedPage(
      <RefSeqsAdminPage />, {
        path: ROUTE_PATH,
        permissions: REF_SEQ_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-X' })).not.toBeInTheDocument();
  });

  it('names a reference sequence by its name in the edit title', async () => {
    const screen = await openEditDialogForRow(refSeqAlphaFixture);

    await expect.element(screen.getByText('Edit item: Alpha Sequence', { exact: true })).toBeVisible();
  });

  it('names a reference sequence by its code when its name is empty', async () => {
    const screen = await openEditDialogForRow({ code: 'RS-NO-NAME', id: 'ref-seq-no-name', name: '', seq: 'ACGT', taxon_id: 'taxon-1' });

    await expect.element(screen.getByText('Edit item: RS-NO-NAME', { exact: true })).toBeVisible();
  });

  it('names a reference sequence by its ID when its name and code are empty', async () => {
    const screen = await openEditDialogForRow({ code: '', id: 'ref-seq-epsilon', name: '', seq: 'ACGT', taxon_id: 'taxon-1' });

    await expect.element(screen.getByText('Edit item: ref-seq-epsilon', { exact: true })).toBeVisible();
  });
});
