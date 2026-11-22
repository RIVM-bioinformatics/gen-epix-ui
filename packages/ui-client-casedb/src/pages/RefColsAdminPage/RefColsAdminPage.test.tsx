import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbConceptSet,
  CaseDbGeneticDistanceProtocol,
  CaseDbRefCol,
  CaseDbRefDim,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbCommandName,
  CaseDbDimType,
  CaseDbPermissionType,
  CaseDbUnit,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RefColsAdminPage } from './RefColsAdminPage';

const REF_COLS_PATH = '/v1/ref_cols';
const REF_DIMS_PATH = '/v1/ref_dims';
const CONCEPT_SETS_PATH = '/v1/concept_sets';
const REGION_SETS_PATH = '/v1/region_sets';
const GENETIC_DISTANCE_PROTOCOLS_PATH = '/v1/genetic_distance_protocols';
const VALIDATION_RULES_PATH = '/v1/ref_cols/validation_rules';
const UNSCOPED_ROUTE_PATH = '/management/reference-columns';
const SCOPED_ROUTE_PATH = '/management/reference-dimensions/:refDimId/reference-columns';

const ALPHA_DIM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001';
const BETA_DIM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000002';
const GEO_DIM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000003';
const TIME_DIM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000004';
const UNKNOWN_DIM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0000000000ff';
const CONCEPT_DAY_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000011';
const CONCEPT_NO_UNIT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000012';
const CONCEPT_MISSING_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0000000000aa';
const REGION_SET_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000021';
const GENETIC_PROTOCOL_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000031';
const COL_AGE_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000101';
const COL_NAME_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000102';
const COL_MISMATCH_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000103';
const COL_MISSING_CONCEPT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000104';

const REF_COL_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const refDimAlphaFixture = {
  code: 'ALPHA',
  col_code_prefix: 'ALP',
  description: 'Alpha dimension',
  dim_type: CaseDbDimType.TEXT,
  id: ALPHA_DIM_ID,
  label: 'Alpha label',
  rank: 1,
} as CaseDbRefDim;

const refDimBetaFixture = {
  code: 'BETA',
  col_code_prefix: 'BET',
  description: 'Beta dimension',
  dim_type: CaseDbDimType.NUMBER,
  id: BETA_DIM_ID,
  label: 'Beta label',
  rank: 2,
} as CaseDbRefDim;

const refDimGeoFixture = {
  code: 'GEO',
  col_code_prefix: 'GEO',
  description: 'Geo dimension',
  dim_type: CaseDbDimType.GEO,
  id: GEO_DIM_ID,
  label: 'Geo label',
  rank: 3,
} as CaseDbRefDim;

const refDimTimeFixture = {
  code: 'TIME',
  col_code_prefix: 'TIM',
  description: 'Time dimension',
  dim_type: CaseDbDimType.TIME,
  id: TIME_DIM_ID,
  label: 'Time label',
  rank: 4,
} as CaseDbRefDim;

const conceptSetDayFixture = {
  code: 'DAY_CONCEPT',
  id: CONCEPT_DAY_ID,
  name: 'Day concept',
  unit: CaseDbUnit.DAY,
} as CaseDbConceptSet;

const conceptSetNoUnitFixture = {
  code: 'PLAIN_CONCEPT',
  id: CONCEPT_NO_UNIT_ID,
  name: 'Plain concept',
} as CaseDbConceptSet;

const regionSetFixture = {
  code: 'REGION_SET',
  id: REGION_SET_ID,
  name: 'Region set name',
} as CaseDbRegionSet;

const geneticDistanceProtocolFixture = {
  id: GENETIC_PROTOCOL_ID,
  name: 'Protocol name',
} as CaseDbGeneticDistanceProtocol;

const validationRulesFixture = {
  valid_col_types_by_dim_type: {
    [CaseDbDimType.GEO]: [CaseDbColType.GEO_REGION, CaseDbColType.GEO_LATLON, CaseDbColType.OTHER],
    [CaseDbDimType.NUMBER]: [CaseDbColType.DECIMAL_0, CaseDbColType.INTERVAL, CaseDbColType.NOMINAL, CaseDbColType.OTHER, CaseDbColType.GENETIC_DISTANCE],
    [CaseDbDimType.TEXT]: [CaseDbColType.REGULAR_LANGUAGE, CaseDbColType.CONTEXT_FREE_GRAMMAR_JSON, CaseDbColType.OTHER],
    [CaseDbDimType.TIME]: [CaseDbColType.TIME_DAY],
  },
};

