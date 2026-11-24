import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbAstPrediction } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
  SeqDbQualityControlResult,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { AstPredictionsAdminPage } from './AstPredictionsAdminPage';

type AstPredictionFixture = { readonly id: string } & SeqDbAstPrediction;

const AST_PREDICTIONS_PATH = '/v1/ast_predictions';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const SEQS_PATH = '/v1/seqs';
const ROUTE_PATH = '/management/ast-predictions';
const URL = '/management/ast-predictions';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const AST_PREDICTION_PERMISSIONS = [
  { command_name: SeqDbCommandName.AstPredictionCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.AstPredictionCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.AstPredictionCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const predictionAlphaFixture: AstPredictionFixture = {
  content: 'ACGT',
  content_hash: 'hash-alpha',
  format: 'FASTA',
  id: 'ast-prediction-alpha',
  protocol_id: 'protocol-1',
  qc_report: { summary: 'ok' },
  qc_result_human: SeqDbQualityControlResult.FAIL,
  qc_result_machine: SeqDbQualityControlResult.PASS,
  qc_score: 90,
  sample_id: 'sample-1',
  seq_id: 'seq-1',
};

const predictionBetaFixture: AstPredictionFixture = {
  content: 'GGCC',
  content_hash: 'hash-beta',
  format: 'CSV',
  id: 'ast-prediction-beta',
  protocol_id: 'protocol-2',
  sample_id: 'sample-unknown',
  seq_id: 'seq-unknown',
};

const predictionGammaFixture: AstPredictionFixture = {
  content: 'TTAA',
  content_hash: 'hash-gamma',
  format: 'FASTA',
  id: 'ast-prediction-gamma',
  protocol_id: 'protocol-1',
  sample_id: 'sample-1',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockOptions = () => {
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([{ code: 'S-1', id: 'sample-1' }]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { id: 'protocol-1', name: 'Protocol One' },
    { code: 'P-2', id: 'protocol-2' },
  ]));
  mockApiRequest('GET', SEQS_PATH, () => Response.json([{ code: 'SEQ-1', id: 'seq-1' }]));
};

const renderPage = async (initialItems: AstPredictionFixture[] = [predictionAlphaFixture, predictionBetaFixture], permissions = AST_PREDICTION_PERMISSIONS) => {
  mockOptions();
  const mock = mockCrudApi(AST_PREDICTIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <AstPredictionsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

describe('AstPredictionsAdminPage', () => {
  it('lists the AST predictions with resolved option labels and QC results', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'S-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SEQ-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Pass' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Fail' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '90' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).toBeInTheDocument();
  });

  it('creates an AST prediction while leaving the optional sequence and QC fields empty', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new AST prediction', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('hash-new');
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      content: 'TTAA',
      content_hash: 'hash-new',
      protocol_id: 'protocol-1',
      sample_id: 'sample-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('creates an AST prediction with a sequence, QC results and score', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Sequence' }).click();
    await screen.getByRole('option', { exact: true, name: 'SEQ-1' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('hash-new');
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
    await screen.getByRole('combobox', { exact: true, name: 'Machine quality-control result' }).click();
    await screen.getByRole('option', { exact: true, name: 'Warning' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Human quality-control result' }).click();
    await screen.getByRole('option', { exact: true, name: 'Pass' }).click();
    await screen.getByRole('spinbutton', { exact: true, name: 'Quality-control score' }).fill('75');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      qc_result_human: SeqDbQualityControlResult.PASS,
      qc_result_machine: SeqDbQualityControlResult.WARN,
      qc_score: 75,
      seq_id: 'seq-1',
    }));
  });

  it('updates an AST prediction and keeps its QC report', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: S-1 - Protocol One - SEQ-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FASTQ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${AST_PREDICTIONS_PATH}/ast-prediction-alpha`);
    expect(putCall?.body).toMatchObject({ format: 'FASTQ', qc_report: { summary: 'ok' } });
  });

  it('names an AST prediction without a sequence by its sample and protocol', async () => {
    const { screen } = await renderPage([predictionGammaFixture]);

    await screen.getByRole('cell', { exact: true, name: 'hash-gamma' }).click();
    await expect.element(screen.getByText('Edit item: S-1 - Protocol One', { exact: true })).toBeVisible();
  });

  it('names an AST prediction with unknown option IDs by their raw IDs', async () => {
    const { screen } = await renderPage([predictionBetaFixture]);

    await screen.getByRole('cell', { exact: true, name: 'hash-beta' }).click();
    await expect.element(screen.getByText('Edit item: sample-unknown - P-2 - seq-unknown', { exact: true })).toBeVisible();
  });

  it('names an AST prediction by its ID when its sample, protocol and sequence cannot be named', async () => {
    const { screen } = await renderPage([{ ...predictionGammaFixture, id: 'ast-prediction-delta', protocol_id: '', sample_id: '' }]);

    await screen.getByRole('cell', { exact: true, name: 'hash-gamma' }).click();
    await expect.element(screen.getByText('Edit item: ast-prediction-delta', { exact: true })).toBeVisible();
  });

  it('deletes an AST prediction', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${AST_PREDICTIONS_PATH}/ast-prediction-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).not.toBeInTheDocument();
  });

  it('shows an error notification when deleting an AST prediction without an ID', async () => {
    const { screen } = await renderPage([{ ...predictionAlphaFixture, id: null }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });

  it('reports a failed delete of an AST prediction without any name', async () => {
    const { screen } = await renderPage([{ ...predictionGammaFixture, id: null, protocol_id: '', sample_id: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringMatching(/^AST prediction could not be deleted\.$/)]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([predictionAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
