import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeq } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbFileCompression as SeqDbFileCompressionValues,
  SeqDbPermissionType,
  SeqDbSeqFileFormat as SeqDbSeqFileFormatValues,
  SeqDbSeqFormat,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { SeqsAdminPage } from './SeqsAdminPage';

type SeqFixture = { readonly id: string } & SeqDbSeq;

const SEQS_PATH = '/v1/seqs';
const FILES_PATH = '/v1/files';
const PROTOCOLS_PATH = '/v1/protocols';
const READ_SETS_PATH = '/v1/read_sets';
const SAMPLES_PATH = '/v1/samples';
const ROUTE_PATH = '/management/seqs';
const URL = '/management/seqs';
const INVALID_CONTIGS_ERROR = 'Enter a JSON array of valid contigs';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const SEQ_PERMISSIONS = [
  { command_name: SeqDbCommandName.SeqCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.SeqCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.SeqCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const seqAlphaFixture: SeqFixture = {
  code: 'SEQ-ALPHA',
  file_compression: SeqDbFileCompressionValues.GZIP,
  file_format: SeqDbSeqFileFormatValues.FASTA,
  file_hash: 'file-hash-alpha',
  file_id: 'file-1',
  id: 'seq-alpha',
  protocol_id: 'protocol-1',
  qc_report: { summary: 'alpha' },
  qc_score: 0.9,
  read_set_id: 'read-set-1',
  read_set2_id: null,
  sample_id: 'sample-1',
  seq_hash: 'seq-hash-alpha',
  uri: null,
};

const seqBetaFixture: SeqFixture = {
  code: 'SEQ-BETA',
  contigs: [{ length: 4, seq: 'ACGT', seq_format: SeqDbSeqFormat.STR_DNA }],
  file_id: null,
  id: 'seq-beta',
  protocol_id: 'protocol-2',
  read_set_id: 'read-set-2',
  sample_id: 'sample-2',
  seq_hash: 'seq-hash-beta',
  uri: 'https://example.org/beta.fa',
};

const seqDeltaFixture: SeqFixture = {
  code: '',
  id: 'seq-delta',
  sample_id: 'sample-2',
  seq_hash: 'seq-hash-delta',
};

const seqEpsilonFixture: SeqFixture = {
  code: null,
  id: 'seq-epsilon',
  sample_id: 'sample-2',
  seq_hash: '',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', FILES_PATH, () => Response.json([{ id: 'file-1' }]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { code: 'P1', id: 'protocol-1', name: 'Protocol One' },
    { code: 'P2', id: 'protocol-2', name: '' },
  ]));
  mockApiRequest('GET', READ_SETS_PATH, () => Response.json([
    { code: 'READ-SET-1', id: 'read-set-1' },
    { code: '', id: 'read-set-2' },
  ]));
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
    { code: 'SAMPLE-1', id: 'sample-1' },
    { code: '', id: 'sample-2' },
  ]));
};