const colAgeFixture = {
  code: 'AGE',
  code_suffix: 'AGE',
  col_type: CaseDbColType.INTERVAL,
  concept_set_id: CONCEPT_DAY_ID,
  description: 'Age in days',
  id: COL_AGE_ID,
  label: 'Age label',
  rank: 1,
  ref_dim_id: BETA_DIM_ID,
  unit: CaseDbUnit.DAY,
} as CaseDbRefCol;

const colNameFixture = {
  code: 'NAME',
  code_suffix: 'NAME',
  col_type: CaseDbColType.REGULAR_LANGUAGE,
  id: COL_NAME_ID,
  label: 'Name label',
  rank: 2,
  ref_dim_id: ALPHA_DIM_ID,
  regex: '^[a-z]+$',
} as CaseDbRefCol;

const colMismatchFixture = {
  code: 'WEIGHT',
  code_suffix: 'WEIGHT',
  col_type: CaseDbColType.INTERVAL,
  concept_set_id: CONCEPT_DAY_ID,
  id: COL_MISMATCH_ID,
  label: 'Weight label',
  rank: 3,
  ref_dim_id: BETA_DIM_ID,
  unit: CaseDbUnit.YEAR,
} as CaseDbRefCol;

const colMissingConceptFixture = {
  code: 'HEIGHT',
  code_suffix: 'HEIGHT',
  col_type: CaseDbColType.INTERVAL,
  concept_set_id: CONCEPT_MISSING_ID,
  id: COL_MISSING_CONCEPT_ID,
  label: 'Height label',
  rank: 4,
  ref_dim_id: BETA_DIM_ID,
  unit: CaseDbUnit.DAY,
} as CaseDbRefCol;

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const setupMocks = (colItems: CaseDbRefCol[]) => {
  mockApiRequest('GET', REF_DIMS_PATH, () => Response.json([refDimAlphaFixture, refDimBetaFixture, refDimGeoFixture, refDimTimeFixture]));
  mockApiRequest('GET', CONCEPT_SETS_PATH, () => Response.json([conceptSetDayFixture, conceptSetNoUnitFixture]));
  mockApiRequest('GET', REGION_SETS_PATH, () => Response.json([regionSetFixture]));
  mockApiRequest('GET', GENETIC_DISTANCE_PROTOCOLS_PATH, () => Response.json([geneticDistanceProtocolFixture]));
  mockApiRequest('GET', VALIDATION_RULES_PATH, () => Response.json(validationRulesFixture));
  return mockCrudApi(REF_COLS_PATH, colItems as ({ id: string } & CaseDbRefCol)[]);
};

const renderUnscopedPage = async (colItems: CaseDbRefCol[] = []) => {
  const mock = setupMocks(colItems);
  const screen = await renderRoutedPage(
    <RefColsAdminPage />, {
      path: UNSCOPED_ROUTE_PATH,
      permissions: REF_COL_PERMISSIONS as CommonDbApiPermission[],
      url: UNSCOPED_ROUTE_PATH,
    },
  );
  return { mock, screen };
};

const renderScopedPage = async (refDimId: string, colItems: CaseDbRefCol[] = []) => {
  const mock = setupMocks(colItems);
  const screen = await renderRoutedPage(
    <RefColsAdminPage />, {
      path: SCOPED_ROUTE_PATH,
      permissions: REF_COL_PERMISSIONS as CommonDbApiPermission[],
      url: `/management/reference-dimensions/${refDimId}/reference-columns`,
    },
  );
  return { mock, screen };
};

type Screen = Awaited<ReturnType<typeof renderUnscopedPage>>['screen'];

const openRowActions = async (screen: Screen) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const openCreateDialog = async (screen: Screen) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new reference column', { exact: true })).toBeVisible();
};

