import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbMeasurement,
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
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { OMOPDB_QUERY_KEY } from '../../constants/query.constants';

import { MeasurementsAdminPage } from './MeasurementsAdminPage';

type MeasurementFixture = { readonly id: string } & OmopDbMeasurement;

const MEASUREMENTS_PATH = '/v1/Measurements';
const PERSONS_PATH = '/v1/Persons';
const CONCEPTS_PATH = '/v1/Concepts';
const PROVIDERS_PATH = '/v1/Providers';
const SPECIMENS_PATH = '/v1/Specimens';
const VISIT_DETAILS_PATH = '/v1/VisitDetails';
const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';
const ROUTE_PATH = '/management/measurements';
const URL = '/management/measurements';

const MEASUREMENT_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.MeasurementCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const measurementAlphaFixture: MeasurementFixture = {
  id: 'measurement-alpha',
  measurement_concept_id: 'concept-1',
  measurement_date: '2024-01-02',
  measurement_id: 'measurement-alpha',
  measurement_source_value: 'Source Alpha',
  measurement_type_concept_id: 'concept-2',
  person_id: 'person-1',
  unit_source_value: 'mg',
  value_source_value: '12',
};

const measurementBetaFixture: MeasurementFixture = {
  id: 'measurement-beta',
  measurement_concept_id: 'concept-2',
  measurement_date: '2024-02-03',
  measurement_id: 'measurement-beta',
  measurement_source_value: null,
  measurement_type_concept_id: 'concept-1',
  person_id: 'person-2',
  unit_source_value: null,
  value_source_value: null,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockReferenceData = () => {
  mockOrganizations();
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: '   ' },
  ]));
  mockApiRequest('GET', PROVIDERS_PATH, () => Response.json([]));
  mockApiRequest('GET', SPECIMENS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_DETAILS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => Response.json([]));
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `measurement_id`.
 * The page maps the created item to a table row by `measurement_id`, so the API response must include it.
 */
const mockMeasurementPost = (calls: ReturnType<typeof mockCrudApi>['calls']) => {
  mockApiRequest('POST', MEASUREMENTS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbMeasurement>;
    calls.push({ body, method: 'POST', pathname: MEASUREMENTS_PATH });
    return Response.json({ ...body, id: 'created-measurement', measurement_id: 'created-measurement' }, { status: 201 });
  });
};

