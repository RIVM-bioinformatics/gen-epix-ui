import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbIdentifierIssuer,
  CommonDbOrganization,
  CommonDbOrganizationIdentifierIssuerLink,
} from '@gen-epix/api-commondb';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';

import { NotificationService } from '../../classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '../../test/lib';
import type { MockCrudApiCall } from '../../test/requests/mockCrudApi';
import { mockApiRequest } from '../../test/requests/mockApi';

import { OrganizationsAdminPage } from './OrganizationsAdminPage';

type OrganizationFixture = { readonly id: string } & CommonDbOrganization;

const ORGANIZATIONS_PATH = '/v1/organizations';
const IDENTIFIER_ISSUERS_PATH = '/v1/identifier_issuers';
const ORGANIZATION_IDENTIFIER_ISSUER_LINKS_PATH = '/v1/organization_identifier_issuer_links';
const ROUTE_PATH = '/management/organizations';
const CREATED_ORGANIZATION_ID = 'created-3';

const ORGANIZATION_ONE_ID = '00000000-0000-4000-8000-000000000001';
const ORGANIZATION_TWO_ID = '00000000-0000-4000-8000-000000000002';
const ISSUER_ONE_ID = '10000000-0000-4000-8000-000000000001';
const ISSUER_TWO_ID = '10000000-0000-4000-8000-000000000002';
const ISSUER_THREE_ID = '10000000-0000-4000-8000-000000000003';

const ORGANIZATION_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.OrganizationCrudCommand, permission_type: CommonDbPermissionType.DELETE },
  { command_name: CommonDbCommandName.OrganizationIdentifierIssuerLinkUpdateAssociationCommand, permission_type: CommonDbPermissionType.EXECUTE },
];

const SITE_READ_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.SiteCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const organizationOneFixture: OrganizationFixture = {
  code: 'ORG-1',
  id: ORGANIZATION_ONE_ID,
  name: 'Organization One',
};

const organizationTwoFixture: OrganizationFixture = {
  code: 'ORG-2',
  id: ORGANIZATION_TWO_ID,
  name: 'Organization Two',
};

const identifierIssuerOneFixture: { readonly id: string } & CommonDbIdentifierIssuer = {
  code: 'ISS-1',
  id: ISSUER_ONE_ID,
  name: 'Alpha Issuer',
};

const identifierIssuerTwoFixture: { readonly id: string } & CommonDbIdentifierIssuer = {
  code: 'ISS-2',
  id: ISSUER_TWO_ID,
  name: 'Beta Issuer',
};

const identifierIssuerThreeFixture: { readonly id: string } & CommonDbIdentifierIssuer = {
  code: 'ISS-3',
  id: ISSUER_THREE_ID,
  name: 'Gamma Issuer',
};

const linksFixture: CommonDbOrganizationIdentifierIssuerLink[] = [
  { identifier_issuer_id: ISSUER_ONE_ID, organization_id: ORGANIZATION_ONE_ID },
  { identifier_issuer_id: ISSUER_TWO_ID, organization_id: ORGANIZATION_ONE_ID },
];

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

/**
 * Registers the PUT endpoint that replaces the identifier issuer links of an organization and records its requests.
 */
const mockAssociationApi = (organizationId: string): MockCrudApiCall[] => {
  const calls: MockCrudApiCall[] = [];
  mockApiRequest('PUT', `${ORGANIZATIONS_PATH}/${organizationId}/identifier_issuers`, async (request) => {
    calls.push({ body: await request.json(), method: request.method, pathname: new URL(request.url).pathname });
    return Response.json({});
  });
  return calls;
};

const renderPage = async (permissions = ORGANIZATION_PERMISSIONS) => {
  const mock = mockCrudApi(ORGANIZATIONS_PATH, [organizationOneFixture, organizationTwoFixture]);
  mockApiRequest('GET', IDENTIFIER_ISSUERS_PATH, () => Response.json([identifierIssuerOneFixture, identifierIssuerTwoFixture, identifierIssuerThreeFixture]));
  mockApiRequest('GET', ORGANIZATION_IDENTIFIER_ISSUER_LINKS_PATH, () => Response.json(linksFixture));
  const screen = await renderRoutedPage(
    <OrganizationsAdminPage />, { path: ROUTE_PATH, permissions },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('OrganizationsAdminPage', () => {
  it('lists the organizations with the number of linked identifier issuers', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('Organization One', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('2 / 3', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Organization Two', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('0 / 3', { exact: true })).toBeInTheDocument();
  });

  it('creates an organization and links the selected identifier issuers', async () => {
    const { mock, screen } = await renderPage();
    const associationCalls = mockAssociationApi(CREATED_ORGANIZATION_ID);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new organization', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Organization Three');
    await screen.getByRole('textbox', { name: 'Code' }).fill('ORG-3');
    await screen.getByText('Alpha Issuer', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postBody = mock.calls.find(({ method }) => method === 'POST')?.body;
    expect(postBody).toEqual(expect.objectContaining({ code: 'ORG-3', name: 'Organization Three' }));
    expect(postBody).not.toHaveProperty('identifierIssuerIds');

    await expect.poll(() => associationCalls.length).toBe(1);
    expect(associationCalls[0]?.body).toEqual({
      organization_identifier_issuer_links: [{ identifier_issuer_id: ISSUER_ONE_ID, organization_id: CREATED_ORGANIZATION_ID }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits an organization and replaces its identifier issuer links', async () => {
    const { mock, screen } = await renderPage();
    const associationCalls = mockAssociationApi(ORGANIZATION_ONE_ID);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Organization One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Organization Renamed');
    await screen.getByText('Alpha Issuer', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected left' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${ORGANIZATIONS_PATH}/${ORGANIZATION_ONE_ID}`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: ORGANIZATION_ONE_ID, name: 'Organization Renamed' }));

    await expect.poll(() => associationCalls.length).toBe(1);
    expect(associationCalls[0]?.body).toEqual({
      organization_identifier_issuer_links: [{ identifier_issuer_id: ISSUER_TWO_ID, organization_id: ORGANIZATION_ONE_ID }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes an organization and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${ORGANIZATIONS_PATH}/${ORGANIZATION_ONE_ID}`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('navigates to the sites of an organization when the user can read sites', async () => {
    const { screen } = await renderPage([...ORGANIZATION_PERMISSIONS, SITE_READ_PERMISSION]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Manage sites$/ }).click();

    await expect.poll(() => window.location.pathname).toBe(`/management/organizations/${ORGANIZATION_ONE_ID}/sites`);
  });

  it('hides the sites sub page when the user cannot read sites', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: /Manage sites$/ })).not.toBeInTheDocument();
  });
});
