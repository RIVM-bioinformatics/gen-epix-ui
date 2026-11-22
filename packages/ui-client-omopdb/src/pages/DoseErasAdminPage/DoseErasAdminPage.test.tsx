import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDoseEra,
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

import { DoseErasAdminPage } from './DoseErasAdminPage';

type DoseEraFixture = { readonly id: string } & OmopDbDoseEra;

const DOSE_ERAS_PATH = '/v1/DoseEras';
const ROUTE_PATH = '/management/dose-eras';
const URL = '/management/dose-eras';

const DOSE_ERA_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DoseEraCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DoseEraCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DoseEraCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const doseEraAlphaFixture: DoseEraFixture = {
  dose_era_end_date: '2020-02-01',
  dose_era_id: 'dose-era-alpha',
  dose_era_start_date: '2020-01-01',
  dose_value: 2.5,
  drug_concept_id: 'concept-1',
  id: 'dose-era-alpha',
  person_id: 'person-1',
  provenance_id: 'PROV-ALPHA',
  unit_concept_id: 'concept-unit',
};

const doseEraBetaFixture: DoseEraFixture = {
  dose_era_end_date: '2021-02-01',
  dose_era_id: 'dose-era-beta',
  dose_era_start_date: '2021-01-01',
  dose_value: 5,
  drug_concept_id: 'concept-1',
  id: 'dose-era-beta',
  person_id: 'person-2',
  source_traceback: 'SRC-BETA',
  unit_concept_id: 'concept-unit',
};

/**
 * Builds a row whose id is its dose era id, with the minimum fields needed to render the row.
 * Name-related fields are passed through so each getName branch can be targeted.
 */
const createDoseEraFixture = (overrides: Partial<DoseEraFixture> & Pick<DoseEraFixture, 'id'>): DoseEraFixture => {
  return {
    dose_era_end_date: '2020-02-01',
    dose_era_id: overrides.id,
    dose_era_start_date: '2020-01-01',
    dose_value: 2.5,
    drug_concept_id: 'concept-1',
    person_id: 'person-1',
    unit_concept_id: 'concept-unit',
    ...overrides,
  };
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `dose_era_id`.
 * The page maps the created item to a table row by `dose_era_id`, so the API response must include it.
 */
const mockDoseEraPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DOSE_ERAS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDoseEra>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, dose_era_id: 'created-dose-era', id: 'created-dose-era' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Condition' },
    { concept_id: 'concept-unit', concept_name: 'Milligram' },
  ]));
  mockApiRequest('GET', '/v1/Persons', () => Response.json([
    { person_id: 'person-1' },
    { person_id: 'person-2' },
  ]));
};

const renderPage = async (initialItems: DoseEraFixture[] = [doseEraAlphaFixture, doseEraBetaFixture], permissions = DOSE_ERA_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DOSE_ERAS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DoseErasAdminPage />, {
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
  await screen.getByRole('combobox', { exact: true, name: 'Drug Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Condition' }).click();
  await screen.getByRole('combobox', { exact: true, name: 'Unit Concept ID' }).click();
  await screen.getByRole('option', { exact: true, name: 'Milligram' }).click();
  await screen.getByRole('textbox', { exact: true, name: 'Dose Value' }).fill('2.5');
  await fillDate(screen, 'Dose Era Start Date', ['2022', '01', '01']);
  await fillDate(screen, 'Dose Era End Date', ['2022', '02', '01']);
};

const openEditDialogForItem = async (item: DoseEraFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DoseErasAdminPage', () => {
  it('lists the dose eras from the dose eras endpoint with person, concept and provenance values', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Condition' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Milligram' }).first()).toBeInTheDocument();
  });

  it('creates a dose era via the dose eras endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDoseEraPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new dose era', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Typed provenance');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ dose_value: 2.5, drug_concept_id: 'concept-1', person_id: 'person-1', provenance_id: 'Typed provenance', unit_concept_id: 'concept-unit' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a dose era after the selected person when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DOSE_ERAS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Dose Era "person-1" could not be created.')]));
  });

  it('names a dose era after the selected person when every selected option is gone from the refetched options', async () => {
    const { screen } = await renderPage();
    let personRequestCount = 0;
    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Persons', () => {
      personRequestCount += 1;
      return Response.json([]);
    });
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    let releasePost: () => void = () => undefined;
    mockDoseEraPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('   ');
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personRequestCount).toBe(1);
    await expect.poll(() => conceptRequestCount).toBe(1);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"person-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a dose era via the dose eras endpoint', async () => {
    const { mock, screen } = await renderPage([doseEraAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-EDITED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DOSE_ERAS_PATH}/dose-era-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ dose_era_id: 'dose-era-alpha', provenance_id: 'PROV-EDITED' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a dose era via the dose eras endpoint', async () => {
    const { mock, screen } = await renderPage([doseEraAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DOSE_ERAS_PATH}/dose-era-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([doseEraAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a dose era by its person label', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ id: 'dose-era-person', person_id: 'person-1' }));
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a dose era by its drug concept label when the person is unknown', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ id: 'dose-era-unknown-person', person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a dose era by its drug concept label when the person is empty', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ id: 'dose-era-empty-person', person_id: '' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a dose era by its unit concept label when the person and drug concept are unknown', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: 'concept-unknown', id: 'dose-era-unit-label', person_id: 'person-unknown', unit_concept_id: 'concept-unit' }));
    await expect.element(screen.getByText('Edit item: Milligram', { exact: true })).toBeVisible();
  });

  it('names a dose era by its id when the person and drug concept are empty and the unit concept is unknown', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: '', id: 'dose-era-unit-fallback', person_id: '', unit_concept_id: 'concept-unknown' }));
    await expect.element(screen.getByText('Edit item: dose-era-unit-fallback', { exact: true })).toBeVisible();
  });

  it('names a dose era by its id when the person, drug concept and unit concept are unknown', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: 'concept-unknown', id: 'dose-era-all-unknown', person_id: 'person-unknown', unit_concept_id: 'concept-unknown' }));
    await expect.element(screen.getByText('Edit item: dose-era-all-unknown', { exact: true })).toBeVisible();
  });

  it('names a dose era by its id when the person is null and the drug and unit concepts are empty', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: '', id: 'dose-era-null-person', person_id: null, unit_concept_id: '' }));
    await expect.element(screen.getByText('Edit item: dose-era-null-person', { exact: true })).toBeVisible();
  });

  it('names a dose era by its id when the person is numeric and the drug concept is unknown', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: 'concept-unknown', id: 'dose-era-numeric-person', person_id: 5 as unknown as string, unit_concept_id: '' }));
    await expect.element(screen.getByText('Edit item: dose-era-numeric-person', { exact: true })).toBeVisible();
  });

  it('names a dose era by its provenance id when the person, drug and unit concepts give no name', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: '', id: 'dose-era-provenance', person_id: '', provenance_id: 'PROV-1', unit_concept_id: '' }));
    await expect.element(screen.getByText('Edit item: PROV-1', { exact: true })).toBeVisible();
  });

  it('names a dose era by its numeric provenance id', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: '', id: 'dose-era-numeric-provenance', person_id: '', provenance_id: 42 as unknown as string, unit_concept_id: '' }));
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a dose era by its id when the provenance id is blank', async () => {
    const screen = await openEditDialogForItem(createDoseEraFixture({ drug_concept_id: '', id: 'dose-era-blank', person_id: '', provenance_id: '   ', unit_concept_id: '' }));
    await expect.element(screen.getByText('Edit item: dose-era-blank', { exact: true })).toBeVisible();
  });
});
