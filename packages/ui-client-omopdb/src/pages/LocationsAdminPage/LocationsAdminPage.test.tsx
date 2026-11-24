import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbLocation,
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

import { LocationsAdminPage } from './LocationsAdminPage';

type LocationFixture = { readonly id: string } & OmopDbLocation;

const LOCATIONS_PATH = '/v1/Locations';
const ROUTE_PATH = '/management/locations';
const URL = '/management/locations';

const LOCATION_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.LocationCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const locationAlphaFixture: LocationFixture = {
  country_concept_id: 'concept-1',
  id: 'location-alpha',
  location_id: 'location-alpha',
  location_source_value: 'Alpha Source',
};

const locationBetaFixture: LocationFixture = {
  id: 'location-beta',
  location_id: 'location-beta',
  location_source_value: 'Beta Source',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `location_id`.
 * The page maps the created item to a table row by `location_id`, so the API response must include it.
 */
const mockLocationPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', LOCATIONS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbLocation>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-location', location_id: 'created-location' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([{ concept_id: 'concept-1', concept_name: 'Germany' }]));
};

const renderPage = async (initialItems: LocationFixture[] = [locationAlphaFixture, locationBetaFixture], permissions = LOCATION_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(LOCATIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <LocationsAdminPage />, {
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

const openEditDialogForItem = async (item: LocationFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('LocationsAdminPage', () => {
  it('lists the locations from the locations endpoint with the concept label for the country concept', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Source' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta Source' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Germany' })).toBeInTheDocument();
  });

  it('creates a location via the locations endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockLocationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new location', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Location Source Value' }).fill('Gamma Source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ location_source_value: 'Gamma Source' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('sends filled latitude and longitude as numbers in the created location', async () => {
    const { screen } = await renderPage();
    const postBodies = mockLocationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new location', { exact: true })).toBeVisible();
    await screen.getByRole('spinbutton', { exact: true, name: 'Latitude' }).fill('52.5');
    await screen.getByRole('spinbutton', { exact: true, name: 'Longitude' }).fill('-2.25');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ latitude: 52.5, longitude: -2.25 }));
  });

  it('saves a location without any name fields', async () => {
    const { screen } = await renderPage();
    const postBodies = mockLocationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new location', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved location by its selected country concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockLocationPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Location Source Value' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Country Source Value' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Address 1' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Country Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Germany' }).click();

    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ country_concept_id: 'concept-1' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a location via the locations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha Source', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Location Source Value' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${LOCATIONS_PATH}/location-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ location_id: 'location-alpha', location_source_value: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a location via the locations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${LOCATIONS_PATH}/location-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([locationAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha Source' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a location by its location source value', async () => {
    const screen = await openEditDialogForItem({ id: 'loc-name', location_id: 'loc-name', location_source_value: 'Named' });
    await expect.element(screen.getByText('Edit item: Named', { exact: true })).toBeVisible();
  });

  it('names a location by its numeric location source value', async () => {
    const screen = await openEditDialogForItem({ id: 'loc-number', location_id: 'loc-number', location_source_value: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a location by its country source value when the location source value is blank', async () => {
    const screen = await openEditDialogForItem({ country_source_value: 'SRC-1', id: 'loc-country', location_id: 'loc-country', location_source_value: '   ' });
    await expect.element(screen.getByText('Edit item: SRC-1', { exact: true })).toBeVisible();
  });

  it('names a location by its numeric country source value when the location source value is missing', async () => {
    const screen = await openEditDialogForItem({ country_source_value: 9 as unknown as string, id: 'loc-number-country', location_id: 'loc-number-country' });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a location by the label of its matching country concept', async () => {
    const screen = await openEditDialogForItem({ country_concept_id: 'concept-1', id: 'loc-concept', location_id: 'loc-concept' });
    await expect.element(screen.getByText('Edit item: Germany', { exact: true })).toBeVisible();
  });

  it('names a location by its address 1 when the country concept is not a known concept', async () => {
    const screen = await openEditDialogForItem({ address_1: 'Main street 1', country_concept_id: 'concept-unknown', id: 'loc-address', location_id: 'loc-address' });
    await expect.element(screen.getByText('Edit item: Main street 1', { exact: true })).toBeVisible();
  });

  it('names a location by its address 1 when the country concept id is empty', async () => {
    const screen = await openEditDialogForItem({ address_1: 'Side road 2', country_concept_id: '', id: 'loc-empty-concept', location_id: 'loc-empty-concept' });
    await expect.element(screen.getByText('Edit item: Side road 2', { exact: true })).toBeVisible();
  });

  it('names a location by its numeric address 1 when no other name field is set', async () => {
    const screen = await openEditDialogForItem({ address_1: 12 as unknown as string, id: 'loc-number-address', location_id: 'loc-number-address' });
    await expect.element(screen.getByText('Edit item: 12', { exact: true })).toBeVisible();
  });

  it('names a location by its id when the country concept is not a known concept and the address is blank', async () => {
    const screen = await openEditDialogForItem({ address_1: '  ', country_concept_id: 'concept-unknown', id: 'loc-unknown-concept', location_id: 'loc-unknown-concept' });
    await expect.element(screen.getByText('Edit item: loc-unknown-concept', { exact: true })).toBeVisible();
  });

  it('names a location by its id when no name field is set', async () => {
    const screen = await openEditDialogForItem({ id: 'loc-bare', location_id: 'loc-bare' });
    await expect.element(screen.getByText('Edit item: loc-bare', { exact: true })).toBeVisible();
  });
});
