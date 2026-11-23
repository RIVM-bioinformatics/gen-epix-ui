import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeqClassification } from '@gen-epix/api-seqdb';
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

import { SeqClassificationsAdminPage } from './SeqClassificationsAdminPage';

const CLASSIFICATIONS_PATH = '/v1/seq_classifications';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const SEQ_CATEGORIES_PATH = '/v1/seq_categories';
const SEQS_PATH = '/v1/seqs';
const ROUTE_PATH = '/management/seq-classifications';
const URL = '/management/seq-classifications';
const VALID_CONTENT_HASH = '0a1b2c3d-1111-2222-3333-444455556666';

const CLASSIFICATION_PERMISSIONS = [SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE].map((permission_type) => ({
  command_name: SeqDbCommandName.SeqClassificationCrudCommand,
  permission_type,
})) as unknown as CommonDbApiPermission[];

const sampleFixture = { code: 'SAMPLE-1', id: 'sample-one' };
const protocolFixture = { id: 'protocol-one', name: 'Protocol one' };
const categoryFixture = { code: 'CAT-1', id: 'category-one', name: 'Category one' };
const seqFixture = { code: 'SEQ-1', id: 'seq-one' };

const classificationFixture: SeqDbSeqClassification = {
  content: 'ACGT-content',
  content_hash: VALID_CONTENT_HASH,
  format: 'FASTA',
  id: 'classification-one',
  primary_category_id: 'category-one',
  protocol_id: 'protocol-one',
  qc_report: { note: 'kept' },
  qc_score: 0.5,
  sample_id: 'sample-one',
  seq_id: 'seq-one',
};

const CLASSIFICATION_LABEL = 'SAMPLE-1 - CAT-1 - Category one - Protocol one';

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([protocolFixture]));
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([sampleFixture]));
  mockApiRequest('GET', SEQ_CATEGORIES_PATH, () => Response.json([categoryFixture]));
  mockApiRequest('GET', SEQS_PATH, () => Response.json([seqFixture]));
};

