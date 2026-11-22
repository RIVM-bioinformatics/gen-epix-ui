import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDrugExposure,
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

import { DrugExposuresAdminPage } from './DrugExposuresAdminPage';

type DrugExposureFixture = { readonly id: string } & OmopDbDrugExposure;

const DRUG_EXPOSURES_PATH = '/v1/DrugExposures';
const ROUTE_PATH = '/management/drug-eras';
const URL = '/management/drug-eras';

const DRUG_EXPOSURE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DrugExposureCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DrugExposureCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DrugExposureCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const drugExposureAlphaFixture: DrugExposureFixture = {
  drug_concept_id: 'concept-1',
  drug_exposure_end_date: '2020-02-01',
  drug_exposure_id: 'drug-exposure-alpha',
  drug_exposure_start_date: '2020-01-01',
  drug_source_value: 'Aspirin 100mg',
  drug_type_concept_id: 'concept-3',
  id: 'drug-exposure-alpha',
  person_id: 'person-1',
  provider_id: 'provider-1',
  stop_reason: 'Finished',
};

const drugExposureBetaFixture: DrugExposureFixture = {
  drug_concept_id: 'concept-2',
  drug_exposure_end_date: '2021-02-01',
  drug_exposure_id: 'drug-exposure-beta',
  drug_exposure_start_date: '2021-01-01',
  drug_source_value: 'Caffeine 50mg',
  drug_type_concept_id: 'concept-3',
  id: 'drug-exposure-beta',
  person_id: 'person-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `drug_exposure_id`.
 * The page maps the created item to a table row by `drug_exposure_id`, so the API response must include it.
 */
const mockDrugExposurePost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DRUG_EXPOSURES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDrugExposure>;
    postBodies.push(body);
    return Response.json({ ...body, drug_exposure_id: 'created-drug-exposure', id: 'created-drug-exposure' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Aspirin' },
    { concept_id: 'concept-2', concept_name: 'Caffeine' },
    { concept_id: 'concept-3', concept_name: 'Oral' },
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

const renderPage = async (initialItems: DrugExposureFixture[] = [drugExposureAlphaFixture, drugExposureBetaFixture], permissions = DRUG_EXPOSURE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DRUG_EXPOSURES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DrugExposuresAdminPage />, {
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

const openEditDialogForItem = async (item: DrugExposureFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DrugExposuresAdminPage', () => {
  it('lists the drug exposures from the drug exposures endpoint with concept and person labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Caffeine 50mg' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Aspirin' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' }).first()).toBeInTheDocument();
  });

  it('creates a drug exposure via the drug exposures endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDrugExposurePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new drug exposure', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Drug Exposure Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Drug Exposure End Date', ['2022', '02', '01']);
    await screen.getByRole('textbox', { exact: true, name: 'Drug Source Value' }).fill('Typed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ drug_concept_id: 'concept-1', drug_source_value: 'Typed source', person_id: 'person-1' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a drug exposure after the typed drug source value when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DRUG_EXPOSURES_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Drug Exposure Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Drug Exposure End Date', ['2022', '02', '01']);
    await screen.getByRole('textbox', { exact: true, name: 'Drug Source Value' }).fill('Typed source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Exposure "Typed source" could not be created.')]));
  });

  it('names an unsaved drug exposure by its person id when that person is no longer among the options', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DRUG_EXPOSURES_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Drug Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Oral' }).click();
    await fillDate(screen, 'Drug Exposure Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Drug Exposure End Date', ['2022', '02', '01']);

    let personRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await expect.poll(() => personRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Exposure "person-1" could not be created.')]));
  });

  it('edits a drug exposure via the drug exposures endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Aspirin 100mg', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Stop Reason' }).fill('Changed reason');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DRUG_EXPOSURES_PATH}/drug-exposure-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ drug_exposure_id: 'drug-exposure-alpha', person_id: 'person-1', stop_reason: 'Changed reason' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('names a drug exposure after its drug source value when saving it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('PUT', `${DRUG_EXPOSURES_PATH}/drug-exposure-alpha`, () => new Response(null, { status: 500 }));

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await screen.getByRole('textbox', { exact: true, name: 'Stop Reason' }).fill('Changed reason');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Exposure "Aspirin 100mg" could not be saved.')]));
  });

  it('deletes a drug exposure via the drug exposures endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DRUG_EXPOSURES_PATH}/drug-exposure-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([drugExposureAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Aspirin 100mg' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a drug exposure by its drug source value', async () => {
    const screen = await openEditDialogForItem(drugExposureAlphaFixture);
    await expect.element(screen.getByText('Edit item: Aspirin 100mg', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by a numeric drug source value', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: 42 as unknown as string });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by its route source value when the drug source value is blank', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: '   ', route_source_value: 'Oral route' });
    await expect.element(screen.getByText('Edit item: Oral route', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by a numeric route source value when the drug source value is empty', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: '', route_source_value: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by its dose unit source value when the drug and route source values are blank', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, dose_unit_source_value: 'mg', drug_source_value: '', route_source_value: ' ' });
    await expect.element(screen.getByText('Edit item: mg', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by a numeric dose unit source value when the other source values are empty', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, dose_unit_source_value: 5 as unknown as string, drug_source_value: '', route_source_value: '' });
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by the label of its person when the source values are empty', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, dose_unit_source_value: '', drug_source_value: '', route_source_value: '' });
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by its id when its person is unknown', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: '', person_id: 'person-unknown' });
    await expect.element(screen.getByText('Edit item: drug-exposure-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by its id when its person id is null', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: '', person_id: null });
    await expect.element(screen.getByText('Edit item: drug-exposure-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug exposure by its id when its person id is empty', async () => {
    const screen = await openEditDialogForItem({ ...drugExposureAlphaFixture, drug_source_value: '', person_id: '' });
    await expect.element(screen.getByText('Edit item: drug-exposure-alpha', { exact: true })).toBeVisible();
  });
});
