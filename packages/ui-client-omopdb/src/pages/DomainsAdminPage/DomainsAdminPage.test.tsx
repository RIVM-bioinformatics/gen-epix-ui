import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  OmopDbApiPermission,
  OmopDbDomain,
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

import { DomainsAdminPage } from './DomainsAdminPage';

type DomainFixture = { readonly domain_id: string; readonly id: string } & OmopDbDomain;

const DOMAINS_PATH = '/v1/Domains';
const ROUTE_PATH = '/management/domains';
const URL = '/management/domains';

const DOMAIN_PERMISSIONS: OmopDbApiPermission[] = [
  { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.CREATE },
  { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.UPDATE },
  { command_name: OmopDbCommandName.DomainCrudCommand, permission_type: OmopDbPermissionType.DELETE },
];

const domainAlphaFixture: DomainFixture = {
  domain_concept_id: 'concept-1',
  domain_id: 'domain-alpha',
  domain_name: 'Alpha',
  domain_str_id: 'alpha-str',
  id: 'domain-alpha',
};

const domainBetaFixture: DomainFixture = {
  domain_concept_id: 'concept-1',
  domain_id: 'domain-beta',
  domain_name: 'Beta',
  domain_str_id: 'beta-str',
  id: 'domain-beta',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Overrides the POST handler of mockCrudApi, which returns items without `domain_id`.
 * The page maps the created item to a table row by `domain_id`, so the API response must include it.
 */
const mockDomainPost = (responseGate: Promise<void> = Promise.resolve()) => {
  const postBodies: unknown[] = [];
  mockApiRequest('POST', DOMAINS_PATH, async (request) => {
    const body = await request.json() as Partial<OmopDbDomain>;
    postBodies.push(body);
    await responseGate;
    return Response.json({ ...body, domain_id: 'created-domain', id: 'created-domain' }, { status: 201 });
  });
  return postBodies;
};

const mockReferenceData = () => {
  mockApiRequest('GET', '/v1/Concepts', () => Response.json([{ concept_id: 'concept-1', concept_name: 'Condition' }]));
};

const renderPage = async (initialItems: DomainFixture[] = [domainAlphaFixture, domainBetaFixture], permissions = DOMAIN_PERMISSIONS) => {
  mockReferenceData();
  const mock = mockCrudApi(DOMAINS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <DomainsAdminPage />, {
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

const openEditDialogForItem = async (item: Partial<DomainFixture>) => {
  const { screen } = await renderPage([{ ...item, domain_id: item.id } as DomainFixture]);
  await openRowActions(screen);
  await screen.getByRole('menuitem', { name: 'Edit' }).click();
  return screen;
};

describe('DomainsAdminPage', () => {
  it('lists the domains from the domains endpoint with the concept label', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'alpha-str' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Condition' }).first()).toBeInTheDocument();
  });

  it('creates a domain via the domains endpoint', async () => {
    const { screen } = await renderPage();
    const postBodies = mockDomainPost();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new domain', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Domain Str ID' }).fill('gamma-str');
    await screen.getByRole('textbox', { name: 'Domain Name' }).fill('Gamma');
    await screen.getByRole('combobox', { name: 'Domain Concept ID' }).click();
    await screen.getByRole('option', { name: 'Condition' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ domain_concept_id: 'concept-1', domain_name: 'Gamma', domain_str_id: 'gamma-str' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a domain via the domains endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Row actions' }).first().click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Domain Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${DOMAINS_PATH}/domain-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ domain_id: 'domain-alpha', domain_name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a domain via the domains endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DOMAINS_PATH}/domain-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([domainAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });

  it('names a domain by its domain name', async () => {
    const screen = await openEditDialogForItem({ domain_name: 'Named', domain_str_id: 'named-str', id: 'domain-named' });
    await expect.element(screen.getByText('Edit item: Named', { exact: true })).toBeVisible();
  });

  it('names a domain by its numeric domain name', async () => {
    const screen = await openEditDialogForItem({ domain_name: 7 as unknown as string, id: 'domain-number-name' });
    await expect.element(screen.getByText('Edit item: 7', { exact: true })).toBeVisible();
  });

  it('names a domain by its domain str id when the domain name is blank', async () => {
    const screen = await openEditDialogForItem({ domain_name: '   ', domain_str_id: 'STR-1', id: 'domain-str' });
    await expect.element(screen.getByText('Edit item: STR-1', { exact: true })).toBeVisible();
  });

  it('names a domain by its numeric domain str id when the domain name is missing', async () => {
    const screen = await openEditDialogForItem({ domain_str_id: 9 as unknown as string, id: 'domain-number-str' });
    await expect.element(screen.getByText('Edit item: 9', { exact: true })).toBeVisible();
  });

  it('names a domain by the label of its matching domain concept when the name and str id are blank', async () => {
    const screen = await openEditDialogForItem({ domain_concept_id: 'concept-1', domain_name: '', domain_str_id: ' ', id: 'domain-concept' });
    await expect.element(screen.getByText('Edit item: Condition', { exact: true })).toBeVisible();
  });

  it('names a domain by its id when the domain concept is not a known concept', async () => {
    const screen = await openEditDialogForItem({ domain_concept_id: 'concept-unknown', domain_name: '', domain_str_id: '', id: 'domain-unknown-concept' });
    await expect.element(screen.getByText('Edit item: domain-unknown-concept', { exact: true })).toBeVisible();
  });

  it('names a domain by its id when the domain concept id is empty', async () => {
    const screen = await openEditDialogForItem({ domain_concept_id: '', domain_name: '', domain_str_id: '', id: 'domain-empty-concept' });
    await expect.element(screen.getByText('Edit item: domain-empty-concept', { exact: true })).toBeVisible();
  });

  it('names an unsaved domain by its selected concept id when that concept is no longer among the options', async () => {
    const { screen } = await renderPage();
    let releasePost: () => void = () => undefined;
    const postBodies = mockDomainPost(new Promise<void>((resolve) => {
      releasePost = resolve;
    }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Domain Str ID' }).fill('   ');
    await screen.getByRole('textbox', { name: 'Domain Name' }).fill('   ');
    await screen.getByRole('combobox', { name: 'Domain Concept ID' }).click();
    await screen.getByRole('option', { exact: true, name: 'Condition' }).click();

    let conceptRequestCount = 0;
    mockApiRequest('GET', '/v1/Concepts', () => {
      conceptRequestCount += 1;
      return Response.json([]);
    });
    const queryClientService = container.resolve(QueryClientService);
    await queryClientService.queryClient.invalidateQueries({ queryKey: queryClientService.getGenericKey(OMOPDB_QUERY_KEY.CONCEPTS) });
    await expect.poll(() => conceptRequestCount).toBe(1);

    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ domain_concept_id: 'concept-1' }));
    // The progress notification is named from the form values while the POST is held; the success notification is named from the response row.
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('"concept-1"')]));
    releasePost();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });
});
