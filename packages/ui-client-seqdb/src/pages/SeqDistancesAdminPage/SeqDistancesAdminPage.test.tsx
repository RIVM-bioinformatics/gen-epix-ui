import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbSeqDistance } from '@gen-epix/api-seqdb';
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

import { SeqDistancesAdminPage } from './SeqDistancesAdminPage';

type SeqDistanceFixture = { readonly id: string } & SeqDbSeqDistance;

const SEQ_DISTANCES_PATH = '/v1/seq_distances';
const PROTOCOLS_PATH = '/v1/protocols';
const SAMPLES_PATH = '/v1/samples';
const SEQ_PROFILES_PATH = '/v1/seq_profiles';
const ROUTE_PATH = '/management/seq_distances';
const URL = '/management/seq_distances';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const SEQ_DISTANCE_PERMISSIONS = [
  { command_name: SeqDbCommandName.SeqDistanceCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.SeqDistanceCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.SeqDistanceCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const LONG_CONTENT = 'D'.repeat(70);

const distanceAlphaFixture: SeqDistanceFixture = {
  content: 'ACGT',
  content_hash: 'hash-alpha',
  content2: 'ACGT2',
  format: 'FMT-A',
  id: 'distance-alpha',
  protocol_id: 'protocol-1',
  sample_id: 'sample-1',
  seq_profile_id: 'profile-1',
};

const distanceBetaFixture: SeqDistanceFixture = {
  content: 'TTTT',
  content_hash: 'hash-beta',
  format: 'FMT-B',
  id: 'distance-beta',
  protocol_id: 'protocol-2',
  sample_id: 'sample-2',
  seq_profile_id: 'profile-1',
};

const distanceGammaFixture: SeqDistanceFixture = {
  content: 'GGGG',
  content_hash: 'hash-gamma',
  format: 'FMT-G',
  id: 'distance-gamma',
  protocol_id: 'unknown-protocol',
  sample_id: 'unknown-sample',
  seq_profile_id: '',
};

const distanceDeltaFixture: SeqDistanceFixture = {
  content: LONG_CONTENT,
  content_hash: 'hash-delta',
  format: 'FMT-D',
  id: 'distance-delta',
  protocol_id: '',
  sample_id: '',
  seq_profile_id: '',
};

const distanceEpsilonFixture: SeqDistanceFixture = {
  content: '',
  content_hash: 'hash-epsilon',
  format: 'FMT-E',
  id: 'distance-epsilon',
  protocol_id: '',
  sample_id: '',
  seq_profile_id: '',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockLookups = () => {
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { code: 'P1', id: 'protocol-1', name: 'Protocol One' },
    { code: 'P2', id: 'protocol-2', name: '' },
  ]));
  mockApiRequest('GET', SAMPLES_PATH, () => Response.json([
    { code: 'SAMPLE-1', id: 'sample-1' },
    { code: '', id: 'sample-2' },
  ]));
  mockApiRequest('GET', SEQ_PROFILES_PATH, () => Response.json([
    { id: 'profile-1' },
  ]));
};

const renderPage = async (initialItems: SeqDistanceFixture[] = [distanceAlphaFixture, distanceBetaFixture], permissions = SEQ_DISTANCE_PERMISSIONS) => {
  mockLookups();
  const mock = mockCrudApi(SEQ_DISTANCES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SeqDistancesAdminPage />, {
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
const mockDistancePost = (responseBody: (body: Partial<SeqDbSeqDistance>) => unknown) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SEQ_DISTANCES_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbSeqDistance>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const fillCreateForm = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Sample' }).click();
  await screen.getByRole('option', { exact: true, name: 'SAMPLE-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
  await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Sequence profile' }).click();
  await screen.getByRole('option', { exact: true, name: 'profile-1' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FMT-C');
  await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-C');
};

describe('SeqDistancesAdminPage', () => {
  it('lists the sequence distances with their resolved lookup labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'sample-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'P2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'FMT-A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'FMT-B' })).toBeInTheDocument();
  });

  it('creates a sequence distance via the sequence distances endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDistancePost(body => ({ ...body, id: 'created-distance' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new sequence distance', { exact: true })).toBeVisible();
    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      content: 'ACGT-C',
      format: 'FMT-C',
      protocol_id: 'protocol-1',
      sample_id: 'sample-1',
      seq_profile_id: 'profile-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('keeps the create dialog open while required values are missing', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDistancePost(body => ({ ...body, id: 'created-distance' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Format' }).fill('FMT-C');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new sequence distance', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);

    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
  });

  it('shows an error notification when the created sequence distance has no ID', async () => {
    const { screen } = await renderPage();
    mockDistancePost(body => body);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillCreateForm(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be created')]));
  });

  it('updates a sequence distance and keeps its content hash', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' }).click();
    await expect.element(screen.getByText('Edit item: profile-1 - SAMPLE-1 - Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SEQ_DISTANCES_PATH}/distance-alpha`);
    expect(putCall?.body).toMatchObject({ content: 'ACGT-UPDATED', content_hash: 'hash-alpha', id: 'distance-alpha' });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('shows an error notification when the updated sequence distance has no ID', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${SEQ_DISTANCES_PATH}/distance-alpha`, async (request) => {
      const body = await request.json() as Partial<SeqDbSeqDistance>;
      return Response.json({ ...body, id: null });
    });

    await screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' }).click();
    await expect.element(screen.getByText('Edit item: profile-1 - SAMPLE-1 - Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Content' }).fill('ACGT-UPDATED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be saved')]));
  });

  it('deletes a sequence distance', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SAMPLE-1' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SEQ_DISTANCES_PATH}/distance-alpha`);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });

  it('names a sequence distance with unknown lookup IDs by the raw IDs and skips empty parts', async () => {
    const { screen } = await renderPage([distanceGammaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: unknown-sample - unknown-protocol', { exact: true })).toBeVisible();
  });

  it('names a sequence distance without lookup labels by its truncated content', async () => {
    const { screen } = await renderPage([distanceDeltaFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${'D'.repeat(60)}`, { exact: true })).toBeVisible();
  });

  it('names a sequence distance without lookup labels or content by its ID', async () => {
    const { screen } = await renderPage([distanceEpsilonFixture]);

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: distance-epsilon', { exact: true })).toBeVisible();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([distanceAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('fails to load the sequence distances when a distance has an empty ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQ_DISTANCES_PATH, () => Response.json([{ ...distanceAlphaFixture, id: '' }]));
    const screen = await renderRoutedPage(
      <SeqDistancesAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_DISTANCE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });

  it('fails to load the sequence distances when a distance has no ID', async () => {
    mockLookups();
    mockApiRequest('GET', SEQ_DISTANCES_PATH, () => Response.json([{ ...distanceAlphaFixture, id: null }]));
    const screen = await renderRoutedPage(
      <SeqDistancesAdminPage />, {
        path: ROUTE_PATH,
        permissions: SEQ_DISTANCE_PERMISSIONS,
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SAMPLE-1' })).not.toBeInTheDocument();
  });
});