const renderPageWithItems = async (items: SeqDbSeqClassification[]) => {
  mockLookups();
  const mock = mockCrudApi(CLASSIFICATIONS_PATH, items as ({ readonly id: string } & SeqDbSeqClassification)[]);
  const screen = await renderRoutedPage(
    <SeqClassificationsAdminPage />, {
      path: ROUTE_PATH,
      permissions: CLASSIFICATION_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActionMenuItem = async (screen: Awaited<ReturnType<typeof renderPageWithItems>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPageWithItems>>['screen'], { includeSample = true } = {}) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new sequence classification', { exact: true })).toBeVisible();
  if (includeSample) {
    await screen.getByRole('combobox', { name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'SAMPLE-1' }).click();
  }
  await screen.getByRole('combobox', { name: 'Protocol' }).click();
  await screen.getByRole('option', { exact: true, name: 'Protocol one' }).click();
  await screen.getByRole('combobox', { name: 'Primary category' }).click();
  await screen.getByRole('option', { exact: true, name: 'CAT-1 - Category one' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FASTA');
  await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill(VALID_CONTENT_HASH);
  await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-new');
};

describe('SeqClassificationsAdminPage', () => {
  it('lists the classifications with the labels of their sample, category, and protocol', async () => {
    const { screen } = await renderPageWithItems([classificationFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'CAT-1 - Category one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-1' })).toBeInTheDocument();
  });

  it('names an unknown sample, category, and protocol by their raw IDs', async () => {
    const { mock, screen } = await renderPageWithItems([
      {
        content: 'ACGT',
        content_hash: VALID_CONTENT_HASH,
        format: 'FASTA',
        id: 'classification-unknown',
        primary_category_id: 'category-unknown',
        protocol_id: 'protocol-unknown',
        sample_id: 'sample-unknown',
      },
    ]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(call => call.method === 'DELETE')?.pathname).toBe(`${CLASSIFICATIONS_PATH}/classification-unknown`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"sample-unknown - category-unknown - protocol-unknown" has been deleted.')]));
  });

  it('names a classification without labels by the first 60 characters of its content', async () => {
    const longContent = `${'A'.repeat(60)}${'B'.repeat(10)}`;
    const { screen } = await renderPageWithItems([
      {
        content: longContent,
        content_hash: VALID_CONTENT_HASH,
        format: 'FASTA',
        id: 'classification-content',
        primary_category_id: '',
        protocol_id: '',
        sample_id: '',
      },
    ]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([`Sequence classification "${'A'.repeat(60)}" has been deleted.`]));
  });

  it('names a classification without labels or content by its ID', async () => {
    const { screen } = await renderPageWithItems([
      {
        content: '',
        content_hash: VALID_CONTENT_HASH,
        format: 'FASTA',
        id: 'classification-id-only',
        primary_category_id: '',
        protocol_id: '',
        sample_id: '',
      },
    ]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"classification-id-only" has been deleted.')]));
  });

  it('creates a classification with the required fields', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(1);
    expect(mock.calls.find(call => call.method === 'POST')?.body).toEqual(expect.objectContaining({
      content: 'ACGT-new',
      content_hash: VALID_CONTENT_HASH,
      format: 'FASTA',
      primary_category_id: 'category-one',
      protocol_id: 'protocol-one',
      sample_id: 'sample-one',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining(`"${CLASSIFICATION_LABEL}" has been created.`)]));
  });

  it('does not create a classification with a malformed content hash', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await fillCreateForm(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('not-a-hash');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence classification', { exact: true })).toBeVisible();
    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(0);
  });

  it('does not create a classification without a sample', async () => {
    const { mock, screen } = await renderPageWithItems([]);

    await fillCreateForm(screen, { includeSample: false });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence classification', { exact: true })).toBeVisible();
    await expect.poll(() => mock.calls.filter(call => call.method === 'POST').length).toBe(0);
  });

  it('reports a create error when the created classification has no ID', async () => {
    const { screen } = await renderPageWithItems([]);
    mockApiRequest('POST', CLASSIFICATIONS_PATH, async (request) => {
      const body = await request.json() as Partial<SeqDbSeqClassification>;
      return Response.json(body, { status: 201 });
    });

    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining(`"${CLASSIFICATION_LABEL}" could not be created.`)]));
  });

  it('saves an edited classification with its ID and quality control values', async () => {
    const { mock, screen } = await renderPageWithItems([classificationFixture]);

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'PUT').length).toBe(1);
    expect(mock.calls.find(call => call.method === 'PUT')?.body).toEqual(expect.objectContaining({
      content: 'ACGT-content',
      id: 'classification-one',
      primary_category_id: 'category-one',
      protocol_id: 'protocol-one',
      qc_report: { note: 'kept' },
      qc_score: 0.5,
      sample_id: 'sample-one',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining(`"${CLASSIFICATION_LABEL}" has been saved.`)]));
  });

  it('reports a save error when the saved classification has no ID', async () => {
    const { screen } = await renderPageWithItems([classificationFixture]);
    mockApiRequest('PUT', `${CLASSIFICATIONS_PATH}/classification-one`, () => Response.json({ content: 'ACGT-content' }));

    await openRowActionMenuItem(screen, 'Edit');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining(`"${CLASSIFICATION_LABEL}" could not be saved.`)]));
  });

  it('does not list the classifications when the list contains a classification without an ID', async () => {
    const { screen } = await renderPageWithItems([classificationFixture, { ...classificationFixture, id: '' }]);

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: SeqDB returned a sequence classification without an ID\.$/)).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });

  it('deletes a classification with an ID', async () => {
    const { mock, screen } = await renderPageWithItems([classificationFixture]);

    await openRowActionMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(call => call.method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining(`"${CLASSIFICATION_LABEL}" has been deleted.`)]));
  });

  it('hides the create action without permissions', async () => {
    mockLookups();
    mockCrudApi(CLASSIFICATIONS_PATH, [classificationFixture] as ({ readonly id: string } & SeqDbSeqClassification)[]);
    const screen = await renderRoutedPage(
      <SeqClassificationsAdminPage />, {
        path: ROUTE_PATH,
        permissions: [],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
