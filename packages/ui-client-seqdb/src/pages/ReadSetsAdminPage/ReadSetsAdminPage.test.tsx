import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbReadSet } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbFileCompression,
  SeqDbPermissionType,
  SeqDbQualityControlResult,
  SeqDbReadsFileFormat,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ReadSetsAdminPage } from './ReadSetsAdminPage';

const READ_SETS_PATH = '/v1/read_sets';
const SAMPLES_PATH = '/v1/samples';
const PROTOCOLS_PATH = '/v1/protocols';
const FILES_PATH = '/v1/files';
const ROUTE_PATH = '/management/read-sets';
const URL = '/management/read-sets';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const createPermissions = (permissionTypes: SeqDbPermissionType[]) => permissionTypes.map((permissionType) => ({
  command_name: SeqDbCommandName.ReadSetCrudCommand,
  permission_type: permissionType,
})) as unknown as CommonDbApiPermission[];

const ALL_PERMISSIONS = createPermissions([SeqDbPermissionType.CREATE, SeqDbPermissionType.UPDATE, SeqDbPermissionType.DELETE]);

const readSetAlphaFixture: SeqDbReadSet = {
  code: 'RS-1',
  file_compression: SeqDbFileCompression.GZIP,
  file_format: SeqDbReadsFileFormat.FASTQ,
  id: 'read-set-alpha',
  protocol_id: 'protocol-1',
  qc_report: { ok: true },
  qc_result_human: SeqDbQualityControlResult.PASS,
  qc_result_machine: SeqDbQualityControlResult.WARN,
  qc_score: 7.5,
  sample_id: 'sample-1',
  sequencing_run_code: 'RUN-ALPHA',
};

// Blank code: the name falls back to the sample label.
const readSetBetaFixture: SeqDbReadSet = {
  code: '   ',
  id: 'read-set-beta',
  protocol_id: 'protocol-1',
  sample_id: 'sample-1',
  sequencing_run_code: 'RUN-BETA',
};

// Null code and a sample that is not among the options: the name falls back to the raw sample ID.
const readSetGammaFixture: SeqDbReadSet = {
  code: null,
  id: 'read-set-gamma',
  protocol_id: 'protocol-1',
  sample_id: 'sample-unknown',
  sequencing_run_code: 'RUN-GAMMA',
};

// Blank code and sample ID: the name falls back to the read set ID.
const readSetDeltaFixture: SeqDbReadSet = {
  code: '',
  id: 'read-set-delta',
  protocol_id: 'protocol-1',
  sample_id: '',
  sequencing_run_code: 'RUN-DELTA',
};

const readSetEmptyIdFixture: SeqDbReadSet = {
  code: '',
  id: '',
  protocol_id: 'protocol-1',
  sample_id: '',
  sequencing_run_code: 'RUN-EMPTY',
};

// The ID key is omitted entirely, so the name has no ID fallback.
const readSetWithoutIdKeyFixture = {
  code: '',
  protocol_id: 'protocol-1',
  sample_id: '',
  sequencing_run_code: 'RUN-NO-KEY',
} as SeqDbReadSet;

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockOptions = () => {
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([{ code: 'S-1', id: 'sample-1' }]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([{ id: 'protocol-1', name: 'Protocol One' }]));
  mockApiRequest('GET', FILES_PATH, () => Response.json([{ id: 'file-1' }]));
};

const renderPage = async (initialItems: SeqDbReadSet[] = [readSetAlphaFixture, readSetBetaFixture], permissions = ALL_PERMISSIONS) => {
  mockOptions();
  const mock = mockCrudApi(READ_SETS_PATH, initialItems as ({ readonly id: string } & SeqDbReadSet)[]);
  const screen = await renderRoutedPage(
    <ReadSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Overrides the POST handler of mockCrudApi so that the request body can be inspected per test.
 */
const mockReadSetPost = () => {
  const postBodies: Partial<SeqDbReadSet>[] = [];
  mockApiRequest('POST', READ_SETS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbReadSet>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-read-set' }, { status: 201 });
  });
  return postBodies;
};

const selectOption = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], fieldName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

