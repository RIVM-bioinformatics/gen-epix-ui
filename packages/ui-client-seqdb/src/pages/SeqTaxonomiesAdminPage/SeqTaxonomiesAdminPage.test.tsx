import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeqTaxonomy } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
  SeqDbSeqTaxonomyFormat,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { SeqTaxonomiesAdminPage } from './SeqTaxonomiesAdminPage';

type SeqTaxonomyFixture = { readonly id: string } & SeqDbSeqTaxonomy;

const SEQ_TAXONOMIES_PATH = '/v1/seq_taxonomies';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const SEQS_PATH = '/v1/seqs';
const TAXA_PATH = '/v1/taxa';
const ROUTE_PATH = '/management/seq_taxonomies';
const URL = '/management/seq_taxonomies';
const VALID_CONTENT_HASH = '3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const SEQ_TAXONOMY_PERMISSIONS = [
  { command_name: SeqDbCommandName.SeqTaxonomyCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.SeqTaxonomyCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.SeqTaxonomyCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const LONG_CONTENT = 'D'.repeat(70);

const taxonomyAlphaFixture: SeqTaxonomyFixture = {
  content: 'ACGT',
  content_hash: VALID_CONTENT_HASH,
  content2: 'ACGT2',
  format: SeqDbSeqTaxonomyFormat.TAXONOMY_FORMAT1,
  id: 'taxonomy-alpha',
  primary_taxon_id: 'taxon-1',
  protocol_id: 'protocol-1',
  qc_score: 0.9,
  sample_id: 'sample-1',
  seq_id: 'seq-1',
};

const taxonomyBetaFixture: SeqTaxonomyFixture = {
  content: 'TTTT',
  content_hash: 'a0b1c2d3-e4f5-4a6b-8c7d-9e0f1a2b3c4d',
  id: 'taxonomy-beta',
  primary_taxon_id: 'taxon-2',
  protocol_id: 'protocol-2',
  sample_id: 'sample-2',
  seq_id: null,
};

const taxonomyGammaFixture: SeqTaxonomyFixture = {
  content: 'GGGG',
  content_hash: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  id: 'taxonomy-gamma',
  primary_taxon_id: 'unknown-taxon',
  protocol_id: 'protocol-1',
  sample_id: 'unknown-sample',
  seq_id: 'unknown-seq',
};

const taxonomyDeltaFixture: SeqTaxonomyFixture = {
  content: LONG_CONTENT,
  content_hash: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
  id: 'taxonomy-delta',
  primary_taxon_id: '',
  protocol_id: 'protocol-1',
  sample_id: '',
  seq_id: null,
};

const taxonomyEpsilonFixture: SeqTaxonomyFixture = {
  content: '',
  content_hash: 'd3e4f5a6-b7c8-4d9e-8f0a-2b3c4d5e6f70',
  id: 'taxonomy-epsilon',
  primary_taxon_id: '',
  protocol_id: 'protocol-1',
  sample_id: '',
  seq_id: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', TAXA_PATH, () => Response.json([
    { code: 'T1', id: 'taxon-1', name: 'Taxon One' },
    { code: 'T2', id: 'taxon-2', name: 'Taxon Two' },
  ]));
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
    { code: 'SAMPLE-1', id: 'sample-1' },
    { code: '', id: 'sample-2' },
  ]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { code: 'P1', id: 'protocol-1', name: 'Protocol One' },
    { code: 'P2', id: 'protocol-2', name: '' },
  ]));
  mockApiRequest('GET', SEQS_PATH, () => Response.json([
    { code: 'SEQ-1', id: 'seq-1' },
  ]));
};

