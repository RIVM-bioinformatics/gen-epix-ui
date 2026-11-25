import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDrugEra,
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

import { DrugErasAdminPage } from './DrugErasAdminPage';

type DrugEraFixture = { readonly id: string } & OmopDbDrugEra;

const DRUG_ERAS_PATH = '/v1/DrugEras';
const ROUTE_PATH = '/management/drug-eras';
const URL = '/management/drug-eras';

const DRUG_ERA_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DrugEraCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DrugEraCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DrugEraCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const drugEraAlphaFixture: DrugEraFixture = {
  drug_concept_id: 'concept-1',
  drug_era_end_date: '2020-02-01',
  drug_era_id: 'drug-era-alpha',
  drug_era_start_date: '2020-01-01',
  drug_exposure_count: 3,
  gap_days: 0,
  id: 'drug-era-alpha',
  person_id: 'person-1',
  provenance_id: 'PROV-ALPHA',
};

const drugEraBetaFixture: DrugEraFixture = {
  drug_concept_id: 'concept-1',
  drug_era_end_date: '2021-02-01',
  drug_era_id: 'drug-era-beta',
  drug_era_start_date: '2021-01-01',
  drug_exposure_count: 5,
  gap_days: 1,
  id: 'drug-era-beta',
  person_id: 'person-2',
  source_traceback: 'SRC-BETA',
};

/**
 * Builds a row whose id is its drug era id, with the minimum fields needed to render the row.
 * Name-related fields are passed through so each getName branch can be targeted.
 */
const createDrugEraFixture = (overrides: Partial<DrugEraFixture> & Pick<DrugEraFixture, 'id'>): DrugEraFixture => {
  return {
    drug_concept_id: 'concept-1',
    drug_era_end_date: '2020-02-01',
    drug_era_id: overrides.id,
    drug_era_start_date: '2020-01-01',
    person_id: 'person-1',
    ...overrides,
  };
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `drug_era_id`.
 * The page maps the created item to a table row by `drug_era_id`, so the API response must include it.
 */
const mockDrugEraPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DRUG_ERAS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDrugEra>;
    postBodies.push(body);
    return Response.json({ ...body, drug_era_id: 'created-drug-era', id: 'created-drug-era' }, { status: 201 });
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
};

const renderPage = async (initialItems: DrugEraFixture[] = [drugEraAlphaFixture, drugEraBetaFixture], permissions = DRUG_ERA_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DRUG_ERAS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DrugErasAdminPage />, {
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
  await fillDate(screen, 'Drug Era Start Date', ['2022', '01', '01']);
  await fillDate(screen, 'Drug Era End Date', ['2022', '02', '01']);
};

const openEditDialogForItem = async (item: DrugEraFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DrugErasAdminPage', () => {
  it('lists the drug eras from the drug eras endpoint with person, concept and provenance values', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-2' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Condition' }).first()).toBeInTheDocument();
  });

  it('creates a drug era via the drug eras endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDrugEraPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new drug era', { exact: true })).toBeVisible();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('Typed provenance');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ drug_concept_id: 'concept-1', person_id: 'person-1', provenance_id: 'Typed provenance' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a drug era after the selected person when creating it fails', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DRUG_ERAS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Era "person-1" could not be created.')]));
  });

  it('names a drug era after the selected person when every selected option is gone from the refetched options', async () => {
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
    mockApiRequest('POST', DRUG_ERAS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await fillRequiredCreateFields(screen);
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.PERSONS) });
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => personRequestCount).toBe(1);
    await expect.poll(() => conceptRequestCount).toBe(1);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Era "person-1" could not be created.')]));
  });

  it('edits a drug era via the drug eras endpoint', async () => {
    const { mock, screen } = await renderPage([drugEraAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Provenance ID' }).fill('PROV-EDITED');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DRUG_ERAS_PATH}/drug-era-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ drug_era_id: 'drug-era-alpha', provenance_id: 'PROV-EDITED' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a drug era via the drug eras endpoint', async () => {
    const { mock, screen } = await renderPage([drugEraAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DRUG_ERAS_PATH}/drug-era-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([drugEraAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'PROV-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a drug era by its person label', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ id: 'drug-era-person', person_id: 'person-1' }));
    await expect.element(screen.getByText('Edit item: person-1', { exact: true })).toBeVisible();
  });

  it('names a drug era by its drug concept label when the person is unknown', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ id: 'drug-era-unknown-person', person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a drug era by its drug concept label when the person is empty', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ id: 'drug-era-empty-person', person_id: '' }));
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a drug era by its id when the person and drug concept are unknown', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: 'concept-unknown', id: 'drug-era-both-unknown', person_id: 'person-unknown' }));
    await expect.element(screen.getByText('Edit item: drug-era-both-unknown', { exact: true })).toBeVisible();
  });

  it('names a drug era by its id when the person is null and the drug concept is empty', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-null-person', person_id: null }));
    await expect.element(screen.getByText('Edit item: drug-era-null-person', { exact: true })).toBeVisible();
  });

  it('names a drug era by its id when the person is numeric and the drug concept is unknown', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: 'concept-unknown', id: 'drug-era-numeric-person', person_id: 5 as unknown as string }));
    await expect.element(screen.getByText('Edit item: drug-era-numeric-person', { exact: true })).toBeVisible();
  });

  it('names a drug era by its provenance id when the person and drug concept give no name', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-provenance', person_id: '', provenance_id: 'PROV-1' }));
    await expect.element(screen.getByText('Edit item: PROV-1', { exact: true })).toBeVisible();
  });

  it('names a drug era by its numeric provenance id', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-numeric-provenance', person_id: '', provenance_id: 42 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a drug era by its source traceback when the provenance id is blank', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-source', person_id: '', provenance_id: '   ', source_traceback: 'SRC-1' }));
    await expect.element(screen.getByText('Edit item: SRC-1', { exact: true })).toBeVisible();
  });

  it('names a drug era by its numeric source traceback', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-numeric-source', person_id: '', source_traceback: 17 as unknown as string }));
    await expect.element(screen.getByText('Edit item: 17', { exact: true })).toBeVisible();
  });

  it('names a drug era by its id when the provenance id and source traceback are blank', async () => {
    const screen = await openEditDialogForItem(createDrugEraFixture({ drug_concept_id: '', id: 'drug-era-blank', person_id: '', provenance_id: '  ', source_traceback: '  ' }));
    await expect.element(screen.getByText('Edit item: drug-era-blank', { exact: true })).toBeVisible();
  });
});
