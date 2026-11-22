import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { getInstanceByDom } from 'echarts/core';
import type {
  CaseDbDataCollection,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
} from '@gen-epix/api-casedb';
import type { CommonDbOrganization } from '@gen-epix/api-commondb';
import {
  mockApiRequest,
  renderRoutedPage as renderComponent,
} from '@gen-epix/ui-client-common/test/lib';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import { DataCollectionVisualizationPage } from './DataCollectionVisualizationPage';

const ORGANIZATIONS_PATH = '/v1/organizations';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const ACCESS_POLICIES_PATH = '/v1/organization_access_case_policies';
const SHARE_POLICIES_PATH = '/v1/organization_share_case_policies';
const CHART_SELECTOR = '[_echarts_instance_]';
const PROMPT = 'Select an organization or data collection to show the visualization.';
const EMPTY_MESSAGE = 'No active organization access or share policies are available to visualize.';
const ORGANIZATION_TYPE_LABEL = 'Organization';
const DATA_COLLECTION_TYPE_LABEL = 'Data collection';

const ORG_ALPHA_ID = 'org-alpha';
const ORG_ALPHA_NAME = 'Alpha';
const ORG_BRAVO_ID = 'org-bravo';
const ORG_BRAVO_NAME = 'Bravo';
const ORG_CHARLIE_ID = 'org-charlie';
const ORG_CHARLIE_NAME = 'Charlie';
const ORG_DELTA_ID = 'org-delta';
const ORG_DELTA_NAME = 'Delta';
const ORG_GHOST_ID = 'org-ghost';

const DC_ONE_ID = 'dc-one';
const DC_ONE_NAME = 'DC One';
const DC_TWO_ID = 'dc-two';
const DC_TWO_NAME = 'DC Two';
const DC_THREE_ID = 'dc-three';
const DC_THREE_NAME = 'DC Three';
const DC_UNKNOWN_ID = 'dc-unknown';

const createOrganization = (overrides: Partial<CommonDbOrganization> = {}): CommonDbOrganization => ({
  code: 'example',
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Example organization',
  ...overrides,
});

const createDataCollection = (overrides: Partial<CaseDbDataCollection> = {}): CaseDbDataCollection => ({
  id: DC_ONE_ID,
  name: DC_ONE_NAME,
  ...overrides,
});

const createAccessPolicy = (overrides: Partial<CaseDbOrganizationAccessCasePolicy> = {}): CaseDbOrganizationAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'case-type-set',
  data_collection_id: DC_ONE_ID,
  is_active: true,
  is_private: false,
  organization_id: ORG_ALPHA_ID,
  read_case_set: true,
  read_col_set_id: 'read-col-set',
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: 'write-col-set',
  ...overrides,
});

const NO_RIGHTS: Partial<CaseDbOrganizationAccessCasePolicy> = {
  add_case: false,
  add_case_set: false,
  is_private: false,
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
};

const createSharePolicy = (overrides: Partial<CaseDbOrganizationShareCasePolicy> = {}): CaseDbOrganizationShareCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'case-type-set',
  data_collection_id: DC_ONE_ID,
  from_data_collection_id: DC_TWO_ID,
  is_active: true,
  organization_id: ORG_ALPHA_ID,
  remove_case: true,
  remove_case_set: true,
  ...overrides,
});

const ORGANIZATIONS: CommonDbOrganization[] = [
  createOrganization({ code: 'alpha', id: ORG_ALPHA_ID, name: ORG_ALPHA_NAME }),
  createOrganization({ code: 'bravo', id: ORG_BRAVO_ID, name: ORG_BRAVO_NAME }),
  createOrganization({ code: 'charlie', id: ORG_CHARLIE_ID, name: ORG_CHARLIE_NAME }),
  createOrganization({ code: 'delta', id: ORG_DELTA_ID, name: ORG_DELTA_NAME }),
];

const DATA_COLLECTIONS: CaseDbDataCollection[] = [
  createDataCollection({ id: DC_ONE_ID, name: DC_ONE_NAME }),
  createDataCollection({ id: DC_TWO_ID, name: DC_TWO_NAME }),
  createDataCollection({ id: DC_THREE_ID, name: DC_THREE_NAME }),
];

