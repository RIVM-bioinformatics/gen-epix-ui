import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDeviceExposure,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { DeviceExposuresAdminPage } from './DeviceExposuresAdminPage';

type DeviceExposureFixture = { readonly id: string } & OmopDbDeviceExposure;

const DEVICE_EXPOSURES_PATH = '/v1/DeviceExposures';
const ROUTE_PATH = '/management/device-exposures';
const URL = '/management/device-exposures';

const DEVICE_EXPOSURE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DeviceExposureCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DeviceExposureCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DeviceExposureCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const deviceExposureAlphaFixture: DeviceExposureFixture = {
  device_concept_id: 'concept-1',
  device_exposure_id: 'device-exposure-alpha',
  device_exposure_start_date: '2020-01-01',
  device_source_value: 'DEV-ALPHA',
  device_type_concept_id: 'concept-1',
  id: 'device-exposure-alpha',
  person_id: 'person-1',
  provenance_id: 'PROV-ALPHA',
  quantity: 2,
};

const deviceExposureBetaFixture: DeviceExposureFixture = {
  device_concept_id: 'concept-1',
  device_exposure_id: 'device-exposure-beta',
  device_exposure_start_date: '2021-01-01',
  device_source_value: 'DEV-BETA',
  device_type_concept_id: 'concept-1',
  id: 'device-exposure-beta',
  person_id: 'person-2',
  quantity: 4,
  source_traceback: 'SRC-BETA',
};

/**
 * Builds a row whose id is its device exposure id, with the minimum fields needed to render the row.
 * Name-related fields are passed through so each getName branch can be targeted.
 */
const createDeviceExposureFixture = (overrides: Partial<DeviceExposureFixture> & Pick<DeviceExposureFixture, 'id'>): DeviceExposureFixture => {
  return {
    device_concept_id: 'concept-1',
    device_exposure_id: overrides.id,
    device_exposure_start_date: '2020-01-01',
    device_type_concept_id: 'concept-1',
    person_id: 'person-1',
    ...overrides,
  };
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `device_exposure_id`.
 * The page maps the created item to a table row by `device_exposure_id`, so the API response must include it.
 */
const mockDeviceExposurePost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DEVICE_EXPOSURES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDeviceExposure>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, device_exposure_id: 'created-device-exposure', id: 'created-device-exposure' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Condition' },
  ]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', '/v1/Providers', () => Response.json([{ provider_id: 'provider-1' }]));
  mockApiRequest('GET', '/v1/VisitDetails', () => Response.json([{ visit_detail_id: 'visit-detail-1' }]));
  mockApiRequest('GET', '/v1/VisitOccurrences', () => Response.json([{ visit_occurrence_id: 'visit-occurrence-1' }]));
  mockApiRequest('GET', '/v1/organizations', () => Response.json([{ id: 'organization-1', name: 'Organization One' }]));
};

const renderPage = async (initialItems: DeviceExposureFixture[] = [deviceExposureAlphaFixture, deviceExposureBetaFixture], permissions = DEVICE_EXPOSURE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DEVICE_EXPOSURES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DeviceExposuresAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const fillDate = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, [year, month, day]: [string, string, string]) => {
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { exact: true, name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { exact: true, name: 'Day' }).fill(day);
};

const fillRequiredCreateFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Device Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Condition' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Device Type Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Condition' }).click();
  await fillDate(screen, 'Device Exposure Start Date', ['2022', '01', '01']);
};

const openEditDialogForItem = async (item: DeviceExposureFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DeviceExposuresAdminPage', () => {
  it('lists the device exposures from the device exposures endpoint with person, source and provenance values', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DEV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'DEV-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Condition' }).first()).toBeInTheDocument();
  });

  it('creates a device exposure via the device exposures endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDeviceExposurePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new device exposure', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Typed provenance');
    await screen.getByRole('spinbutton', { exact: true, name: 'Quantity' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      device_concept_id: 'concept-1',
      device_exposure_start_date: new Date(2022, 0, 1).toISOString(),
      device_type_concept_id: 'concept-1',
      person_id: 'person-1',
      provenance_id: 'Typed provenance',
      quantity: 3,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a device exposure after the selected person when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DEVICE_EXPOSURES_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Device Exposure "person-1" could not be created.')]));
  });

  it('names a new device exposure by its person id when the related options no longer include the selected values', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockDeviceExposurePost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { name: 'Device Source Value' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Unit Source Value' }).fill('   ');

    let personsRequestCount = 0;
    let conceptsRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personsRequestCount).toBe(1);
    await expect.poll(() => conceptsRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ person_id: 'person-1' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a device exposure via the device exposures endpoint', async () => {
    const { mock, screen } = await renderPage([deviceExposureAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: DEV-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Production ID' }).fill('PROD-EDITED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DEVICE_EXPOSURES_PATH}/device-exposure-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ device_exposure_id: 'device-exposure-alpha', production_id: 'PROD-EDITED' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a device exposure via the device exposures endpoint', async () => {
    const { mock, screen } = await renderPage([deviceExposureAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DEVICE_EXPOSURES_PATH}/device-exposure-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([deviceExposureAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a device exposure by its device source value', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: 'DEV-SOURCE', id: 'device-exposure-source' }));
    await expect.element(screen.getByText('Edit item: DEV-SOURCE', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its numeric device source value', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: 5 as unknown as string, id: 'device-exposure-numeric-source' }));
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('skips a blank device source value and names a device exposure by its unit source value', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: '   ', id: 'device-exposure-blank-source', unit_source_value: 'UNIT-X' }));
    await expect.element(screen.getByText('Edit item: UNIT-X', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its numeric unit source value when the device source value is null', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: null, id: 'device-exposure-numeric-unit', unit_source_value: 7 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('skips a blank unit source value and names a device exposure by its person label', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: '', id: 'device-exposure-blank-unit', person_id: 'person-1', unit_source_value: ' ' }));
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its device concept label when the person is unknown', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: '', id: 'device-exposure-unknown-person', person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its device concept label when the person is empty', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_source_value: '', id: 'device-exposure-empty-person', person_id: '' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its id when the person and device concept are unknown', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_concept_id: 'concept-unknown', device_source_value: '', id: 'device-exposure-both-unknown', person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: device-exposure-both-unknown', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its id when the person is null and the device concept is empty', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_concept_id: '', device_source_value: null, id: 'device-exposure-null-person', person_id: null }));
    await expect.element(screen.getByText('Edit item: device-exposure-null-person', { exact: true })).toBeVisible();
  });

  it('names a device exposure by its id when the person is numeric and the device concept is unknown', async () => {
    const screen = await openEditDialogForItem(createDeviceExposureFixture({ device_concept_id: 'concept-unknown', device_source_value: '', id: 'device-exposure-numeric-person', person_id: 5 as unknown as string }));
    await expect.element(screen.getByText('Edit item: device-exposure-numeric-person', { exact: true })).toBeVisible();
  });
});