// File format, file compression and both quality-control results are mandatory in the create form.
const fillMandatoryEnumFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await selectOption(screen, 'File format', 'FASTQ');
  await selectOption(screen, 'File compression', 'GZIP');
  await selectOption(screen, 'Machine quality-control result', 'Warning');
  await selectOption(screen, 'Human quality-control result', 'Pass');
};

const deleteRowByRunCode = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], runCode: string) => {
  await screen.getByRole('row').filter({ hasText: runCode }).getByRole('button', { name: 'Row actions' }).click();
  await screen.getByRole('menuitem', { name: 'Delete' }).click();
  await screen.getByRole('button', { name: 'Confirm' }).click();
};

describe('ReadSetsAdminPage', () => {
  it('lists read sets with their code and the labels of their option columns', async () => {
    const { screen } = await renderPage([readSetAlphaFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'S-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'FASTQ' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'GZIP' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Warning' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Pass' })).toBeInTheDocument();
  });

  it('creates a read set with the selected sample, protocol, quality-control values and score', async () => {
    const { screen } = await renderPage([readSetAlphaFixture]);
    const postBodies = mockReadSetPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new read set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('RS-NEW');
    await selectOption(screen, 'Sample', 'S-1');
    await selectOption(screen, 'Protocol', 'Protocol One');
    await fillMandatoryEnumFields(screen);
    await screen.getByRole('spinbutton', { exact: true, name: 'Quality-control score' }).fill('4.5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      code: 'RS-NEW',
      file_compression: SeqDbFileCompression.GZIP,
      file_format: SeqDbReadsFileFormat.FASTQ,
      protocol_id: 'protocol-1',
      qc_result_human: SeqDbQualityControlResult.PASS,
      qc_result_machine: SeqDbQualityControlResult.WARN,
      qc_score: 4.5,
      sample_id: 'sample-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not submit the create form when the sample and protocol are missing', async () => {
    const { screen } = await renderPage([readSetAlphaFixture]);
    const postBodies = mockReadSetPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('RS-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new read set', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await selectOption(screen, 'Sample', 'S-1');
    await selectOption(screen, 'Protocol', 'Protocol One');
    await fillMandatoryEnumFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('updates a read set via the read sets endpoint and keeps its quality-control report', async () => {
    const { mock, screen } = await renderPage([readSetAlphaFixture]);

    await screen.getByRole('cell', { exact: true, name: 'RS-1' }).click();
    await expect.element(screen.getByText('Edit item: RS-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('RS-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${READ_SETS_PATH}/read-set-alpha`);
    expect(putCall?.body).toMatchObject({
      code: 'RS-2',
      id: 'read-set-alpha',
      qc_report: { ok: true },
    });
  });

  it('deletes a read set via the read sets endpoint', async () => {
    const { mock, screen } = await renderPage([readSetAlphaFixture]);

    await deleteRowByRunCode(screen, 'RUN-ALPHA');

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')).toEqual(expect.objectContaining({
      pathname: `${READ_SETS_PATH}/read-set-alpha`,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"RS-1" has been deleted.')]));
  });

  it('names a read set by its sample label when its code is blank', async () => {
    const { screen } = await renderPage([readSetBetaFixture]);

    await deleteRowByRunCode(screen, 'RUN-BETA');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"S-1" has been deleted.')]));
  });

  it('names a read set by its raw sample ID when its code is null and the sample is unknown', async () => {
    const { screen } = await renderPage([readSetGammaFixture]);

    await deleteRowByRunCode(screen, 'RUN-GAMMA');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"sample-unknown" has been deleted.')]));
  });

  it('names a read set by its ID when its code and sample ID are blank', async () => {
    const { screen } = await renderPage([readSetDeltaFixture]);

    await deleteRowByRunCode(screen, 'RUN-DELTA');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"read-set-delta" has been deleted.')]));
  });

  it('does not send a delete and shows an error notification when the read set has an empty ID', async () => {
    const { mock, screen } = await renderPage([readSetEmptyIdFixture]);

    await deleteRowByRunCode(screen, 'RUN-EMPTY');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('shows an error notification when the read set has no ID key', async () => {
    const { mock, screen } = await renderPage([readSetWithoutIdKeyFixture]);

    await deleteRowByRunCode(screen, 'RUN-NO-KEY');

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted.')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([readSetAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'RS-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
