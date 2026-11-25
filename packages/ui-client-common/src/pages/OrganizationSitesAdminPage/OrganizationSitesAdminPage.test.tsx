import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbSite,
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

import { OrganizationSitesAdminPage } from './OrganizationSitesAdminPage';

type SiteFixture = { readonly id: string } & CommonDbSite;

const SITES_PATH = '/v1/sites';
const ORGANIZATION_ONE_ID = '00000000-0000-4000-8000-000000000001';
const ORGANIZATION_TWO_ID = '00000000-0000-4000-8000-000000000002';
const ROUTE_PATH = '/management/organizations/:organizationId/sites';

const SITE_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.SiteCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const CONTACT_READ_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.ContactCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const siteOneFixture: SiteFixture = {
  id: 'site-1',
  name: 'Site One',
  organization_id: ORGANIZATION_ONE_ID,
};

const siteTwoFixture: SiteFixture = {
  id: 'site-2',
  name: 'Site Two',
  organization_id: ORGANIZATION_TWO_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: SiteFixture[] = [siteOneFixture, siteTwoFixture], permissions = SITE_PERMISSIONS) => {
  const mock = mockCrudApi(SITES_PATH, initialItems);
  const screen = await renderRoutedPage(
    <OrganizationSitesAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: `/management/organizations/${ORGANIZATION_ONE_ID}/sites`,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('OrganizationSitesAdminPage', () => {
  it('lists only the sites of the organization in the route', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('Site One', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Site Two', { exact: true })).not.toBeInTheDocument();
  });

  it('creates a site for the organization in the route', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new site', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Site Three');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({
      name: 'Site Three',
      organization_id: ORGANIZATION_ONE_ID,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a site and keeps it attached to the organization in the route', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Site One', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Site Renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${SITES_PATH}/site-1`);
    expect(putCall?.body).toEqual({ id: 'site-1', name: 'Site Renamed', organization_id: ORGANIZATION_ONE_ID });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a site and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${SITES_PATH}/site-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('navigates to the contacts of a site when the user can read contacts', async () => {
    const { screen } = await renderPage([siteOneFixture], [...SITE_PERMISSIONS, CONTACT_READ_PERMISSION]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: /Manage contacts$/ }).click();

    await expect.poll(() => window.location.pathname).toBe(`/management/organizations/${ORGANIZATION_ONE_ID}/sites/site-1/contacts`);
  });

  it('hides the contacts sub page when the user cannot read contacts', async () => {
    const { screen } = await renderPage([siteOneFixture]);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { name: /Manage contacts$/ })).not.toBeInTheDocument();
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([siteOneFixture], []);

    await expect.element(screen.getByText('Site One', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
  });
});
