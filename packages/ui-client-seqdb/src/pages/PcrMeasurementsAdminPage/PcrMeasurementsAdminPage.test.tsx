import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbPcrMeasurement } from '@gen-epix/api-seqdb';
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

import { PcrMeasurementsAdminPage } from './PcrMeasurementsAdminPage';

type PcrMeasurementFixture = { readonly id: string } & SeqDbPcrMeasurement;

const PCR_MEASUREMENTS_PATH = '/v1/pcr_measurements';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const ROUTE_PATH = '/management/pcr-measurements';
const URL = '/management/pcr-measurements';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const PCR_MEASUREMENT_PERMISSIONS = [
  { command_name: SeqDbCommandName.PcrMeasurementCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.PcrMeasurementCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.PcrMeasurementCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const measurementAlphaFixture: PcrMeasurementFixture = {
  content: 'ACGT',
  content_hash: 'hash-alpha',
  format: 'FASTA',
  id: 'pcr-measurement-alpha',
  protocol_id: 'protocol-1',
  qc_result_human: SeqDbQualityControlResult.FAIL,
  qc_result_machine: SeqDbQualityControlResult.PASS,
  qc_score: 90,
  sample_id: 'sample-1',
};

const measurementBetaFixture: PcrMeasurementFixture = {
  content: 'GGCC',
  content_hash: 'hash-beta',
  format: 'CSV',
  id: 'pcr-measurement-beta',
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

const renderPage = async (initialItems: PcrMeasurementFixture[] = [measurementAlphaFixture, measurementBetaFixture], permissions = PCR_MEASUREMENT_PERMISSIONS) => {
  mockOptions();
  const mock = mockCrudApi(PCR_MEASUREMENTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <PcrMeasurementsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
  await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
  await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
  await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('hash-new');
  await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
};

const selectQualityControlResults = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Machine quality-control result' }).click();
  await screen.getByRole('option', { exact: true, name: 'Warning' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Human quality-control result' }).click();
  await screen.getByRole('option', { exact: true, name: 'Pass' }).click();
};

describe('PcrMeasurementsAdminPage', () => {
  it('lists the PCR measurements with their sample, protocol, format, content hash, QC results and score', async () => {
    const { screen } = await renderPage();

    const alphaRow = screen.getByRole('row').filter({ hasText: 'hash-alpha' });
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'S-1' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'FASTA' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'Fail' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'Pass' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: '90' })).toBeVisible();

    const betaRow = screen.getByRole('row').filter({ hasText: 'hash-beta' });
    await expect.element(betaRow.getByRole('cell', { exact: true, name: 'P-2' })).toBeVisible();
    await expect.element(betaRow.getByRole('cell', { exact: true, name: 'CSV' })).toBeVisible();
  });

  it('creates a PCR measurement with QC results and score', async () => {
    const { mock, screen } = await renderPage();

    await fillCreateForm(screen);
    await selectQualityControlResults(screen);
    await screen.getByRole('spinbutton', { exact: true, name: 'Quality-control score' }).fill('75');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      content: 'TTAA',
      content_hash: 'hash-new',
      format: 'CSV',
      protocol_id: 'protocol-1',
      qc_result_human: SeqDbQualityControlResult.PASS,
      qc_result_machine: SeqDbQualityControlResult.WARN,
      qc_score: 75,
      sample_id: 'sample-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('S-1 - Protocol One')]));
  });

  it('does not save a PCR measurement without a content hash', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
    await screen.getByRole('option', { exact: true, name: 'S-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new PCR measurement', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('does not save a PCR measurement without a sample', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('CSV');
    await screen.getByRole('textbox', { exact: true, name: 'Content hash' }).fill('hash-new');
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('TTAA');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new PCR measurement', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('updates a PCR measurement and sends its QC score', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-alpha' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: S-1 - Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FASTQ');
    await screen.getByRole('spinbutton', { exact: true, name: 'Quality-control score' }).fill('95');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PCR_MEASUREMENTS_PATH}/pcr-measurement-alpha`);
    expect(putCall?.body).toMatchObject({ format: 'FASTQ', qc_score: 95 });
  });

  it('names the edited PCR measurement by its ID when the sample and protocol are unknown', async () => {
    const { screen } = await renderPage([{ content: 'AA', content_hash: 'hash-gamma', format: 'FASTA', id: 'pcr-measurement-gamma', protocol_id: '', sample_id: '' }]);

    await screen.getByRole('row').filter({ hasText: 'hash-gamma' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();

    await expect.element(screen.getByText('Edit item: pcr-measurement-gamma', { exact: true })).toBeVisible();
  });

  it('names the edited PCR measurement by the raw sample and protocol IDs when they are not in the options', async () => {
    const { screen } = await renderPage([{ content: 'AA', content_hash: 'hash-delta', format: 'FASTA', id: 'pcr-measurement-delta', protocol_id: 'protocol-x', sample_id: 'sample-y' }]);

    await screen.getByRole('row').filter({ hasText: 'hash-delta' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();

    await expect.element(screen.getByText('Edit item: sample-y - protocol-x', { exact: true })).toBeVisible();
  });

  it('shows an error notification when the created PCR measurement has no ID', async () => {
    const { screen } = await renderPage();
    const postBodies: unknown[] = [];
    mockApiRequest('POST', PCR_MEASUREMENTS_PATH, async (request) => {
      const body = await request.json() as unknown;
      postBodies.push(body);
      return Response.json(body, { status: 201 });
    });

    await fillCreateForm(screen);
    await selectQualityControlResults(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('deletes a PCR measurement', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'hash-beta' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PCR_MEASUREMENTS_PATH}/pcr-measurement-beta`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted')]));
  });

  it('shows an error notification when deleting a PCR measurement without an ID', async () => {
    mockOptions();
    mockApiRequest('GET', PCR_MEASUREMENTS_PATH, () => Response.json([{ content: 'AA', content_hash: 'hash-null', format: 'FASTA', id: null, protocol_id: '', sample_id: '' }]));
    const screen = await renderRoutedPage(
      <PcrMeasurementsAdminPage />, {
        path: ROUTE_PATH,
        permissions: PCR_MEASUREMENT_PERMISSIONS,
        url: URL,
      },
    );

    await screen.getByRole('row').filter({ hasText: 'hash-null' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });
});