const ACCESS_POLICIES: CaseDbOrganizationAccessCasePolicy[] = [
  createAccessPolicy({ data_collection_id: DC_ONE_ID, is_private: true, organization_id: ORG_ALPHA_ID }),
  createAccessPolicy({ data_collection_id: DC_TWO_ID, organization_id: ORG_ALPHA_ID, ...NO_RIGHTS }),
  createAccessPolicy({ data_collection_id: DC_ONE_ID, organization_id: ORG_BRAVO_ID }),
  createAccessPolicy({ data_collection_id: DC_UNKNOWN_ID, organization_id: ORG_BRAVO_ID }),
  createAccessPolicy({ data_collection_id: DC_THREE_ID, is_active: false, organization_id: ORG_BRAVO_ID }),
  createAccessPolicy({ data_collection_id: DC_TWO_ID, organization_id: ORG_CHARLIE_ID }),
  createAccessPolicy({ data_collection_id: DC_ONE_ID, organization_id: ORG_GHOST_ID }),
  createAccessPolicy({ data_collection_id: DC_TWO_ID, organization_id: ORG_GHOST_ID }),
  createAccessPolicy({ data_collection_id: DC_ONE_ID, is_active: false, organization_id: ORG_DELTA_ID }),
];

const SHARE_POLICIES: CaseDbOrganizationShareCasePolicy[] = [
  createSharePolicy({ from_data_collection_id: DC_TWO_ID, organization_id: ORG_ALPHA_ID }),
  createSharePolicy({ from_data_collection_id: DC_THREE_ID, organization_id: ORG_ALPHA_ID }),
  createSharePolicy({ from_data_collection_id: DC_UNKNOWN_ID, organization_id: ORG_ALPHA_ID }),
  createSharePolicy({ from_data_collection_id: DC_TWO_ID, organization_id: ORG_BRAVO_ID }),
  createSharePolicy({ data_collection_id: DC_TWO_ID, from_data_collection_id: DC_THREE_ID, organization_id: ORG_GHOST_ID }),
];

type ChartAccessLink = {
  accessPolicyCount: number;
  dataCollectionName: string;
  linkType: 'access';
  organizationName: string;
};

type ChartLink = ChartAccessLink | ChartShareLink;

type ChartNode = {
  label: { position: string };
  name: string;
  x: number;
  y: number;
};

type ChartOption = {
  series: {
    data: ChartNode[];
    links: ChartLink[];
  }[];
  tooltip: {
    formatter: (params: { data: ChartLink | ChartNode; dataType: string }) => string;
  }[];
};

type ChartShareLink = {
  linkType: 'share';
  sourceDataCollectionName: string;
  targetDataCollectionName: string;
};

type Screen = Awaited<ReturnType<typeof renderComponent>>;

const getChartOption = async (): Promise<ChartOption> => {
  let option: ChartOption | undefined;
  await vi.waitFor(() => {
    const element = document.querySelector<HTMLElement>(CHART_SELECTOR);
    const instance = element ? getInstanceByDom(element) : undefined;
    option = instance?.getOption() as unknown as ChartOption | undefined;
    expect(option?.series[0].data.length).toBeGreaterThan(0);
  }, { timeout: 10_000 });
  return option;
};

const getChartNodes = (option: ChartOption) => {
  return option.series[0].data;
};

const getChartLinks = (option: ChartOption) => {
  return option.series[0].links;
};

const formatTooltipLines = (option: ChartOption, data: ChartLink | ChartNode, dataType: string) => {
  return option.tooltip[0].formatter({ data, dataType }).split('<br/>');
};

const selectOption = async (screen: Screen, label: string) => {
  await screen.getByRole('combobox').fill(label);
  await screen.getByRole('option', { exact: true, name: label }).click();
};

