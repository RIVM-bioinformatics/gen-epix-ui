import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbCareSite,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { CareSitesAdminPage } from './CareSitesAdminPage';

type CareSiteFixture = { readonly id: string } & OmopDbCareSite;

const CARE_SITES_PATH = '/v1/CareSites';
const ROUTE_PATH = '/management/care-sites';
const URL = '/management/care-sites';

const CARE_SITE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.CareSiteCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const careSiteAlphaFixture: CareSiteFixture = {
  care_site_id: 'care-site-alpha',
  care_site_name: 'Alpha',
  id: 'care-site-alpha',
  location_id: 'location-1',
  place_of_service_concept_id: 'concept-1',
  site_id: 'site-1',
};

const careSiteBetaFixture: CareSiteFixture = {
  care_site_id: 'care-site-beta',
  care_site_name: 'Beta',
  id: 'care-site-beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `care_site_id`.
 * The page maps the created item to a table row by `care_site_id`, so the API response must include it.
 */
const mockCareSitePost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CARE_SITES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbCareSite>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, care_site_id: 'created-care-site', id: 'created-care-site' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/sites', () => Response.json([{ id: 'site-1', name: 'Site One' }]));
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([{ concept_id: 'concept-1', concept_name: 'Inpatient' }]));
  mockApiRequest('GET', '/v1/Locations', () => Response.json([{ location_id: 'location-1' }]));
};

const renderPage = async (initialItems: CareSiteFixture[] = [careSiteAlphaFixture, careSiteBetaFixture], permissions = CARE_SITE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CARE_SITES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CareSitesAdminPage />, {
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

const openEditDialogForItem = async (item: CareSiteFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('CareSitesAdminPage', () => {
  it('lists the care sites from the care sites endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Site One' })).toBeInTheDocument();
  });

  it('creates a care site via the care sites endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCareSitePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new care site', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Care Site Name' }).fill('Gamma');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ care_site_name: 'Gamma' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('saves a care site without any name fields', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCareSitePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new care site', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a care site via the care sites endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Care Site Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CARE_SITES_PATH}/care-site-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ care_site_id: 'care-site-alpha', care_site_name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a care site via the care sites endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CARE_SITES_PATH}/care-site-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([careSiteAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a care site by its care site name', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-name', care_site_name: 'Named', id: 'cs-name' });
    await expect.element(screen.getByText('Edit item: Named', { exact: true })).toBeVisible();
  });

  it('names a care site by its numeric care site name', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-number-name', care_site_name: 7 as unknown as string, id: 'cs-number-name' });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a care site by its care site source value when the name is blank', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-source', care_site_name: '   ', care_site_source_value: 'SRC-1', id: 'cs-source' });
    await expect.element(screen.getByText('Edit item: SRC-1', { exact: true })).toBeVisible();
  });

  it('names a care site by its numeric care site source value when the name is missing', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-number-source', care_site_source_value: 9 as unknown as string, id: 'cs-number-source' });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a care site by its place of service source value when the name and care site source value are blank', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-pos', care_site_source_value: ' ', id: 'cs-pos', place_of_service_source_value: 'POS-1' });
    await expect.element(screen.getByText('Edit item: POS-1', { exact: true })).toBeVisible();
  });

  it('names a care site by its numeric place of service source value', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-number-pos', id: 'cs-number-pos', place_of_service_source_value: 4 as unknown as string });
    await expect.element(screen.getByText('Edit item: 4', { exact: true })).toBeVisible();
  });

  it('names a care site by the label of its matching place of service concept', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-concept', id: 'cs-concept', place_of_service_concept_id: 'concept-1' });
    await expect.element(screen.getByText('Edit item: Inpatient', { exact: true })).toBeVisible();
  });

  it('names a care site by its id when the place of service concept is not a known concept', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-unknown-concept', id: 'cs-unknown-concept', place_of_service_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: cs-unknown-concept', { exact: true })).toBeVisible();
  });

  it('names a care site by its id when the place of service concept id is empty', async () => {
    const screen = await openEditDialogForItem({ care_site_id: 'cs-empty-concept', id: 'cs-empty-concept', place_of_service_concept_id: '' });
    await expect.element(screen.getByText('Edit item: cs-empty-concept', { exact: true })).toBeVisible();
  });

  it('names an unsaved care site by its selected concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockCareSitePost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Place Of Service Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();

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
    expect(postBodies[0]).toEqual(expect.objectContaining({ place_of_service_concept_id: 'concept-1' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
