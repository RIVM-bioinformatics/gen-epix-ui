import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbSpecimen,
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
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { SpecimensAdminPage } from './SpecimensAdminPage';

type SpecimenFixture = { readonly id: string } & OmopDbSpecimen;

const SPECIMENS_PATH = '/v1/Specimens';
const CONCEPTS_PATH = '/v1/Concepts';
const PERSONS_PATH = '/v1/Persons';
const ROUTE_PATH = '/management/specimens';
const URL = '/management/specimens';

const SPECIMEN_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.SpecimenCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const createSpecimenFixture = (overrides: Partial<SpecimenFixture> & Pick<SpecimenFixture, 'id'>): SpecimenFixture => {
  return {
    person_id: 'person-1',
    specimen_concept_id: 'concept-1',
    specimen_date: '2020-01-01',
    specimen_id: overrides.id,
    specimen_source_value: 'SRC-DEFAULT',
    specimen_type_concept_id: 'concept-2',
    ...overrides,
  };
};

const specimenAlphaFixture = createSpecimenFixture({
  id: 'specimen-alpha',
  specimen_source_value: 'SRC-ALPHA',
});

const specimenBetaFixture = createSpecimenFixture({
  id: 'specimen-beta',
  specimen_concept_id: 'concept-2',
  specimen_source_value: 'SRC-BETA',
});

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `specimen_id`.
 * The page maps the created item to a table row by its primary key, so the API response must include it.
 */
const mockSpecimenPost = () => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', SPECIMENS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbSpecimen>;
    postBodies.push(body);
    return Response.json({ ...body, id: 'created-specimen', specimen_id: 'created-specimen' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Inpatient' },
    { concept_id: 'concept-2', concept_name: 'Outpatient' },
  ]));
  mockApiRequest('GET', PERSONS_PATH, () => Response.json([
    { person_id: 'person-1' },
  ]));
  mockOrganizations();
};