describe('DataCollectionVisualizationPage', () => {
  beforeEach(() => {
    mockApiRequest('GET', ORGANIZATIONS_PATH, () => Response.json(ORGANIZATIONS));
    mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json(DATA_COLLECTIONS));
    mockApiRequest('GET', ACCESS_POLICIES_PATH, () => Response.json(ACCESS_POLICIES));
    mockApiRequest('GET', SHARE_POLICIES_PATH, () => Response.json(SHARE_POLICIES));
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('shows the selection prompt and no chart before an entity is selected', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await expect.element(screen.getByRole('combobox')).toBeInTheDocument();
    await expect.element(screen.getByText(PROMPT, { exact: true }).first()).toBeInTheDocument();
    expect(screen.getByText(PROMPT, { exact: true }).elements()).toHaveLength(2);
    expect(document.querySelector(CHART_SELECTOR)).toBeNull();
  });

  it('shows summary counts and the graph for a selected organization', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);

    await expect.element(screen.getByText('Organizations: 1', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Data collections: 4', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Access links: 2', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Share routes: 3', { exact: true })).toBeInTheDocument();

    const option = await getChartOption();
    expect(getChartNodes(option).map(node => node.name).sort()).toEqual([ORG_ALPHA_NAME, DC_ONE_NAME, DC_THREE_NAME, DC_TWO_NAME, DC_UNKNOWN_ID].sort());
    expect(getChartLinks(option)).toHaveLength(5);
  });

  it('falls back to raw ids for data collections missing from the list', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_BRAVO_NAME);
    await expect.element(screen.getByText('Access links: 2', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Share routes: 1', { exact: true })).toBeInTheDocument();

    const option = await getChartOption();
    expect(getChartNodes(option).map(node => node.name).sort()).toEqual([ORG_BRAVO_NAME, DC_ONE_NAME, DC_TWO_NAME, DC_UNKNOWN_ID].sort());
    expect(getChartLinks(option)).toHaveLength(3);
  });

  it('lays out a single organization and data collection pair on one offset row', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_CHARLIE_NAME);
    await expect.element(screen.getByText('Share routes: 0', { exact: true })).toBeInTheDocument();

    const option = await getChartOption();
    const organizationNode = getChartNodes(option).find(node => node.name === ORG_CHARLIE_NAME);
    const dataCollectionNode = getChartNodes(option).find(node => node.name === DC_TWO_NAME);
    expect(organizationNode?.y).toBe(72);
    expect(dataCollectionNode?.y).toBe(168);
    expect(dataCollectionNode?.label.position).toBe('left');
  });

  it('shows organizations, routes and fallback names for a selected data collection', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await screen.getByRole('button', { exact: true, name: DATA_COLLECTION_TYPE_LABEL }).click();
    await selectOption(screen, DC_ONE_NAME);
    await expect.element(screen.getByText('Organizations: 3', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Data collections: 4', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Access links: 3', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Share routes: 3', { exact: true })).toBeInTheDocument();

    const option = await getChartOption();
    const nodeNames = getChartNodes(option).map(node => node.name);
    expect(nodeNames).toContain(ORG_GHOST_ID);
    expect(nodeNames).toContain(DC_UNKNOWN_ID);

    const sharedRoute = getChartLinks(option).find((link): link is ChartShareLink => link.linkType === 'share' && link.sourceDataCollectionName === DC_TWO_NAME);
    expect(formatTooltipLines(option, sharedRoute, 'edge')).toEqual([
      `<strong>${DC_TWO_NAME} -> ${DC_ONE_NAME}</strong>`,
      'Type: Organization share',
      'Active share policies: 2',
      `Organizations: ${ORG_ALPHA_NAME}, ${ORG_BRAVO_NAME}`,
    ]);
  });

  it('keeps the selection when the active type is clicked and resets it when the type changes', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);
    await expect.element(screen.getByText('Organizations: 1', { exact: true })).toBeInTheDocument();

    await screen.getByRole('button', { exact: true, name: ORGANIZATION_TYPE_LABEL }).click();
    await expect.element(screen.getByText('Organizations: 1', { exact: true })).toBeInTheDocument();

    await screen.getByRole('button', { exact: true, name: DATA_COLLECTION_TYPE_LABEL }).click();
    await expect.element(screen.getByText(PROMPT, { exact: true }).first()).toBeInTheDocument();
    expect(document.querySelector(CHART_SELECTOR)).toBeNull();
  });

  it('clears the selection with the clear button', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);
    await expect.element(screen.getByText('Organizations: 1', { exact: true })).toBeInTheDocument();

    await screen.getByRole('button', { name: 'Clear' }).click();
    await expect.element(screen.getByText(PROMPT, { exact: true }).first()).toBeInTheDocument();
    expect(document.querySelector(CHART_SELECTOR)).toBeNull();
  });

  it('shows the empty message when the selected organization has no active policies', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_DELTA_NAME);

    await expect.element(screen.getByText(EMPTY_MESSAGE, { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Organizations: 0', { exact: true })).toBeInTheDocument();
    expect(document.querySelector(CHART_SELECTOR)).toBeNull();
  });

  it('restores the graph for the selection after the data is reloaded', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);
    await getChartOption();

    await container.resolve(QueryClientService).queryClient.resetQueries();

    const option = await getChartOption();
    expect(getChartNodes(option)).toHaveLength(5);
    await expect.element(screen.getByText('Organizations: 1', { exact: true })).toBeInTheDocument();
  });

  it('formats organization and data collection node tooltips', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);

    const option = await getChartOption();
    const organizationNode = getChartNodes(option).find(node => node.name === ORG_ALPHA_NAME);
    const dataCollectionNode = getChartNodes(option).find(node => node.name === DC_ONE_NAME);
    const outgoingOnlyNode = getChartNodes(option).find(node => node.name === DC_THREE_NAME);

    expect(formatTooltipLines(option, organizationNode, 'node')).toEqual([
      `<strong>${ORG_ALPHA_NAME}</strong>`,
      'Accessible data collections: 2',
      'Connected share routes: 0',
    ]);
    expect(formatTooltipLines(option, dataCollectionNode, 'node')).toEqual([
      `<strong>${DC_ONE_NAME}</strong>`,
      'Organization access links: 1',
      'Incoming share routes: 3',
      'Outgoing share routes: 0',
    ]);
    expect(formatTooltipLines(option, outgoingOnlyNode, 'node')).toEqual([
      `<strong>${DC_THREE_NAME}</strong>`,
      'Organization access links: 0',
      'Incoming share routes: 0',
      'Outgoing share routes: 1',
    ]);
  });

  it('formats access and share link tooltips with rights and source collections', async () => {
    const screen = await renderComponent(
      <DataCollectionVisualizationPage />,
    );

    await selectOption(screen, ORG_ALPHA_NAME);

    const option = await getChartOption();
    const accessLinkWithRights = getChartLinks(option).find((link): link is ChartAccessLink => link.linkType === 'access' && link.dataCollectionName === DC_ONE_NAME);
    const accessLinkWithoutRights = getChartLinks(option).find((link): link is ChartAccessLink => link.linkType === 'access' && link.dataCollectionName === DC_TWO_NAME);
    const shareLink = getChartLinks(option).find((link): link is ChartShareLink => link.linkType === 'share' && link.sourceDataCollectionName === DC_TWO_NAME);

    expect(formatTooltipLines(option, accessLinkWithRights, 'edge')).toEqual([
      `<strong>${ORG_ALPHA_NAME} -> ${DC_ONE_NAME}</strong>`,
      'Type: Organization access',
      'Active access policies: 1',
      'Enabled access rights: Add case, Remove case, Add case set, Remove case set, Read case set, Write case set, Private',
      `Share source collections: ${DC_THREE_NAME}, ${DC_TWO_NAME}, ${DC_UNKNOWN_ID}`,
    ]);
    expect(formatTooltipLines(option, accessLinkWithoutRights, 'edge')).toEqual([
      `<strong>${ORG_ALPHA_NAME} -> ${DC_TWO_NAME}</strong>`,
      'Type: Organization access',
      'Active access policies: 1',
      'Enabled access rights: None',
      'Share source collections: None',
    ]);
    expect(formatTooltipLines(option, shareLink, 'edge')).toEqual([
      `<strong>${DC_TWO_NAME} -> ${DC_ONE_NAME}</strong>`,
      'Type: Organization share',
      'Active share policies: 1',
      `Organizations: ${ORG_ALPHA_NAME}`,
    ]);
  });
});
