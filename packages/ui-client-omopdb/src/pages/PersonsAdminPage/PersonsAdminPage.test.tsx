import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbPerson,
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

import { PersonsAdminPage } from './PersonsAdminPage';

type PersonFixture = { readonly id: string } & OmopDbPerson;
type PersonsScreen = Awaited<ReturnType<typeof renderPage>>['screen'];

const PERSONS_PATH = '/v1/Persons';
const ROUTE_PATH = '/management/persons';
const URL = '/management/persons';

const PERSON_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.PersonCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

/**
 * Builds a person with all required fields set, so that individual tests only override the fields under test.
 */
const buildPersonFixture = (personId: string, overrides: Partial<PersonFixture> = {}): PersonFixture => {
  return {
    birth_datetime: null,
    ethnicity_concept_id: 'concept-not-hispanic',
    ethnicity_source_value: null,
    gender_concept_id: 'concept-female',
    gender_source_value: null,
    id: personId,
    person_id: personId,
    person_source_value: null,
    person_type_concept_id: 'concept-patient',
    race_concept_id: 'concept-white',
    race_source_value: null,
    year_of_birth: 1980,
    ...overrides,
  };
};

const personAlphaFixture = buildPersonFixture('person-alpha', {
  care_site_id: 'care-site-1',
  location_id: 'location-1',
  person_source_value: 'Person Alpha',
  provenance_id: 'prov-alpha',
  provided_by_organization_id: 'org-1',
  provider_id: 'provider-1',
});

const personBetaFixture = buildPersonFixture('person-beta', {
  gender_concept_id: 'concept-male',
  gender_source_value: 'Gender Beta',
  race_concept_id: 'concept-asian',
  year_of_birth: 1990,
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `person_id`.
 * The page maps the created item to a table row by `person_id`, so the API response must include it.
 */
const mockPersonPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', PERSONS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbPerson>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, id: 'created-person', person_id: 'created-person' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/organizations', () => Response.json([{ id: 'org-1', name: 'Org One' }]));
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-female', concept_name: 'Female' },
    { concept_id: 'concept-male', concept_name: 'Male' },
    { concept_id: 'concept-white', concept_name: 'White' },
    { concept_id: 'concept-asian', concept_name: 'Asian' },
    { concept_id: 'concept-not-hispanic', concept_name: 'Not Hispanic' },
    { concept_id: 'concept-hispanic', concept_name: 'Hispanic' },
    { concept_id: 'concept-patient', concept_name: 'Patient Type' },
  ]));
  mockApiRequest('GET', '/v1/CareSites', () => Response.json([{ care_site_id: 'care-site-1', care_site_name: 'Care Site One' }]));
  mockApiRequest('GET', '/v1/Locations', () => Response.json([{ location_id: 'location-1' }]));
  mockApiRequest('GET', '/v1/Providers', () => Response.json([{ provider_id: 'provider-1', provider_name: 'Provider One' }]));
};

const renderPage = async (initialItems: PersonFixture[] = [personAlphaFixture, personBetaFixture], permissions = PERSON_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(PERSONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <PersonsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as unknown as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: PersonsScreen) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openEditDialogForItem = async (item: PersonFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

const selectOption = async (screen: PersonsScreen, comboboxName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: comboboxName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const fillRequiredCreateFields = async (screen: PersonsScreen) => {
  await selectOption(screen, 'Gender Concept ID', 'Female');
  await selectOption(screen, 'Race Concept ID', 'White');
  await selectOption(screen, 'Ethnicity Concept ID', 'Not Hispanic');
  await selectOption(screen, 'Person Type Concept ID', 'Patient Type');
  await screen.getByRole('textbox', { exact: true, name: 'Year Of Birth' }).fill('1985');
};

describe('PersonsAdminPage', () => {
  it('lists the persons from the persons endpoint with option labels for related resources', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Person Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Female' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Care Site One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Provider One' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Org One' })).toBeInTheDocument();
  });

  it('creates a person via the persons endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockPersonPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new person', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Person Source Value' }).fill('Person New');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    const postBody = postBodies[0] as Record<string, unknown>;
    expect(postBody.gender_concept_id).toBe('concept-female');
    expect(postBody.race_concept_id).toBe('concept-white');
    expect(postBody.ethnicity_concept_id).toBe('concept-not-hispanic');
    expect(postBody.person_type_concept_id).toBe('concept-patient');
    expect(Number(postBody.year_of_birth)).toBe(1985);
    expect(postBody.person_source_value).toBe('Person New');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Person New')]));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names an unsaved person without any name fields as new while the create request is pending', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    mockPersonPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('New person')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a person via the persons endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Person Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('prov-renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PERSONS_PATH}/person-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ person_id: 'person-alpha', provenance_id: 'prov-renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a person via the persons endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PERSONS_PATH}/person-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([personAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Person Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a person by its person source value', async () => {
    const screen = await openEditDialogForItem(personAlphaFixture);
    await expect.element(screen.getByText('Edit item: Person Alpha', { exact: true })).toBeVisible();
  });

  it('names a person by its numeric person source value', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-number-person', { person_source_value: 7 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a person by its gender source value when the person source value is blank', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-gender', { gender_source_value: 'Gender Beta', person_source_value: '   ' }));
    await expect.element(screen.getByText('Edit item: Gender Beta', { exact: true })).toBeVisible();
  });

  it('names a person by its numeric gender source value when the person source value is missing', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-number-gender', { gender_source_value: 8 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 8', { exact: true })).toBeVisible();
  });

  it('names a person by its race source value when the person and gender source values are blank', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-race', { gender_source_value: '  ', race_source_value: 'Race Gamma' }));
    await expect.element(screen.getByText('Edit item: Race Gamma', { exact: true })).toBeVisible();
  });

  it('names a person by its numeric race source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-number-race', { race_source_value: 9 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a person by its ethnicity source value when the other source values are blank', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-ethnicity', { ethnicity_source_value: 'Ethnicity Delta', race_source_value: '' }));
    await expect.element(screen.getByText('Edit item: Ethnicity Delta', { exact: true })).toBeVisible();
  });

  it('names a person by its numeric ethnicity source value when the other source values are missing', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-number-ethnicity', { ethnicity_source_value: 10 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 10', { exact: true })).toBeVisible();
  });

  it('names a person by its id when none of the source values are set', async () => {
    const screen = await openEditDialogForItem(buildPersonFixture('person-no-names', { ethnicity_source_value: '  ' }));
    await expect.element(screen.getByText('Edit item: person-no-names', { exact: true })).toBeVisible();
  });
});
