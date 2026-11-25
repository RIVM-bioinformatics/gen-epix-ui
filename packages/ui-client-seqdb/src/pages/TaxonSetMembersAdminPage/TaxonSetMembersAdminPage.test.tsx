import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type { SeqDbTaxonSetMember } from '@gen-epix/api-seqdb';
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

import { TaxonSetMembersAdminPage } from './TaxonSetMembersAdminPage';

type TaxonSetMemberFixture = { readonly id: null | string } & Partial<Omit<SeqDbTaxonSetMember, 'id'>>;

const TAXON_SET_MEMBERS_PATH = '/v1/taxon_set_members';
const TAXON_SETS_PATH = '/v1/taxon_sets';
const TAXA_PATH = '/v1/taxa';
const ROUTE_PATH = '/management/taxon-set-members';
const URL = '/management/taxon-set-members';

// Seq DB command names are not members of the Common DB union that renderRoutedPage expects; the runtime strings are identical.
const TAXON_SET_MEMBER_PERMISSIONS = [
  { command_name: SeqDbCommandName.TaxonSetMemberCrudCommand, permission_type: SeqDbPermissionType.CREATE },
  { command_name: SeqDbCommandName.TaxonSetMemberCrudCommand, permission_type: SeqDbPermissionType.UPDATE },
  { command_name: SeqDbCommandName.TaxonSetMemberCrudCommand, permission_type: SeqDbPermissionType.DELETE },
] as unknown as CommonDbApiPermission[];

const taxonSetsFixture = [
  { code: 'SET-A', id: 'set-1', name: 'Set alpha' },
  { code: 'SET-B', id: 'set-2', name: 'Set beta' },
];

const taxaFixture = [
  { code: 'TAXON-1', id: 'taxon-1', name: 'Taxon one' },
  { code: 'TAXON-2', id: 'taxon-2', name: 'Taxon two' },
];

const memberAlphaFixture: TaxonSetMemberFixture = {
  id: 'member-alpha',
  taxon_id: 'taxon-1',
  taxon_set_id: 'set-1',
};

const memberUnknownFixture: TaxonSetMemberFixture = {
  id: 'member-unknown',
  taxon_id: 'taxon-unknown',
  taxon_set_id: 'set-unknown',
};

const memberIdOnlyFixture: TaxonSetMemberFixture = {
  id: 'member-id-only',
  taxon_id: '',
  taxon_set_id: '',
};

const memberNoIdFixture: TaxonSetMemberFixture = {
  id: null,
  taxon_id: '',
  taxon_set_id: '',
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: TaxonSetMemberFixture[] = [memberAlphaFixture, memberUnknownFixture],
  permissions: CommonDbApiPermission[] = TAXON_SET_MEMBER_PERMISSIONS,
) => {
  mockApiRequest('GET', TAXON_SETS_PATH, () => Response.json(taxonSetsFixture));
  mockApiRequest('GET', TAXA_PATH, () => Response.json(taxaFixture));
  const mock = mockCrudApi(TAXON_SET_MEMBERS_PATH, initialItems as ({ readonly id: string } & SeqDbTaxonSetMember)[]);
  const screen = await renderRoutedPage(
    <TaxonSetMembersAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { mock, screen };
};

/**
 * Overrides the POST handler of mockCrudApi so that the response can be shaped per test.
 */
const mockTaxonSetMemberPost = (responseBody: (body: Partial<SeqDbTaxonSetMember>) => unknown) => {
  const postBodies: Partial<SeqDbTaxonSetMember>[] = [];
  mockApiRequest('POST', TAXON_SET_MEMBERS_PATH, async (request) => {
    const body = await request.json() as Partial<SeqDbTaxonSetMember>;
    postBodies.push(body);
    return Response.json(responseBody(body), { status: 201 });
  });
  return postBodies;
};

const openRowMenuItem = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], menuItemName: string) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
  await screen.getByRole('menuitem', { exact: true, name: menuItemName }).click();
};

describe('TaxonSetMembersAdminPage', () => {
  it('lists the members with the labels of their taxon set and taxon', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'SET-A - Set alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'TAXON-1 - Taxon one' })).toBeInTheDocument();
  });

  it('creates a member with the selected taxon set and taxon', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockTaxonSetMemberPost(body => ({ ...body, id: 'created-member' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new taxon set member', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Taxon set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-B - Set beta' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Taxon' }).click();
    await screen.getByRole('option', { exact: true, name: 'TAXON-2 - Taxon two' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => postBodies.length).toBe(1);
    expect(postBodies[0]).toEqual(expect.objectContaining({ taxon_id: 'taxon-2', taxon_set_id: 'set-2' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('SET-B - Set beta - TAXON-2 - Taxon two')]));
  });

  it('does not create a member when the taxon is missing', async () => {
    const { screen } = await renderPage([]);
    const postBodies = mockTaxonSetMemberPost(body => ({ ...body, id: 'created-member' }));

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Taxon set' }).click();
    await screen.getByRole('option', { exact: true, name: 'SET-B - Set beta' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new taxon set member', { exact: true })).toBeVisible();
    expect(postBodies).toHaveLength(0);
  });

  it('updates a member with the newly selected taxon', async () => {
    const { mock, screen } = await renderPage([memberAlphaFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: SET-A - Set alpha - TAXON-1 - Taxon one', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { exact: true, name: 'Taxon' }).click();
    await screen.getByRole('option', { exact: true, name: 'TAXON-2 - Taxon two' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${TAXON_SET_MEMBERS_PATH}/member-alpha`);
    expect(putCall?.body).toMatchObject({ id: 'member-alpha', taxon_id: 'taxon-2', taxon_set_id: 'set-1' });
  });

  it('names an edited member by the raw IDs when its taxon set and taxon are not in the options', async () => {
    const { screen } = await renderPage([memberUnknownFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: set-unknown - taxon-unknown', { exact: true })).toBeVisible();
  });

  it('names an edited member by its ID when it has no taxon set or taxon', async () => {
    const { screen } = await renderPage([memberIdOnlyFixture]);

    await openRowMenuItem(screen, 'Edit');
    await expect.element(screen.getByText('Edit item: member-id-only', { exact: true })).toBeVisible();
  });

  it('deletes a member', async () => {
    const { mock, screen } = await renderPage([memberAlphaFixture]);

    await openRowMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${TAXON_SET_MEMBERS_PATH}/member-alpha`);
  });

  it('shows an error notification and does not call the API when deleting a member without an ID', async () => {
    const { mock, screen } = await renderPage([memberNoIdFixture]);

    await openRowMenuItem(screen, 'Delete');
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('could not be deleted')]));
    expect(mock.calls.filter(({ method }) => method === 'DELETE')).toHaveLength(0);
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([memberAlphaFixture], []);
    await expect.element(screen.getByRole('cell', { exact: true, name: 'SET-A - Set alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