const selectOption = async (screen: Screen, fieldName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

const fillCommonFields = async (screen: Screen, code: string, label: string) => {
  await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill(label);
  await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill(code);
  await screen.getByRole('textbox', { exact: true, name: 'Column code prefix' }).fill(code);
  await screen.getByRole('spinbutton', { exact: true, name: 'Rank' }).fill('1');
};

const getPostCalls = (mock: ReturnType<typeof mockCrudApi>) => mock.calls.filter(({ method }) => method === 'POST');

describe('RefColsAdminPage', () => {
  it('lists all reference columns with their reference dimension when unscoped', async () => {
    const { screen } = await renderUnscopedPage([colAgeFixture, colNameFixture]);

    await expect.element(screen.getByText(/^Reference columns/)).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha label' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta label' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'INTERVAL' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'REGULAR_LANGUAGE' })).toBeInTheDocument();
  });

  it('shows only the reference columns of the dimension and its title when scoped', async () => {
    const { screen } = await renderScopedPage(ALPHA_DIM_ID, [colAgeFixture, colNameFixture]);

    await expect.element(screen.getByText(/^ALPHA -> Reference columns/)).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Name label' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Age label' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Alpha label' }).query()).toBeNull();
  });

  it('shows the plain title when the scoped reference dimension is unknown', async () => {
    const { screen } = await renderScopedPage(UNKNOWN_DIM_ID);

    await expect.element(screen.getByText(/^Reference columns/)).toBeInTheDocument();
  });

  it('offers only the column types valid for the selected dimension type', async () => {
    const { screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await screen.getByRole('combobox', { exact: true, name: 'Column type' }).click();
    await expect.element(screen.getByRole('option', { exact: true, name: 'INTERVAL' })).toBeInTheDocument();
    await expect.element(screen.getByRole('option', { exact: true, name: 'GENETIC_DISTANCE' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('option', { exact: true, name: 'TIME_DAY' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('option', { exact: true, name: 'REGULAR_LANGUAGE' }).query()).toBeNull();
  });

  it('creates an interval column and takes its unit from the selected concept set', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'INTERVAL');
    await fillCommonFields(screen, 'AGE', 'Age label');
    await selectOption(screen, 'Concept set', 'Day concept');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Unit' })).toHaveValue('DAY');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.pathname).toBe(REF_COLS_PATH);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      code: 'AGE',
      col_type: CaseDbColType.INTERVAL,
      concept_set_id: CONCEPT_DAY_ID,
      label: 'Age label',
      rank: 1,
      ref_dim_id: BETA_DIM_ID,
      unit: CaseDbUnit.DAY,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('clears the concept set and unit when the column type changes to one that does not use them', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'INTERVAL');
    await fillCommonFields(screen, 'AGE', 'Age label');
    await selectOption(screen, 'Concept set', 'Day concept');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Unit' })).toHaveValue('DAY');
    await selectOption(screen, 'Column type', 'OTHER');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Concept set' })).toHaveValue('');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Unit' })).toHaveValue('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.OTHER,
      concept_set_id: null,
      unit: null,
    }));
  });

  it('creates a nominal column with a concept set that has no unit and keeps the unit empty', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'NOMINAL');
    await fillCommonFields(screen, 'SEX', 'Sex label');
    await selectOption(screen, 'Concept set', 'Plain concept');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Unit' })).toHaveValue('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.NOMINAL,
      concept_set_id: CONCEPT_NO_UNIT_ID,
      unit: null,
    }));
  });

  it('creates a regular language column with a regex on a scoped page defaulting to its dimension', async () => {
    const { mock, screen } = await renderScopedPage(ALPHA_DIM_ID);

    await openCreateDialog(screen);
    await selectOption(screen, 'Column type', 'REGULAR_LANGUAGE');
    await fillCommonFields(screen, 'NAME', 'Name label');
    await screen.getByRole('textbox', { exact: true, name: 'Regex' }).fill('^[a-z]+$');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.REGULAR_LANGUAGE,
      ref_dim_id: ALPHA_DIM_ID,
      regex: '^[a-z]+$',
    }));
  });

  it('creates a context free grammar column with a schema definition and schema URI', async () => {
    const { mock, screen } = await renderScopedPage(ALPHA_DIM_ID);

    await openCreateDialog(screen);
    await selectOption(screen, 'Column type', 'CONTEXT_FREE_GRAMMAR_JSON');
    await fillCommonFields(screen, 'GRAMMAR', 'Grammar label');
    await screen.getByRole('textbox', { exact: true, name: 'Schema definition' }).fill('grammar definition');
    await screen.getByRole('textbox', { exact: true, name: 'Schema URI' }).fill('https://example.org/grammar.json');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.CONTEXT_FREE_GRAMMAR_JSON,
      schema_definition: 'grammar definition',
      schema_uri: 'https://example.org/grammar.json',
    }));
  });

  it('creates a geo region column with a region set', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Geo label');
    await selectOption(screen, 'Column type', 'GEO_REGION');
    await fillCommonFields(screen, 'REGION', 'Region label');
    await selectOption(screen, 'Region set', 'Region set name');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.GEO_REGION,
      ref_dim_id: GEO_DIM_ID,
      region_set_id: REGION_SET_ID,
    }));
  });

  it('clears the region set when the column type changes away from geo region', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Geo label');
    await selectOption(screen, 'Column type', 'GEO_REGION');
    await fillCommonFields(screen, 'REGION', 'Region label');
    await selectOption(screen, 'Region set', 'Region set name');
    await selectOption(screen, 'Column type', 'GEO_LATLON');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Region set' })).toHaveValue('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.GEO_LATLON,
      region_set_id: null,
    }));
  });

  it('creates a genetic distance column with a genetic distance protocol', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'GENETIC_DISTANCE');
    await fillCommonFields(screen, 'DISTANCE', 'Distance label');
    await selectOption(screen, 'Genetic distance protocol', 'Protocol name');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.GENETIC_DISTANCE,
      genetic_distance_protocol_id: GENETIC_PROTOCOL_ID,
    }));
  });

  it('clears the genetic distance protocol when the column type changes away from genetic distance', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'GENETIC_DISTANCE');
    await fillCommonFields(screen, 'DISTANCE', 'Distance label');
    await selectOption(screen, 'Genetic distance protocol', 'Protocol name');
    await selectOption(screen, 'Column type', 'OTHER');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Genetic distance protocol' })).toHaveValue('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => getPostCalls(mock).length).toBe(1);
    expect(getPostCalls(mock)[0]?.body).toEqual(expect.objectContaining({
      col_type: CaseDbColType.OTHER,
      genetic_distance_protocol_id: null,
    }));
  });

  it('selects the only valid column type when the reference dimension changes to time', async () => {
    const { screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Alpha label');
    await selectOption(screen, 'Column type', 'REGULAR_LANGUAGE');
    await selectOption(screen, 'Reference dimension', 'Time label');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Column type' })).toHaveValue('TIME_DAY');
  });

  it('clears the column type when the new reference dimension has several valid column types', async () => {
    const { screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Alpha label');
    await selectOption(screen, 'Column type', 'REGULAR_LANGUAGE');
    await selectOption(screen, 'Reference dimension', 'Geo label');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Column type' })).toHaveValue('');
  });

  it('does not create a column without a regex for a regular language column', async () => {
    const { mock, screen } = await renderScopedPage(ALPHA_DIM_ID);

    await openCreateDialog(screen);
    await selectOption(screen, 'Column type', 'REGULAR_LANGUAGE');
    await fillCommonFields(screen, 'NAME', 'Name label');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new reference column', { exact: true })).toBeVisible();
    await expect.poll(() => getPostCalls(mock).length).toBe(0);
  });

  it('does not create an interval column without a concept set', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'INTERVAL');
    await fillCommonFields(screen, 'AGE', 'Age label');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new reference column', { exact: true })).toBeVisible();
    await expect.poll(() => getPostCalls(mock).length).toBe(0);
  });

  it('requires a unit for an interval column', async () => {
    const { mock, screen } = await renderUnscopedPage();

    await openCreateDialog(screen);
    await selectOption(screen, 'Reference dimension', 'Beta label');
    await selectOption(screen, 'Column type', 'INTERVAL');
    await fillCommonFields(screen, 'AGE', 'Age label');
    await selectOption(screen, 'Concept set', 'Plain concept');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Unit is required for this column type', { exact: true })).toBeVisible();
    await expect.poll(() => getPostCalls(mock).length).toBe(0);
  });

  it('does not create a context free grammar column with an invalid schema URI', async () => {
    const { mock, screen } = await renderScopedPage(ALPHA_DIM_ID);

    await openCreateDialog(screen);
    await selectOption(screen, 'Column type', 'CONTEXT_FREE_GRAMMAR_JSON');
    await fillCommonFields(screen, 'GRAMMAR', 'Grammar label');
    await screen.getByRole('textbox', { exact: true, name: 'Schema definition' }).fill('grammar definition');
    await screen.getByRole('textbox', { exact: true, name: 'Schema URI' }).fill('not a uri');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new reference column', { exact: true })).toBeVisible();
    await expect.poll(() => getPostCalls(mock).length).toBe(0);
  });

  it('edits a reference column with the reference dimension and column type locked', async () => {
    const { mock, screen } = await renderUnscopedPage([colAgeFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Age label', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Reference dimension' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Column type' })).toBeDisabled();
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Age renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${REF_COLS_PATH}/${COL_AGE_ID}`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: COL_AGE_ID, label: 'Age renamed', unit: CaseDbUnit.DAY }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('does not save an interval column whose unit differs from its concept set unit', async () => {
    const { mock, screen } = await renderUnscopedPage([colMismatchFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Weight label', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Unit should match the unit of the selected concept set', { exact: true })).toBeVisible();
    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(0);
  });

  it('saves an interval column whose concept set is not among the loaded concept sets without a unit match check', async () => {
    const { mock, screen } = await renderUnscopedPage([colMissingConceptFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Height label', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'PUT')?.body).toEqual(expect.objectContaining({ concept_set_id: CONCEPT_MISSING_ID }));
  });

  it('deletes a reference column', async () => {
    const { mock, screen } = await renderUnscopedPage([colNameFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${REF_COLS_PATH}/${COL_NAME_ID}`);
  });
});
