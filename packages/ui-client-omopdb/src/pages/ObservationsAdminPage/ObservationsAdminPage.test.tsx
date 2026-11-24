import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbObservation,
} from '@gen-epix/api-omopdb';
import {
  OmopDbCommandName,
  OmopDbPermissionType,
} from '@gen-epix/api-omopdb';
import { container } from 'tsyringe';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ObservationsAdminPage } from './ObservationsAdminPage';

type ObservationFixture = { readonly id: string } & OmopDbObservation;

const OBSERVATIONS_PATH = '/v1/Observations';
const PERSONS_PATH = '/v1/Persons';
const CONCEPTS_PATH = '/v1/Concepts';
const ORGANIZATIONS_PATH = '/v1/organizations';
const PROVIDERS_PATH = '/v1/Providers';
const VISIT_DETAILS_PATH = '/v1/VisitDetails';
const VISIT_OCCURRENCES_PATH = '/v1/VisitOccurrences';
const ROUTE_PATH = '/management/observations';

const OBSERVATION_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.ObservationCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.ObservationCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.ObservationCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createObservationFixture = (overrides: Partial<ObservationFixture> & Pick<ObservationFixture, 'id'>): ObservationFixture => {
  return {
    observation_concept_id: 'concept-1',
    observation_date: '2020-06-15',
    observation_datetime: null,
    observation_id: overrides.id,
    observation_source_value: null,
    observation_type_concept_id: 'concept-2',
    person_id: 'person-1',
    provenance_id: null,
    provided_by_organization_id: null,
    qualifier_source_value: null,
    source_traceback: null,
    unit_source_value: null,
    value_as_number: null,
    value_source_value: null,
    ...overrides,
  };
};

const observationAlphaFixture = createObservationFixture({
  id: 'observation-alpha',
  observation_source_value: 'SRC-ALPHA',
  provenance_id: 'PROV-ALPHA',
  provided_by_organization_id: 'org-1',
  source_traceback: 'Source A',
});

const observationBetaFixture = createObservationFixture({
  id: 'observation-beta',
  observation_concept_id: 'concept-unknown',
  observation_source_value: 'SRC-BETA',
  person_id: 'person-2',
  source_traceback: 'Source B',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * The date inputs are serialized as Date strings, so the calendar parts are compared after parsing.
 */
const expectCalendarDate = (value: unknown, year: number, monthIndex: number, day: number) => {
  const parsed = new Date(value as string);
  expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([year, monthIndex, day]);
};

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `observation_id`.
 * The page maps the created item by its primary key, so the API response must include it.
 */
const mockObservationPost = (responseGate?: Promise<void>) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', OBSERVATIONS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbObservation>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, observation_id: 'created-observation' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: '' },
  ]));
  mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json([
    { id: 'org-1', name: 'Org One' },
    { id: 'org-2', name: 'Org Two' },
    { id: 'org-empty', name: '' },
  ]));
  mockApiRequest('GET', PROVIDERS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_DETAILS_PATH, () => Response.json([]));
  mockApiRequest('GET', VISIT_OCCURRENCES_PATH, () => Response.json([]));
};

const renderPage = async (initialItems: ObservationFixture[] = [observationAlphaFixture, observationBetaFixture], permissions = OBSERVATION_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(OBSERVATIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ObservationsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: ROUTE_PATH,
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

const fillRequiredFields = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'person-2' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Observation Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Observation Type Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
  await fillDate(screen, 'Observation Date', ['2021', '02', '03']);
};

const openEditDialogForItem = async (item: ObservationFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('ObservationsAdminPage', () => {
  it('lists the observations from the observations endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates an observation via the observations endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockObservationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new observation', { exact: true })).toBeVisible();
    await fillRequiredFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Observation Source Value' }).fill('SRC-NEW');
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      observation_concept_id: 'concept-1',
      observation_source_value: 'SRC-NEW',
      observation_type_concept_id: 'concept-1',
      person_id: 'person-2',
      provenance_id: 'PROV-NEW',
    }));
    expectCalendarDate((postBodies[0] as Partial<OmopDbObservation>).observation_date, 2021, 1, 3);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('omits a cleared value as number from the created observation', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockObservationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen);
    const valueAsNumberField = screen.getByRole('spinbutton', { exact: true, name: 'Value As Number' });
    await valueAsNumberField.fill('5');
    await valueAsNumberField.fill('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).not.toHaveProperty('value_as_number');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('sends a filled value as number in the created observation', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockObservationPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen);
    await screen.getByRole('spinbutton', { exact: true, name: 'Value As Number' }).fill('1.5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ value_as_number: 1.5 }));
  });

  it('names a new observation by its generic name when all name fields are blank', async () => {
    const { screen } = await renderPage([]);
    let releasePostResponse: () => void = () => undefined;
    const postResponseGate = new Promise<void>((resolve) => {
      releasePostResponse = resolve;
    });
    const postBodies = mockObservationPost(postResponseGate);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New observation')]));
    releasePostResponse();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an observation via the observations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-EDIT');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${OBSERVATIONS_PATH}/observation-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ observation_id: 'observation-alpha', person_id: 'person-1', provenance_id: 'PROV-EDIT' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an observation via the observations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${OBSERVATIONS_PATH}/observation-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([observationAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names an observation by its source value', async () => {
    const screen = await openEditDialogForItem(observationAlphaFixture);
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
  });

  it('names an observation by its numeric source value', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-numeric-source',
      observation_source_value: 7 as unknown as string,
    }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names an observation by its unit source value when the source value is blank', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-blank-source',
      observation_source_value: '   ',
      unit_source_value: 'UNIT-X',
    }));
    await expect.element(screen.getByText('Edit item: UNIT-X', { exact: true })).toBeVisible();
  });

  it('names an observation by its numeric unit source value when the source value is missing', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-numeric-unit',
      unit_source_value: 3 as unknown as string,
    }));
    await expect.element(screen.getByText('Edit item: 3', { exact: true })).toBeVisible();
  });

  it('names an observation by its qualifier source value when the source and unit values are missing', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-qualifier',
      qualifier_source_value: 'QUAL-X',
    }));
    await expect.element(screen.getByText('Edit item: QUAL-X', { exact: true })).toBeVisible();
  });

  it('names an observation by its numeric qualifier source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-numeric-qualifier',
      qualifier_source_value: 5 as unknown as string,
    }));
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names an observation by its value source value when the qualifier source value is blank', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-blank-qualifier',
      qualifier_source_value: '  ',
      value_source_value: 'VAL-X',
    }));
    await expect.element(screen.getByText('Edit item: VAL-X', { exact: true })).toBeVisible();
  });

  it('names an observation by its numeric value source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-numeric-value',
      value_source_value: 9 as unknown as string,
    }));
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names an observation by its id when all source values are blank', async () => {
    const screen = await openEditDialogForItem(createObservationFixture({
      id: 'observation-all-blank',
      observation_source_value: '',
      qualifier_source_value: '   ',
      unit_source_value: null,
      value_source_value: '',
    }));
    await expect.element(screen.getByText('Edit item: observation-all-blank', { exact: true })).toBeVisible();
  });
});