const renderPage = async (initialItems: SeqTaxonomyFixture[] = [taxonomyAlphaFixture, taxonomyBetaFixture], permissions = SEQ_TAXONOMY_PERMISSIONS) => {
  mockLookups();
  const mock = mockCrudApi(SEQ_TAXONOMIES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SeqTaxonomiesAdminPage />, {
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
const mockTaxonomyPost = (responseBody: (body: Partial<SeqDbSeqTaxonomy>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SEQ_TAXONOMIES_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbSeqTaxonomy>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], contentHash = VALID_CONTENT_HASH) => {
  await screen.getByRole('combobox', { exact: true, name: 'Primary taxon' }).click();
  await screen.getByRole('option', { exact: true, name: 'T1 - Taxon One' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
  await screen.getByRole('option', { exact: true, name: 'SAMPLE-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
  await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Sequence' }).click();
  await screen.getByRole('option', { exact: true, name: 'SEQ-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Format' }).click();
  await screen.getByRole('option', { exact: true, name: 'Taxonomy format 1' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill(contentHash);
  await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-C');
};

describe('SeqTaxonomiesAdminPage', () => {
  it('lists the sequence taxonomies with their resolved lookup labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'T1 - Taxon One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'T2 - Taxon Two' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'sample-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Taxonomy format 1' })).toBeInTheDocument();
  });

  it('creates a sequence taxonomy via the sequence taxonomies endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonomyPost(body => ({ ...body, id: 'created-taxonomy' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence taxonomy', { exact: true })).toBeVisible();
    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      content: 'ACGT-C',
      content_hash: VALID_CONTENT_HASH,
      format: SeqDbSeqTaxonomyFormat.TAXONOMY_FORMAT1,
      primary_taxon_id: 'taxon-1',
      protocol_id: 'protocol-1',
      sample_id: 'sample-1',
      seq_id: 'seq-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('keeps the create dialog open while required values are missing', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonomyPost(body => ({ ...body, id: 'created-taxonomy' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill(VALID_CONTENT_HASH);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence taxonomy', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('keeps the create dialog open when the content hash is not a UUID', async () => {
    const { screen } = await renderPage();
    const postBodies = mockTaxonomyPost(body => ({ ...body, id: 'created-taxonomy' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen, 'not-a-uuid');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence taxonomy', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill(VALID_CONTENT_HASH);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('shows an error notification when the created sequence taxonomy has no ID', async () => {
    const { screen } = await renderPage();
    mockTaxonomyPost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('updates a sequence taxonomy and keeps its QC fields and content hash', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' }).click();
    await expect.element(screen.getByText('Edit item: T1 - Taxon One - SAMPLE-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SEQ_TAXONOMIES_PATH}/taxonomy-alpha`);
    expect(putCall?.body).toMatchObject({
      content: 'ACGT-UPDATED',
      content_hash: VALID_CONTENT_HASH,
      id: 'taxonomy-alpha',
      qc_score: 0.9,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('shows an error notification when the updated sequence taxonomy has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${SEQ_TAXONOMIES_PATH}/taxonomy-alpha`, async (request) => {
      const body = await request.json() as Partial<SeqDbSeqTaxonomy>;
      return Response.json({ ...body, id: null });
    });

    await screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' }).click();
    await expect.element(screen.getByText('Edit item: T1 - Taxon One - SAMPLE-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('deletes a sequence taxonomy', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SAMPLE-1' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SEQ_TAXONOMIES_PATH}/taxonomy-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });

  it('names a sequence taxonomy with unknown lookup IDs by the raw IDs', async () => {
    const { screen } = await renderPage([taxonomyGammaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: unknown-taxon - unknown-sample', { exact: true })).toBeVisible();
  });

  it('names a sequence taxonomy without lookup labels by its truncated content', async () => {
    const { screen } = await renderPage([taxonomyDeltaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${'D'.repeat(60)}`, { exact: true })).toBeVisible();
  });

  it('names a sequence taxonomy without lookup labels or content by its ID', async () => {
    const { screen } = await renderPage([taxonomyEpsilonFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: taxonomy-epsilon', { exact: true })).toBeVisible();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([taxonomyAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the sequence taxonomies when a taxonomy has an empty ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQ_TAXONOMIES_PATH, () => Response.json([{ ...taxonomyAlphaFixture, id: '' }]));
    const screen = await renderRoutedPage(
      <SeqTaxonomiesAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_TAXONOMY_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });

  it('fails to load the sequence taxonomies when a taxonomy has no ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQ_TAXONOMIES_PATH, () => Response.json([{ ...taxonomyAlphaFixture, id: null }]));
    const screen = await renderRoutedPage(
      <SeqTaxonomiesAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_TAXONOMY_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });
});
