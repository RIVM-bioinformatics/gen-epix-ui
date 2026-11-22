import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDrugStrength,
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

import { DrugStrengthsAdminPage } from './DrugStrengthsAdminPage';

type DrugStrengthFixture = { readonly id: string } & OmopDbDrugStrength;

const DRUG_STRENGTHS_PATH = '/v1/DrugStrengths';
const ROUTE_PATH = '/management/drug-strengths';
const URL = '/management/drug-strengths';

const DRUG_STRENGTH_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DrugStrengthCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DrugStrengthCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DrugStrengthCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const drugStrengthAlphaFixture: DrugStrengthFixture = {
  box_size: 10,
  drug_concept_id: 'concept-1',
  drug_strength_id: 'drug-strength-alpha',
  id: 'drug-strength-alpha',
  ingredient_concept_id: 'concept-2',
  valid_end_date: '2030-01-01',
  valid_start_date: '2020-01-01',
};

const drugStrengthBetaFixture: DrugStrengthFixture = {
  drug_concept_id: 'concept-2',
  drug_strength_id: 'drug-strength-beta',
  id: 'drug-strength-beta',
  ingredient_concept_id: 'concept-1',
  valid_end_date: '2031-01-01',
  valid_start_date: '2021-01-01',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `drug_strength_id`.
 * The page maps the created item to a table row by `drug_strength_id`, so the API response must include it.
 */
const mockDrugStrengthPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DRUG_STRENGTHS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDrugStrength>;
    postBodies.push(body);
    return Response.json({ ...body, drug_strength_id: 'created-drug-strength', id: 'created-drug-strength' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Aspirin' },
    { concept_id: 'concept-2', concept_name: 'Caffeine' },
    { concept_id: 'concept-3', concept_name: 'Milligram' },
    { concept_id: 'concept-4', concept_name: 'Gram' },
    { concept_id: 'concept-5', concept_name: '   ' },
  ]));
};

const renderPage = async (initialItems: DrugStrengthFixture[] = [drugStrengthAlphaFixture, drugStrengthBetaFixture], permissions = DRUG_STRENGTH_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DRUG_STRENGTHS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DrugStrengthsAdminPage />, {
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

const openEditDialogForItem = async (item: DrugStrengthFixture) => {
  const { screen } = await renderPage([item]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DrugStrengthsAdminPage', () => {
  it('lists the drug strengths from the drug strengths endpoint with concept labels', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Aspirin' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Caffeine' }).first()).toBeInTheDocument();
  });

  it('creates a drug strength via the drug strengths endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDrugStrengthPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new drug strength', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Drug Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { name: 'Ingredient Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Caffeine' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ drug_concept_id: 'concept-1', ingredient_concept_id: 'concept-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a drug strength via the drug strengths endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Aspirin', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Box Size' }).fill('12');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DRUG_STRENGTHS_PATH}/drug-strength-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ box_size: 12, drug_strength_id: 'drug-strength-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a drug strength via the drug strengths endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DRUG_STRENGTHS_PATH}/drug-strength-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([drugStrengthAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Aspirin' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a drug strength by the label of its drug concept', async () => {
    const screen = await openEditDialogForItem(drugStrengthAlphaFixture);
    await expect.element(screen.getByText('Edit item: Aspirin', { exact: true })).toBeVisible();
  });

  it('names a drug strength by the label of its ingredient concept when the drug concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...drugStrengthAlphaFixture, drug_concept_id: 'concept-unknown', ingredient_concept_id: 'concept-2' });
    await expect.element(screen.getByText('Edit item: Caffeine', { exact: true })).toBeVisible();
  });

  it('names a drug strength by the label of its amount unit concept when the drug and ingredient concepts are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      amount_unit_concept_id: 'concept-3',
      drug_concept_id: 'concept-unknown-1',
      ingredient_concept_id: 'concept-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: Milligram', { exact: true })).toBeVisible();
  });

  it('names a drug strength by the label of its numerator unit concept when the other concepts are unknown', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      amount_unit_concept_id: 'concept-unknown-3',
      drug_concept_id: 'concept-unknown-1',
      ingredient_concept_id: 'concept-unknown-2',
      numerator_unit_concept_id: 'concept-4',
    });
    await expect.element(screen.getByText('Edit item: Gram', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the concepts are unknown, keeping the first unknown concept as fallback', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      amount_unit_concept_id: 'concept-unknown-3',
      drug_concept_id: 'concept-unknown-1',
      ingredient_concept_id: 'concept-unknown-2',
      numerator_unit_concept_id: 'concept-unknown-4',
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the concept ids are empty', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      drug_concept_id: '',
      ingredient_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the concept ids are not strings', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      drug_concept_id: 1 as unknown as string,
      ingredient_concept_id: 2 as unknown as string,
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the drug concept is empty and the ingredient concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      drug_concept_id: '',
      ingredient_concept_id: 'concept-unknown-2',
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the drug and ingredient concepts are empty and the amount unit concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      amount_unit_concept_id: 'concept-unknown-3',
      drug_concept_id: '',
      ingredient_concept_id: '',
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names a drug strength by its id when the drug, ingredient and amount unit concepts are empty and the numerator unit concept is unknown', async () => {
    const screen = await openEditDialogForItem({
      ...drugStrengthAlphaFixture,
      amount_unit_concept_id: '',
      drug_concept_id: '',
      ingredient_concept_id: '',
      numerator_unit_concept_id: 'concept-unknown-4',
    });
    await expect.element(screen.getByText('Edit item: drug-strength-alpha', { exact: true })).toBeVisible();
  });

  it('names an unsaved drug strength by its drug concept id when the concept options no longer include it', async () => {
    const { screen } = await renderPage();
    mockApiRequest('POST', DRUG_STRENGTHS_PATH, () => new Response(null, { status: 500 }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Drug Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Aspirin' }).click();
    await screen.getByRole('combobox', { name: 'Ingredient Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Caffeine' }).click();
    await fillDate(screen, 'Valid Start Date', ['2022', '01', '01']);
    await fillDate(screen, 'Valid End Date', ['2032', '01', '01']);

    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('Drug Strength "concept-1" could not be created.')]));
  });
});