const renderPage = async (initialItems: SpecimenFixture[] = [specimenAlphaFixture, specimenBetaFixture], permissions = SPECIMEN_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(SPECIMENS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <SpecimensAdminPage />, {
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

/**
 * Renders the page with a single item and opens its edit dialog. The edit dialog title is derived by getName.
 */
const openEditDialogForItem = async (item: Partial<SpecimenFixture> & Pick<SpecimenFixture, 'id'>) => {
  const { screen } = await renderPage([createSpecimenFixture(item)]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('SpecimensAdminPage', () => {
  it('lists the specimens with option labels for the person and concepts', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'person-1' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Inpatient' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Outpatient' }).first()).toBeInTheDocument();
  });

  it('lists the specimens fetched by the table when the options request failed', async () => {
    mockReferenceData();
    mockCrudApi(SPECIMENS_PATH, []);
    let specimenRequestCount = 0;
    mockApiRequest('GET', SPECIMENS_PATH, () => {
      specimenRequestCount += 1;
      if (specimenRequestCount === 1) {
        return new Response(null, { status: 500 });
      }
      return Response.json([specimenAlphaFixture, specimenBetaFixture]);
    });
    const screen = await renderRoutedPage(
      <SpecimensAdminPage />, {
        path: ROUTE_PATH,
        permissions: SPECIMEN_PERMISSIONS as unknown as CommonDbApiPermission[],
        url: URL,
      },
    );

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-BETA' })).toBeInTheDocument();
    expect(specimenRequestCount).toBeGreaterThanOrEqual(2);
  });

  it('creates a specimen via the specimens endpoint', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockSpecimenPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new specimen', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Specimen Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Specimen Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await fillDate(screen, 'Specimen Date', ['2022', '01', '01']);
    await screen.getByRole('textbox', { exact: true, name: 'Specimen Source Value' }).fill('SRC-NEW');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      person_id: 'person-1',
      specimen_concept_id: 'concept-1',
      specimen_source_value: 'SRC-NEW',
      specimen_type_concept_id: 'concept-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('names a specimen being created by its fallback label when all of its source values are blank', async () => {
    const { screen } = await renderPage([]);
    let releaseCreate: () => void = () => undefined;
    const createGate = new Promise<void>((resolve) => {
      releaseCreate = resolve;
    });
    mockApiRequest('POST', SPECIMENS_PATH, async (request) => {
      const body = await request.json() as Partial<OmopDbSpecimen>;
      await createGate;
      return Response.json({ ...body, id: 'created-specimen', specimen_id: 'created-specimen' }, { status: 201 });
    });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new specimen', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Person ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'person-1' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Specimen Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Inpatient' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Specimen Type Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Outpatient' }).click();
    await fillDate(screen, 'Specimen Date', ['2022', '01', '01']);
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"New specimen" is being saved')]));
    releaseCreate();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"created-specimen" has been created.')]));
  });

  it('edits a specimen via the specimens endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Specimen Source Value' }).fill('SRC-ALPHA-2');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SPECIMENS_PATH}/specimen-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      person_id: 'person-1',
      specimen_concept_id: 'concept-1',
      specimen_id: 'specimen-alpha',
      specimen_source_value: 'SRC-ALPHA-2',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a specimen via the specimens endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByText('Delete item: SRC-ALPHA', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SPECIMENS_PATH}/specimen-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([specimenAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SRC-ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a specimen by its specimen source value when it is a non-blank string', async () => {
    const screen = await openEditDialogForItem({ id: 'specimen-name-string', specimen_source_value: 'SRC-STRING' });
    await expect.element(screen.getByText('Edit item: SRC-STRING', { exact: true })).toBeVisible();
  });

  it('names a specimen by its numeric specimen source value', async () => {
    const screen = await openEditDialogForItem({ id: 'specimen-name-number', specimen_source_value: 7 as unknown as string });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a specimen by its unit source value when the specimen source value is blank', async () => {
    const screen = await openEditDialogForItem({ id: 'specimen-name-unit', specimen_source_value: '   ', unit_source_value: 'UNIT-VALUE' });
    await expect.element(screen.getByText('Edit item: UNIT-VALUE', { exact: true })).toBeVisible();
  });

  it('names a specimen by its numeric unit source value when the specimen source value is empty', async () => {
    const screen = await openEditDialogForItem({ id: 'specimen-name-unit-number', specimen_source_value: '', unit_source_value: 5 as unknown as string });
    await expect.element(screen.getByText('Edit item: 5', { exact: true })).toBeVisible();
  });

  it('names a specimen by its anatomic site source value when the specimen and unit source values are blank', async () => {
    const screen = await openEditDialogForItem({ anatomic_site_source_value: 'ANATOMIC-SITE', id: 'specimen-name-anatomic', specimen_source_value: null, unit_source_value: '  ' });
    await expect.element(screen.getByText('Edit item: ANATOMIC-SITE', { exact: true })).toBeVisible();
  });

  it('names a specimen by its numeric anatomic site source value when the other source values are blank', async () => {
    const screen = await openEditDialogForItem({ anatomic_site_source_value: 3 as unknown as string, id: 'specimen-name-anatomic-number', specimen_source_value: null, unit_source_value: null });
    await expect.element(screen.getByText('Edit item: 3', { exact: true })).toBeVisible();
  });

  it('names a specimen by its disease status source value when the other source values are blank', async () => {
    const screen = await openEditDialogForItem({ anatomic_site_source_value: '', disease_status_source_value: 'DISEASE-STATUS', id: 'specimen-name-disease', specimen_source_value: null, unit_source_value: null });
    await expect.element(screen.getByText('Edit item: DISEASE-STATUS', { exact: true })).toBeVisible();
  });

  it('names a specimen by its numeric disease status source value when the other source values are blank', async () => {
    const screen = await openEditDialogForItem({ anatomic_site_source_value: null, disease_status_source_value: 4 as unknown as string, id: 'specimen-name-disease-number', specimen_source_value: null, unit_source_value: null });
    await expect.element(screen.getByText('Edit item: 4', { exact: true })).toBeVisible();
  });

  it('names a specimen by its id when all of its source values are blank', async () => {
    const screen = await openEditDialogForItem({ anatomic_site_source_value: '  ', disease_status_source_value: null, id: 'specimen-name-id', specimen_source_value: '', unit_source_value: null });
    await expect.element(screen.getByText('Edit item: specimen-name-id', { exact: true })).toBeVisible();
  });
});