const renderPage = async (initialItems: SeqFixture[] = [seqAlphaFixture, seqBetaFixture], permissions = SEQ_PERMISSIONS) => {
  mockLookups();
  const mock = mockCrudApi(SEQS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SeqsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

type Screen = Awaited<ReturnType<typeof renderPage>>['screen'];

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockSeqPost = (responseBody: (body: Partial<SeqDbSeq>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SEQS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbSeq>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const selectOption = async (screen: Screen, fieldName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const fillSampleAndContigs = async (screen: Screen, contigsJson: string) => {
  await selectOption(screen, 'Sample', 'SAMPLE-1');
  await screen.getByRole('textbox', { exact: true, name: 'Contigs (JSON)' }).fill(contigsJson);
};

// File format, file compression and protocol start empty in the create form and fail validation until set.
const fillMandatoryEnumFields = async (screen: Screen) => {
  await selectOption(screen, 'File format', 'FASTA');
  await selectOption(screen, 'File compression', 'GZIP');
  await selectOption(screen, 'Protocol', 'Protocol One');
};

describe('SeqsAdminPage', () => {
  it('lists the sequences with their resolved lookup labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'seq-hash-alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'file-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'FASTA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GZIP' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'READ-SET-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'sample-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'https://example.org/beta.fa' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'read-set-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P2' })).toBeInTheDocument();
  });

  it('fails to load the sequences when a sequence has an empty ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQS_PATH, () => Response.json([{ ...seqAlphaFixture, id: '' }]));
    const screen = await renderRoutedPage(
      <SeqsAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' })).not.toBeInTheDocument();
  });

  it('fails to load the sequences when a sequence has no ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQS_PATH, () => Response.json([{ ...seqAlphaFixture, id: null }]));
    const screen = await renderRoutedPage(
      <SeqsAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' })).not.toBeInTheDocument();
  });

  it('creates a sequence with parsed contigs and without the contigs JSON field', async () => {
    const { screen } = await renderPage();
    const postBodies = mockSeqPost(body => ({ ...body, id: 'created-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('SEQ-NEW');
    await fillSampleAndContigs(screen, '[{"seq":"ACGT","seq_format":2,"length":4}]');
    await fillMandatoryEnumFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual({
      code: 'SEQ-NEW',
      contigs: [{ length: 4, seq: 'ACGT', seq_format: SeqDbSeqFormat.STR_DNA }],
      file_compression: SeqDbFileCompressionValues.GZIP,
      file_format: SeqDbSeqFileFormatValues.FASTA,
      file_hash: null,
      file_id: null,
      protocol_id: 'protocol-1',
      read_set_id: null,
      read_set2_id: null,
      sample_id: 'sample-1',
      uri: null,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('keeps the create dialog open while the sample or the contigs are invalid', async () => {
    const { screen } = await renderPage();
    const postBodies = mockSeqPost(body => ({ ...body, id: 'created-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.element(screen.getByText('Create new sequence', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await selectOption(screen, 'Sample', 'SAMPLE-1');
    await fillMandatoryEnumFields(screen);
    const invalidContigs = [
      'not json',
      '{}',
      '[1]',
      '[null]',
      '[{"seq":1}]',
      '[{"seq":"ACGT","seq_format":99}]',
      '[{"seq":"ACGT","length":"4"}]',
    ];
    for (const contigsJson of invalidContigs) {
      await screen.getByRole('textbox', { exact: true, name: 'Contigs (JSON)' }).fill(contigsJson);
      await screen.getByRole('button', { name: 'Save' }).click();
      await expect.element(screen.getByText(INVALID_CONTIGS_ERROR, { exact: true })).toBeVisible();
      expect(postBodies).toHaveLength(0);
    }

    await screen.getByRole('textbox', { exact: true, name: 'Contigs (JSON)' }).fill('[{"seq":"ACGT"}]');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('validates the sequence source as either a URI or a file with a file format', async () => {
    const { screen } = await renderPage();
    const postBodies = mockSeqPost(body => ({ ...body, id: 'created-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await selectOption(screen, 'Sample', 'SAMPLE-1');
    await screen.getByRole('textbox', { exact: true, name: 'URI' }).fill('https://example.org/new.fa');
    await selectOption(screen, 'File', 'file-1');
    await selectOption(screen, 'File format', 'FASTA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await screen.getByRole('textbox', { exact: true, name: 'URI' }).fill('');
    await selectOption(screen, 'File compression', 'GZIP');
    await selectOption(screen, 'Protocol', 'Protocol One');
    await screen.getByRole('textbox', { exact: true, name: 'Contigs (JSON)' }).fill('[{"seq":"ACGT"}]');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      file_format: SeqDbSeqFileFormatValues.FASTA,
      file_id: 'file-1',
      sample_id: 'sample-1',
    }));
  });

  it('requires a file format when a file is selected', async () => {
    const { screen } = await renderPage();
    const postBodies = mockSeqPost(body => ({ ...body, id: 'created-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillSampleAndContigs(screen, '[{"seq":"ACGT"}]');
    await selectOption(screen, 'File', 'file-1');
    await selectOption(screen, 'File compression', 'GZIP');
    await selectOption(screen, 'Protocol', 'Protocol One');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await selectOption(screen, 'File format', 'FASTA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('requires the forward and reverse read sets to differ', async () => {
    const { screen } = await renderPage();
    const postBodies = mockSeqPost(body => ({ ...body, id: 'created-seq' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillSampleAndContigs(screen, '[{"seq":"ACGT"}]');
    await fillMandatoryEnumFields(screen);
    await selectOption(screen, 'Read set', 'READ-SET-1');
    await selectOption(screen, 'Second read set', 'READ-SET-1');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await selectOption(screen, 'Second read set', 'read-set-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      read_set_id: 'read-set-1',
      read_set2_id: 'read-set-2',
    }));
  });

  it('shows an error notification when the created sequence has no ID', async () => {
    const { screen } = await renderPage();
    mockSeqPost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillSampleAndContigs(screen, '[]');
    await fillMandatoryEnumFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('updates a sequence without contigs and keeps its QC fields and sequence hash', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' }).click();
    await expect.element(screen.getByText('Edit item: SEQ-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('SEQ-ALPHA-EDITED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SEQS_PATH}/seq-alpha`);
    expect(putCall?.body).toMatchObject({
      code: 'SEQ-ALPHA-EDITED',
      contigs: [],
      id: 'seq-alpha',
      qc_report: { summary: 'alpha' },
      qc_score: 0.9,
      seq_hash: 'seq-hash-alpha',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('shows an error notification when the updated sequence has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${SEQS_PATH}/seq-alpha`, async (request) => {
      const body = await request.json() as Partial<SeqDbSeq>;
      return Response.json({ ...body, id: null });
    });

    await screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' }).click();
    await expect.element(screen.getByText('Edit item: SEQ-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('SEQ-ALPHA-EDITED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('does not allow saving a sequence that already has contigs', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'SEQ-BETA' }).click();
    await expect.element(screen.getByText('Edit item: SEQ-BETA', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(mock.calls.filter(({ method }) => method === 'PUT')).toHaveLength(0);
  });

  it('deletes a sequence without contigs', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SEQ-ALPHA' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SEQS_PATH}/seq-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-ALPHA' })).not.toBeInTheDocument();
  });

  it('shows an error notification and does not delete a sequence that has contigs', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SEQ-BETA' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('names a sequence without a code in the delete dialog by its sequence hash', async () => {
    const { screen } = await renderPage([seqDeltaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: seq-hash-delta', { exact: true })).toBeVisible();
  });

  it('names a sequence without a code or sequence hash in the delete dialog by its ID', async () => {
    const { screen } = await renderPage([seqEpsilonFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: seq-epsilon', { exact: true })).toBeVisible();
  });

  it('names a sequence without a code, sequence hash or ID in the edit dialog with an empty name', async () => {
    const { screen } = await renderPage([{ ...seqEpsilonFixture, id: 'seq-epsilon' }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('textbox', { exact: true, name: 'Code' })).toBeVisible();
    await expect.element(screen.getByText('Edit item:', { exact: true })).toBeVisible();
  });
});
