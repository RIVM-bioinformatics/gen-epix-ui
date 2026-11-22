import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbCdmSource,
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

import { CdmSourcesAdminPage } from './CdmSourcesAdminPage';

type CdmSourceFixture = { readonly id: string } & OmopDbCdmSource;

const CDM_SOURCES_PATH = '/v1/CdmSources';
const CONCEPTS_PATH = '/v1/Concepts';
const ROUTE_PATH = '/management/cdm-sources';
const URL = '/management/cdm-sources';

const CDM_SOURCE_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.CdmSourceCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.CdmSourceCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.CdmSourceCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const cdmSourceAlphaFixture: CdmSourceFixture = {
  cdm_etl_reference: 'ETL Alpha',
  cdm_holder: 'Holder Alpha',
  cdm_release_date: '2024-02-01',
  cdm_source_abbreviation: 'SA',
  cdm_source_id: 'cdm-alpha',
  cdm_source_name: 'Source Alpha',
  cdm_version: 'v5',
  cdm_version_concept_id: 'concept-1',
  id: 'cdm-alpha',
  source_description: 'Description Alpha',
  source_documentation_reference: 'Documentation Alpha',
  source_release_date: '2024-01-01',
  vocabulary_version: 'v1',
};

const cdmSourceBetaFixture: CdmSourceFixture = {
  cdm_etl_reference: 'ETL Beta',
  cdm_holder: 'Holder Beta',
  cdm_release_date: '2024-03-01',
  cdm_source_abbreviation: 'SB',
  cdm_source_id: 'cdm-beta',
  cdm_source_name: 'Source Beta',
  cdm_version: 'v6',
  cdm_version_concept_id: 'concept-2',
  id: 'cdm-beta',
  source_description: 'Description Beta',
  source_documentation_reference: 'Documentation Beta',
  source_release_date: '2024-02-01',
  vocabulary_version: 'v2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `cdm_source_id`.
 * The page maps the created item to a table row by `cdm_source_id`, so the API response must include it.
 */
const mockCdmSourcePost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', CDM_SOURCES_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbCdmSource>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, cdm_source_id: 'created-cdm-source', id: 'created-cdm-source' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', CONCEPTS_PATH, () => Response.json([
    { concept_id: 'concept-1', concept_name: 'Concept One' },
    { concept_id: 'concept-2', concept_name: 'Concept Two' },
    { concept_id: 'concept-3', concept_name: '   ' },
  ]));
};

const renderPage = async (initialItems: CdmSourceFixture[] = [cdmSourceAlphaFixture, cdmSourceBetaFixture], permissions = CDM_SOURCE_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(CDM_SOURCES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <CdmSourcesAdminPage />, {
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

const openEditDialogForItem = async (item: CdmSourceFixture) => {
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
  const dateField = screen.getByRole('group', { name: label });
  await dateField.getByRole('spinbutton', { name: 'Year' }).fill(year);
  await dateField.getByRole('spinbutton', { name: 'Month' }).fill(month);
  await dateField.getByRole('spinbutton', { name: 'Day' }).fill(day);
};

describe('CdmSourcesAdminPage', () => {
  it('lists the cdm sources with their name, holder and concept label', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Holder Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Concept One' })).toBeInTheDocument();
  });

  it('creates a cdm source via the cdm sources endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockCdmSourcePost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new cdm source', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'CDM Source Name' }).fill('Source Gamma');
    await screen.getByRole('textbox', { name: 'CDM Source Abbreviation' }).fill('SG');
    await screen.getByRole('textbox', { name: 'CDM Holder' }).fill('Holder Gamma');
    await screen.getByRole('combobox', { name: 'CDM Version Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('textbox', { name: 'Vocabulary Version' }).fill('v3');
    await fillDateField(screen, 'Source Release Date', '2024-04-01');
    await fillDateField(screen, 'CDM Release Date', '2024-05-01');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({
      cdm_holder: 'Holder Gamma',
      cdm_source_abbreviation: 'SG',
      cdm_source_name: 'Source Gamma',
      cdm_version_concept_id: 'concept-2',
      vocabulary_version: 'v3',
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a cdm source via the cdm sources endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Source Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'CDM Holder' }).fill('Holder renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CDM_SOURCES_PATH}/cdm-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ cdm_holder: 'Holder renamed', cdm_source_id: 'cdm-alpha' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a cdm source via the cdm sources endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CDM_SOURCES_PATH}/cdm-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([cdmSourceAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Source Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a cdm source by its name', async () => {
    const screen = await openEditDialogForItem(cdmSourceAlphaFixture);
    await expect.element(screen.getByText('Edit item: Source Alpha', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its numeric name', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_name: 42 as unknown as string });
    await expect.element(screen.getByText('Edit item: 42', { exact: true })).toBeVisible();
  });

  it('names a cdm source by the label of its cdm version concept when the name is blank', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_name: '   ' });
    await expect.element(screen.getByText('Edit item: Concept One', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its abbreviation when the cdm version concept is unknown', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_name: '', cdm_version_concept_id: 'concept-unknown' });
    await expect.element(screen.getByText('Edit item: SA', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its abbreviation when the cdm version concept id is empty', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_name: '', cdm_version_concept_id: '' });
    await expect.element(screen.getByText('Edit item: SA', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its abbreviation when the cdm version concept id is missing', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_name: '', cdm_version_concept_id: null });
    await expect.element(screen.getByText('Edit item: SA', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its numeric abbreviation', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_abbreviation: 7 as unknown as string, cdm_source_name: '', cdm_version_concept_id: '' });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its holder when the abbreviation is blank', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_source_abbreviation: '  ', cdm_source_name: '', cdm_version_concept_id: '' });
    await expect.element(screen.getByText('Edit item: Holder Alpha', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its numeric holder when the abbreviation is blank', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_holder: 99 as unknown as string, cdm_source_abbreviation: '', cdm_source_name: '', cdm_version_concept_id: '' });
    await expect.element(screen.getByText('Edit item: 99', { exact: true })).toBeVisible();
  });

  it('names a cdm source by its id when no other name field is set', async () => {
    const screen = await openEditDialogForItem({ ...cdmSourceAlphaFixture, cdm_holder: '', cdm_source_abbreviation: '', cdm_source_name: '', cdm_version_concept_id: '' });
    await expect.element(screen.getByText('Edit item: cdm-alpha', { exact: true })).toBeVisible();
  });

  it('names an unsaved cdm source by its selected cdm version concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockCdmSourcePost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'CDM Source Name' }).fill('   ');
    await screen.getByRole('textbox', { name: 'CDM Source Abbreviation' }).fill('   ');
    await screen.getByRole('textbox', { name: 'CDM Holder' }).fill('   ');
    await screen.getByRole('combobox', { name: 'CDM Version Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Concept Two' }).click();
    await screen.getByRole('textbox', { name: 'Vocabulary Version' }).fill('v3');
    await fillDateField(screen, 'Source Release Date', '2024-04-01');
    await fillDateField(screen, 'CDM Release Date', '2024-05-01');

    let conceptRequestCount = 0;
    mockApiRequest('GET', CONCEPTS_PATH, () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ cdm_version_concept_id: 'concept-2' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-2"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
