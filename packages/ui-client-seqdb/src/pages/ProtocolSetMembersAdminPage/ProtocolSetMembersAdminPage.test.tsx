import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbProtocolSetMember } from '@gen-epix/api-seqdb';
import {
  SeqDbCommandName,
  SeqDbPermissionType,
} from '@gen-epix/api-seqdb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ProtocolSetMembersAdminPage } from './ProtocolSetMembersAdminPage';

type ProtocolSetMemberFixture = { readonly id: string } & SeqDbProtocolSetMember;

const PROTOCOL_SET_MEMBERS_PATH = '/v1/protocol_set_members';
const PROTOCOL_SETS_PATH = '/v1/protocol_sets';
const PROTOCOLS_PATH = '/v1/protocols';
const ROUTE_PATH = '/management/protocol-set-members';
const URL = '/management/protocol-set-members';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const PROTOCOL_SET_MEMBER_PERMISSIONS = [
  { command_name: SeqDbCommandName.ProtocolSetMemberCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.ProtocolSetMemberCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.ProtocolSetMemberCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const memberAlphaFixture: ProtocolSetMemberFixture = {
  id: 'psm-alpha',
  protocol_id: 'protocol-1',
  protocol_set_id: 'protocol-set-1',
};

const memberBetaFixture: ProtocolSetMemberFixture = {
  id: 'psm-beta',
  protocol_id: 'protocol-2',
  protocol_set_id: 'protocol-set-2',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const mockOptions = () => {
  mockApiRequest('GET', PROTOCOL_SETS_PATH, () => Response.json([
    { code: 'SET-A', id: 'protocol-set-1', name: 'Set One' },
    { code: 'SET-B', id: 'protocol-set-2', name: 'Set Two' },
  ]));
  mockApiRequest('GET', PROTOCOLS_PATH, () => Response.json([
    { id: 'protocol-1', name: 'Protocol One' },
    { code: 'P-2', id: 'protocol-2' },
  ]));
};

const renderPage = async (initialItems: ProtocolSetMemberFixture[] = [memberAlphaFixture, memberBetaFixture]) => {
  mockOptions();
  const mock = mockCrudApi(PROTOCOL_SET_MEMBERS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ProtocolSetMembersAdminPage />, {
      path: ROUTE_PATH,
      permissions: PROTOCOL_SET_MEMBER_PERMISSIONS,
      url: URL,
    },
  );
  return { mock, screen };
};

const renderPageWithRawItems = async (items: object[]) => {
  mockOptions();
  mockApiRequest('GET', PROTOCOL_SET_MEMBERS_PATH, () => Response.json(items));
  return renderRoutedPage(
    <ProtocolSetMembersAdminPage />, {
      path: ROUTE_PATH,
      permissions: PROTOCOL_SET_MEMBER_PERMISSIONS,
      url: URL,
    },
  );
};

describe('ProtocolSetMembersAdminPage', () => {
  it('lists the protocol set members with their protocol set and protocol labels', async () => {
    const { screen } = await renderPage();

    const alphaRow = screen.getByRole('row').filter({ hasText: 'SET-A - Set One' });
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'SET-A - Set One' })).toBeVisible();
    await expect.element(alphaRow.getByRole('cell', { exact: true, name: 'Protocol One' })).toBeVisible();

    const betaRow = screen.getByRole('row').filter({ hasText: 'SET-B - Set Two' });
    await expect.element(betaRow.getByRole('cell', { exact: true, name: 'P-2' })).toBeVisible();
  });

  it('creates a protocol set member and names it by its protocol set and protocol', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-A - Set One' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual({
      protocol_id: 'protocol-1',
      protocol_set_id: 'protocol-set-1',
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('SET-A - Set One - Protocol One')]));
  });

  it('does not save a protocol set member without a protocol set', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'Protocol One' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol set member', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('does not save a protocol set member without a protocol', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-A - Set One' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new protocol set member', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('updates a protocol set member with its new protocol', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SET-A - Set One' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: SET-A - Set One - Protocol One', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Protocol' }).click();
    await screen.getByRole('option', { exact: true, name: 'P-2' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${PROTOCOL_SET_MEMBERS_PATH}/psm-alpha`);
    expect(putCall?.body).toMatchObject({ id: 'psm-alpha', protocol_id: 'protocol-2', protocol_set_id: 'protocol-set-1' });
  });

  it('names an edited protocol set member by the raw protocol set and protocol IDs when they are not in the options', async () => {
    const screen = await renderPageWithRawItems([{ id: 'psm-delta', protocol_id: 'protocol-x', protocol_set_id: 'set-x' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();

    await expect.element(screen.getByText('Edit item: set-x - protocol-x', { exact: true })).toBeVisible();
  });

  it('names an edited protocol set member by its ID when it has neither a protocol set nor a protocol', async () => {
    const screen = await renderPageWithRawItems([{ id: 'psm-gamma', protocol_id: '', protocol_set_id: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Edit' }).click();

    await expect.element(screen.getByText('Edit item: psm-gamma', { exact: true })).toBeVisible();
  });

  it('deletes a protocol set member', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('row').filter({ hasText: 'SET-B - Set Two' }).getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${PROTOCOL_SET_MEMBERS_PATH}/psm-beta`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted')]));
  });

  it('shows an error notification when deleting a protocol set member without an ID', async () => {
    const screen = await renderPageWithRawItems([{ id: null, protocol_id: 'protocol-1', protocol_set_id: 'protocol-set-1' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });

  it('shows an error notification when deleting a protocol set member without an ID or protocol references', async () => {
    const screen = await renderPageWithRawItems([{ id: null, protocol_id: '', protocol_set_id: '' }]);

    await screen.getByRole('button', { name: 'Row actions' }).click();
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
  });
});
