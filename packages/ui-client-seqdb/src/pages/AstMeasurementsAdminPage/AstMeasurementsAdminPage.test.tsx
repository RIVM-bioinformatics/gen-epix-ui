import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbAstMeasurement } from '@gen-epix/api-seqdb';
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

import { AstMeasurementsAdminPage } from './AstMeasurementsAdminPage';

type AstMeasurementFixture = { readonly id: string } & SeqDbAstMeasurement;

const AST_MEASUREMENTS_PATH = '/v1/ast_measurements';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const ROUTE_PATH = '/management/ast-measurements';
const URL = '/management/ast-measurements';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const AST_MEASUREMENT_PERMISSIONS = [
  { command_name: SeqDbCommandName.AstMeasurementCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.AstMeasurementCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.AstMeasurementCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const measurementAlphaFixture: AstMeasurementFixture = {
  content: 'ACGT',
  content_hash: 'hash-alpha',
  format: 'FASTA',
  id: 'ast-measurement-alpha',
  protocol_id: 'protocol-1',
  qc_report: { summary: 'ok' },
  qc_result_human: SeqDbQualityControlResult.FAIL,
  qc_result_machine: SeqDbQualityControlResult.PASS,
  qc_score: 90,
  sample_id: 'sample-1',
};

const measurementBetaFixture: AstMeasurementFixture = {
  content: 'GGCC',
  content_hash: 'hash-beta',
  format: 'CSV',
  id: 'ast-measurement-beta',
  protocol_id: 'protocol-2',
  sample_id: 'sample-unknown',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockOptions = () => {
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([{ code: 'S-1', id: 'sample-1' }]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { id: 'protocol-1', name: 'Protocol One' },
    { code: 'P-2', id: 'protocol-2' },
  ]));
};

const renderPage = async (initialItems: AstMeasurementFixture[] = [measurementAlphaFixture, measurementBetaFixture], permissions = AST_MEASUREMENT_PERMISSIONS) => {
  mockOptions();
  const mock = mockCrudApi(AST_MEASUREMENTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <AstMeasurementsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

describe('AstMeasurementsAdminPage', () => {
  it('lists the AST measurements with resolved option labels and QC results', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'S-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Pass' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Fail' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '90' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).toBeInTheDocument();
  });

  it('creates an AST measurement while leaving the optional QC fields empty', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new AST measurement', { exact: true })).toBeVisible();
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

  it('creates an AST measurement with QC results and score', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('hash-new');
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
    await screen.getByRole('combobox', { exact: true, name: 'Machine quality-control result' }).click();
    await screen.getByRole('option', { exact: true, name: 'Warning' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Human quality-control result' }).click();
    await screen.getByRole('option', { exact: true, name: 'Pass' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Quality-control score' }).fill('75');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      qc_result_human: SeqDbQualityControlResult.PASS,
      qc_result_machine: SeqDbQualityControlResult.WARN,
      qc_score: 75,
    }));
  });

  it('updates an AST measurement and keeps its QC report', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: S-1 - Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FASTQ');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${AST_MEASUREMENTS_PATH}/ast-measurement-alpha`);
    expect(putCall?.body).toMatchObject({ format: 'FASTQ', qc_report: { summary: 'ok' } });
  });

  it('deletes an AST measurement', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${AST_MEASUREMENTS_PATH}/ast-measurement-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).not.toBeInTheDocument();
  });

  it('shows an error notification when deleting an AST measurement without an ID', async () => {
    const { screen } = await renderPage([{ ...measurementAlphaFixture, id: null }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });

  it('names an AST measurement by its ID when its sample and protocol cannot be named', async () => {
    const { screen } = await renderPage([{ ...measurementAlphaFixture, id: 'ast-measurement-gamma', protocol_id: '', sample_id: '' }]);

    await screen.getByRole('cell', { exact: true, name: 'hash-alpha' }).click();
    await expect.element(screen.getByText('Edit item: ast-measurement-gamma', { exact: true })).toBeVisible();
  });

  it('reports a failed delete of an AST measurement without any name', async () => {
    const { screen } = await renderPage([{ ...measurementAlphaFixture, id: null, protocol_id: '', sample_id: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringMatching(/^AST measurement could not be deleted\.$/)]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([measurementAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'hash-alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