const renderPage = async (
  initialItems: MeasurementFixture[] = [measurementAlphaFixture, measurementBetaFixture],
  permissions = MEASUREMENT_PERMISSIONS,
) => {
  mockReferenceData();
  const mock = mockCrudApi(MEASUREMENTS_PATH, initialItems);
  mockMeasurementPost(mock.calls);
  const screen = await renderRoutedPage(
    <MeasurementsAdminPage />, {
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

const openEditDialogForItem = async (item: MeasurementFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

/**
 * Fills a date field group (Year, Month, Day spinbuttons) with the given ISO date.
 */
const fillDateField = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string, isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  const dateField = screen.getByRole('group', { exact: true, name: label });
  await dateField.getByRole('spinbutton', { name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { name: 'Day' }).fill(day);
};

describe('MeasurementsAdminPage', () => {
  it('lists the measurements with the source value, person and concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'concept-2' }).first()).toBeInTheDocument();
  });

  it('creates a measurement via the measurements endpoint', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new measurement', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await fillDateField(screen, 'Measurement Date', '2024-03-04');
    await screen.getByRole('textbox', { exact: true, name: 'Measurement Source Value' }).fill('Created source');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(MEASUREMENTS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      measurement_concept_id: 'concept-1',
      measurement_source_value: 'Created source',
      measurement_type_concept_id: 'concept-2',
      person_id: 'person-2',
    }));
    expect(new Date(String((postCall?.body as Partial<OmopDbMeasurement>).measurement_date)).toDateString()).toBe(new Date(2024, 2, 4).toDateString());
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('sends filled number fields as numbers in the created measurement', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new measurement', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await fillDateField(screen, 'Measurement Date', '2024-03-04');
    await screen.getByRole('spinbutton', { exact: true, name: 'Value As Number' }).fill('1.5');
    await screen.getByRole('spinbutton', { exact: true, name: 'Range Low' }).fill('0.5');
    await screen.getByRole('spinbutton', { exact: true, name: 'Range High' }).fill('2.5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.body).toEqual(expect.objectContaining({
      range_high: 2.5,
      range_low: 0.5,
      value_as_number: 1.5,
    }));
  });

  it('edits a measurement via the measurements endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Source Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${MEASUREMENTS_PATH}/measurement-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      measurement_concept_id: 'concept-2',
      measurement_id: 'measurement-alpha',
      measurement_source_value: 'Source Alpha',
      person_id: 'person-1',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a measurement via the measurements endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: Source Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${MEASUREMENTS_PATH}/measurement-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([measurementAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a measurement by its measurement source value when it is not blank', async () => {
    const screen = await openEditDialogForItem(measurementAlphaFixture);
    await expect.element(screen.getByText('Edit item: Source Alpha', { exact: true })).toBeVisible();
  });

  it('names a measurement by its measurement source value when it is a number', async () => {
    const screen = await openEditDialogForItem({
      ...measurementAlphaFixture,
      id: 'measurement-numeric-source',
      measurement_id: 'measurement-numeric-source',
      measurement_source_value: 42 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a measurement by its unit source value when the measurement source value is blank', async () => {
    const screen = await openEditDialogForItem({
      ...measurementAlphaFixture,
      id: 'measurement-blank-source',
      measurement_id: 'measurement-blank-source',
      measurement_source_value: '   ',
      unit_source_value: 'mg',
    });
    await expect.element(screen.getByText('Edit item: mg', { exact: true })).toBeVisible();
  });

  it('names a measurement by its unit source value when it is a number and the measurement source value is null', async () => {
    const screen = await openEditDialogForItem({
      ...measurementAlphaFixture,
      id: 'measurement-numeric-unit',
      measurement_id: 'measurement-numeric-unit',
      measurement_source_value: null,
      unit_source_value: 7 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a measurement by its value source value when the unit source value is blank', async () => {
    const screen = await openEditDialogForItem({
      ...measurementAlphaFixture,
      id: 'measurement-blank-unit',
      measurement_id: 'measurement-blank-unit',
      measurement_source_value: null,
      unit_source_value: '  ',
      value_source_value: '12',
    });
    await expect.element(screen.getByText('Edit item: 12', { exact: true })).toBeVisible();
  });

  it('names a measurement by its value source value when it is a number and the other source values are null', async () => {
    const screen = await openEditDialogForItem({
      ...measurementAlphaFixture,
      id: 'measurement-numeric-value',
      measurement_id: 'measurement-numeric-value',
      measurement_source_value: null,
      unit_source_value: null,
      value_source_value: 12 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: 12', { exact: true })).toBeVisible();
  });

  it('names a measurement by the label of its person when no source values are set', async () => {
    const screen = await openEditDialogForItem(measurementBetaFixture);
    await expect.element(screen.getByText('Edit item: person-2', { exact: true })).toBeVisible();
  });

  it('names a measurement by its id when the person is not among the options', async () => {
    const screen = await openEditDialogForItem({
      ...measurementBetaFixture,
      id: 'measurement-unknown-person',
      measurement_id: 'measurement-unknown-person',
      person_id: 'person-unknown',
    });
    await expect.element(screen.getByText('Edit item: measurement-unknown-person', { exact: true })).toBeVisible();
  });

  it('names a measurement by its id when the person id is blank', async () => {
    const screen = await openEditDialogForItem({
      ...measurementBetaFixture,
      id: 'measurement-blank-person',
      measurement_id: 'measurement-blank-person',
      person_id: '',
    });
    await expect.element(screen.getByText('Edit item: measurement-blank-person', { exact: true })).toBeVisible();
  });

  it('names a measurement by its id when the person id is null', async () => {
    const screen = await openEditDialogForItem({
      ...measurementBetaFixture,
      id: 'measurement-null-person',
      measurement_id: 'measurement-null-person',
      person_id: null,
    });
    await expect.element(screen.getByText('Edit item: measurement-null-person', { exact: true })).toBeVisible();
  });

  it('names an unsaved measurement by its selected person id when the person options no longer include it', async () => {
    const { screen } = await renderPage([]);
    const postRequests: string[] = [];

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Measurement Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'concept-2' }).click();
    await fillDateField(screen, 'Measurement Date', '2024-03-04');

    let personsRequestCount = 0;
    mockApiRequest('GET', PERSONS_PATH, () => {
      personsRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await expect.poll(() => personsRequestCount).toBe(1);

    mockApiRequest('POST', MEASUREMENTS_PATH, (request) => {
      postRequests.push(request.url);
      return new Response(null, { status: 500 });
    });
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postRequests.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Measurement "person-2" could not be created.')]));
  }, 60000);
});
