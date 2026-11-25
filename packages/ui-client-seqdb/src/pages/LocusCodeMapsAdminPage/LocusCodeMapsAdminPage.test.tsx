import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbLocusCodeMap } from '@gen-epix/api-seqdb';
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

import { LocusCodeMapsAdminPage } from './LocusCodeMapsAdminPage';

type LocusCodeMapFixture = { readonly id: string } & SeqDbLocusCodeMap;

const LOCI_PATH = '/v1/loci';
const LOCUS_CODE_MAPS_PATH = '/v1/locus_code_maps';
const ROUTE_PATH = '/management/locus_code_maps';
const URL = '/management/locus_code_maps';
const MAP_JSON_LABEL = 'Locus code mappings (JSON)';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const LOCUS_CODE_MAP_PERMISSIONS = [
  { command_name: SeqDbCommandName.LocusCodeMapCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.LocusCodeMapCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.LocusCodeMapCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const lociFixture = [
  { code: 'LOC-A', id: 'locus-1', name: 'Alpha locus' },
  { code: 'LOC-B', id: 'locus-2' },
];

const codeMapAlphaFixture: LocusCodeMapFixture = {
  code: 'MAP-A',
  code_map: { A1: 'locus-1', B2: 'locus-2' },
  id: 'code-map-1',
};

const codeMapBetaFixture: LocusCodeMapFixture = {
  code: 'MAP-B',
  code_map: { C3: 'missing-locus' },
  id: 'code-map-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: LocusCodeMapFixture[] = [codeMapAlphaFixture, codeMapBetaFixture]) => {
  mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
  const mock = mockCrudApi(LOCUS_CODE_MAPS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <LocusCodeMapsAdminPage />, {
      path: ROUTE_PATH,
      permissions: LOCUS_CODE_MAP_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const openCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new locus code map', { exact: true })).toBeVisible();
};

const openEditForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
};

describe('LocusCodeMapsAdminPage', () => {
  it('lists the locus code maps with their code and the labels of their mapped loci', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'MAP-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'A1: LOC-A - Alpha locus; B2: LOC-B' })).toBeInTheDocument();
  });

  it('shows the raw locus ID for a mapped locus that is not among the loaded loci', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'C3: missing-locus' })).toBeInTheDocument();
  });

  it('creates a locus code map with the parsed code map', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('MAP-C');
    await screen.getByRole('textbox', { name: MAP_JSON_LABEL }).fill('{"D4": "locus-1"}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.body).toEqual({ code: 'MAP-C', code_map: { D4: 'locus-1' } });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"MAP-C" has been created.')]));
  });

  it('creates a locus code map with an empty code map when the default JSON is kept', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('MAP-EMPTY');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({ code: 'MAP-EMPTY', code_map: {} });
  });

  it('names the created notification by the ID when the created locus code map has no code', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCUS_CODE_MAPS_PATH, () => Response.json({ code_map: {}, id: 'created-id-only' }, { status: 201 }));

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('ID-MAP');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-id-only" has been created.')]));
  });

  it('shows an error notification when the created locus code map has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCUS_CODE_MAPS_PATH, async request => Response.json(await request.json(), { status: 201 }));

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('NOID-MAP');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('edits a locus code map with the JSON form of its code map and sends the parsed code map', async () => {
    const { mock, screen } = await renderPage();

    await openEditForm(screen);
    await expect.element(screen.getByText('Edit item: MAP-A', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: MAP_JSON_LABEL })).toHaveValue(JSON.stringify({ A1: 'locus-1', B2: 'locus-2' }, null, 2));
    await screen.getByRole('textbox', { name: MAP_JSON_LABEL }).fill('{"E5": "locus-2"}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'PUT')).toEqual(expect.objectContaining({
      body: { code: 'MAP-A', code_map: { E5: 'locus-2' }, id: 'code-map-1' },
      pathname: `${LOCUS_CODE_MAPS_PATH}/code-map-1`,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"MAP-A" has been saved.')]));
  });

  it('shows an error notification when the updated locus code map has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${LOCUS_CODE_MAPS_PATH}/code-map-1`, () => Response.json({ code: 'MAP-A', code_map: {} }));

    await openEditForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('deletes a locus code map after confirmation', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${LOCUS_CODE_MAPS_PATH}/code-map-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"MAP-A" has been deleted.')]));
  });

  it('names a locus code map by its ID when its code is empty', async () => {
    const { mock, screen } = await renderPage([{ code: '', code_map: {}, id: 'code-map-no-code' }]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"code-map-no-code" has been deleted.')]));
  });

  it('opens the edit form of a locus code map with an empty code without a name in its title', async () => {
    const { screen } = await renderPage([{ code: '', code_map: { A1: 'locus-1' }, id: 'code-map-no-code' }]);

    await openEditForm(screen);
    await expect.element(screen.getByText('Edit item:', { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: MAP_JSON_LABEL })).toHaveValue(JSON.stringify({ A1: 'locus-1' }, null, 2));
  });

  it.each([
    ['an empty value', ''],
    ['invalid JSON', '{'],
    ['a JSON number', '1'],
    ['a JSON null', 'null'],
    ['a JSON array', '[]'],
    ['a non-string locus ID', '{"A": 1}'],
    ['a code longer than 255 characters', `{"${'A'.repeat(256)}": "locus-1"}`],
    ['an unknown locus ID', '{"A": "missing-locus"}'],
  ])('does not save a locus code map with %s', async (_description, codeMapJson) => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('INVALID-MAP');
    await screen.getByRole('textbox', { name: MAP_JSON_LABEL }).fill(codeMapJson);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus code map', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('does not save a locus code map without a code', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: MAP_JSON_LABEL }).fill('{"D4": "locus-1"}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus code map', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('fails to load the locus code maps when a locus code map has an empty ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
    mockApiRequest('GET', LOCUS_CODE_MAPS_PATH, () => Response.json([{ code: 'EMPTY-ID-MAP', code_map: {}, id: '' }]));
    const screen = await renderRoutedPage(
      <LocusCodeMapsAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_CODE_MAP_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByText(/SeqDB returned a locus code map without an ID\./).first()).toBeVisible();
  });

  it('fails to load the locus code maps when a locus code map has no ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
    mockApiRequest('GET', LOCUS_CODE_MAPS_PATH, () => Response.json([{ code: 'NULL-ID-MAP', code_map: {}, id: null }]));
    const screen = await renderRoutedPage(
      <LocusCodeMapsAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_CODE_MAP_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByText(/SeqDB returned a locus code map without an ID\./).first()).toBeVisible();
  });
});
