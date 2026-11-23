import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbLocusSetInput } from '@gen-epix/api-seqdb';
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

import { LocusSetsAdminPage } from './LocusSetsAdminPage';

type LocusSetFixture = { readonly id: string } & SeqDbLocusSetInput;

const LOCUS_SETS_PATH = '/v1/locus_sets';
const LOCI_PATH = '/v1/loci';
const ROUTE_PATH = '/management/locus_sets';
const URL = '/management/locus_sets';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const LOCUS_SET_PERMISSIONS = [
  { command_name: SeqDbCommandName.LocusSetCrudCommand, permission_type: SeqDbPermissionType.CREATE },
] as unknown as CommonDbApiPermission[];

const lociFixture = [
  { code: 'LOC-A', id: 'locus-1', name: 'Alpha locus' },
  { code: 'LOC-B', id: 'locus-2' },
];

const locusSetAlphaFixture: LocusSetFixture = {
  code: 'SET-A',
  id: 'set-1',
  locus_ids: ['locus-1', 'locus-2'],
  name: 'Set alpha',
};

const locusSetBetaFixture: LocusSetFixture = {
  code: 'SET-B',
  id: 'set-2',
  locus_ids: ['locus-2', 'missing-locus'],
  name: 'Set beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: LocusSetFixture[] = [locusSetAlphaFixture, locusSetBetaFixture]) => {
  mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
  const mock = mockCrudApi(LOCUS_SETS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <LocusSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: LOCUS_SET_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const openCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new locus set', { exact: true })).toBeVisible();
};

describe('LocusSetsAdminPage', () => {
  it('lists the locus sets with their code, name and the labels of their loci', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SET-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Set alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'LOC-A - Alpha locus, LOC-B' })).toBeInTheDocument();
  });

  it('shows the raw locus ID for a locus that is not among the loaded loci', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'LOC-B, missing-locus' })).toBeInTheDocument();
  });

  it('creates a locus set with the selected loci', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('SET-C');
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma set');
    await expect.element(screen.getByText('LOC-A - Alpha locus', { exact: true })).toBeVisible();
    await screen.getByText('LOC-A - Alpha locus', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.body).toEqual(expect.objectContaining({
      code: 'SET-C',
      locus_ids: ['locus-1'],
      name: 'Gamma set',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"Gamma set" has been created.')]));
  });

  it('names the created notification by the code when the created locus set has no name', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCUS_SETS_PATH, async request => {
      const body = (await request.json()) as SeqDbLocusSetInput;
      return Response.json({ code: body.code, id: 'created-bare', locus_ids: body.locus_ids }, { status: 201 });
    });

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('BARE-SET');
    await screen.getByRole('textbox', { name: 'Name' }).fill('Bare set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"BARE-SET" has been created.')]));
  });

  it('names the created notification by the ID when the created locus set has no name or code', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCUS_SETS_PATH, () => Response.json({ id: 'created-id-only', locus_ids: [] }, { status: 201 }));

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('ID-SET');
    await screen.getByRole('textbox', { name: 'Name' }).fill('Id only set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-id-only" has been created.')]));
  });

  it('shows an error notification when the created locus set has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', LOCUS_SETS_PATH, async request => Response.json(await request.json(), { status: 201 }));

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('NOID-SET');
    await screen.getByRole('textbox', { name: 'Name' }).fill('No id set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('does not save a locus set without a code', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Name' }).fill('No code set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus set', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('does not save a locus set without a name', async () => {
    const { mock, screen } = await renderPage();

    await openCreateForm(screen);
    await screen.getByRole('textbox', { name: 'Code' }).fill('NO-NAME-SET');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new locus set', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('fails to load the locus sets when a locus set has an empty ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([{ code: 'EMPTY-ID-SET', id: '', locus_ids: [] }]));
    const screen = await renderRoutedPage(
      <LocusSetsAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_SET_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByText(/SeqDB returned a locus set without an ID\./).first()).toBeVisible();
  });

  it('fails to load the locus sets when a locus set has no ID', async () => {
    mockApiRequest('GET', LOCI_PATH, () => Response.json(lociFixture));
    mockApiRequest('GET', LOCUS_SETS_PATH, () => Response.json([{ code: 'NULL-ID-SET', id: null, locus_ids: [] }]));
    const screen = await renderRoutedPage(
      <LocusSetsAdminPage />, {
        path: ROUTE_PATH,
        permissions: LOCUS_SET_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByText(/SeqDB returned a locus set without an ID\./).first()).toBeVisible();
  });
});
