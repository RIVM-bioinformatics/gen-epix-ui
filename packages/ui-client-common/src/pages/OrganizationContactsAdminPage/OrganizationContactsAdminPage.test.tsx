import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CommonDbApiPermission,
  CommonDbContact,
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

import { OrganizationContactsAdminPage } from './OrganizationContactsAdminPage';

type ContactFixture = { readonly id: string } & CommonDbContact;

const CONTACTS_PATH = '/v1/contacts';
const SITE_ONE_ID = '00000000-0000-4000-8000-000000000201';
const SITE_TWO_ID = '00000000-0000-4000-8000-000000000202';
const ROUTE_PATH = '/sites/:siteId';

const CONTACT_PERMISSIONS: CommonDbApiPermission[] = [
  { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.CREATE },
  { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
  { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.DELETE },
];

const contactOneFixture: ContactFixture = {
  email: 'alice@example.com',
  id: 'contact-1',
  name: 'Alice Example',
  phone: '0123456789',
  site_id: SITE_ONE_ID,
};

const contactTwoFixture: ContactFixture = {
  email: 'bob@example.com',
  id: 'contact-2',
  name: 'Bob Example',
  phone: null,
  site_id: SITE_TWO_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: ContactFixture[] = [contactOneFixture, contactTwoFixture], permissions = CONTACT_PERMISSIONS) => {
  const mock = mockCrudApi(CONTACTS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <OrganizationContactsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: `/sites/${SITE_ONE_ID}`,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('OrganizationContactsAdminPage', () => {
  it('lists only the contacts of the site in the route', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByText('Alice Example', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('alice@example.com', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByText('Bob Example', { exact: true })).not.toBeInTheDocument();
  });

  it('creates a contact for the site in the route', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new contact', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Carol Example');
    await screen.getByRole('textbox', { name: 'Email' }).fill('carol@example.com');
    await screen.getByRole('textbox', { name: 'Phone' }).fill('0987654321');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      email: 'carol@example.com',
      name: 'Carol Example',
      phone: '0987654321',
      site_id: SITE_ONE_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a contact and keeps it attached to the site in the route', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alice Example', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Phone' }).fill('555');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONTACTS_PATH}/contact-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({ name: 'Alice Example', phone: '555', site_id: SITE_ONE_ID }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a contact and reports success', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONTACTS_PATH}/contact-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([contactOneFixture], []);

    await expect.element(screen.getByText('Alice Example', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).not.toBeInTheDocument();
  });
});
