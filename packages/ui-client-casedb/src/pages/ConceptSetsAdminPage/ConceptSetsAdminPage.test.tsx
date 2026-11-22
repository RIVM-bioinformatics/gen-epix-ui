import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbConceptSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbConceptSetType,
  CaseDbPermissionType,
  CaseDbUnit,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ConceptSetsAdminPage } from './ConceptSetsAdminPage';

const CONCEPT_SETS_PATH = '/v1/concept_sets';
const ROUTE_PATH = '/management/concept-sets';

const CONCEPT_SET_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.ConceptSetCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const CONCEPT_READ_PERMISSION: CaseDbApiPermission = {
  command_name: CaseDbCommandName.ConceptCrudCommand,
  permission_type: CaseDbPermissionType.READ,
};

type ConceptSetFixture = { readonly id: string } & CaseDbConceptSet;

const nominalFixture: ConceptSetFixture = {
  code: 'NOMINAL_CODE',
  id: 'concept-set-nominal',
  name: 'Nominal set',
  type: CaseDbConceptSetType.NOMINAL,
};

const intervalFixture: ConceptSetFixture = {
  code: 'INTERVAL_CODE',
  description: 'Interval description',
  id: 'concept-set-interval',
  name: 'Interval set',
  type: CaseDbConceptSetType.INTERVAL,
  unit: CaseDbUnit.DAY,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: ConceptSetFixture[] = [nominalFixture, intervalFixture],
  permissions: CaseDbApiPermission[] = [...CONCEPT_SET_PERMISSIONS, CONCEPT_READ_PERMISSION],
) => {
  const mock = mockCrudApi(CONCEPT_SETS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <ConceptSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: ROUTE_PATH,
    },
  );
  return { mock, screen };
};

const openRowActionsFor = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], rowName: string) => {
  const row = screen.getByRole('row').filter({ hasText: rowName });
  await row.getByRole('button', { name: 'Row actions' }).click();
};

describe('ConceptSetsAdminPage', () => {
  it('lists the concept sets with their name and type', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Nominal set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Interval set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: CaseDbConceptSetType.INTERVAL })).toBeInTheDocument();
  });

  it('creates a nominal concept set and clears the unit', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new concept set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('New set');
    await screen.getByRole('textbox', { name: 'Code' }).fill('NEW_CODE');
    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.NOMINAL }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CONCEPT_SETS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      code: 'NEW_CODE',
      name: 'New set',
      type: CaseDbConceptSetType.NOMINAL,
    }));
    expect((postCall?.body as { unit?: unknown }).unit ?? null).toBeNull();
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('enables the unit only for interval concept sets', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.NOMINAL }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toBeDisabled();

    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.INTERVAL }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toBeEnabled();
  });

  it('creates an interval concept set with a unit', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Interval new');
    await screen.getByRole('textbox', { name: 'Code' }).fill('INTERVAL_NEW');
    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.INTERVAL }).click();
    await screen.getByRole('combobox', { name: 'Unit' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbUnit.WEEK }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      name: 'Interval new',
      type: CaseDbConceptSetType.INTERVAL,
      unit: CaseDbUnit.WEEK,
    }));
  });

  it('requires a unit for interval concept sets', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Interval without unit');
    await screen.getByRole('textbox', { name: 'Code' }).fill('NO_UNIT');
    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.INTERVAL }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText(/unit/i).first()).toBeInTheDocument();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('edits a concept set and saves the changes', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionsFor(screen, 'Nominal set');
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Nominal set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Renamed set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CONCEPT_SETS_PATH}/concept-set-nominal`);
    expect(putCall?.body).toEqual(expect.objectContaining({ name: 'Renamed set', type: CaseDbConceptSetType.NOMINAL }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('disables the unit for a non-interval concept set when editing', async () => {
    const { screen } = await renderPage();

    await openRowActionsFor(screen, 'Nominal set');
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toBeDisabled();
  });

  it('clears the unit when an interval concept set changes to another type', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionsFor(screen, 'Interval set');
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toBeEnabled();
    await screen.getByRole('combobox', { name: 'Type' }).click();
    await screen.getByRole('option', { exact: true, name: CaseDbConceptSetType.ORDINAL }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Unit' })).toBeDisabled();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'PUT')?.body).toEqual(expect.objectContaining({
      type: CaseDbConceptSetType.ORDINAL,
      unit: null,
    }));
  });

  it('deletes a concept set', async () => {
    const { mock, screen } = await renderPage();

    await openRowActionsFor(screen, 'Nominal set');
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CONCEPT_SETS_PATH}/concept-set-nominal`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('shows the manage concepts sub page when the user can read concepts', async () => {
    const { screen } = await renderPage();

    await openRowActionsFor(screen, 'Nominal set');
    await expect.element(screen.getByRole('menuitem', { name: 'Manage concepts' })).toBeInTheDocument();
  });

  it('navigates to the manage concepts sub page of the concept set', async () => {
    const { screen } = await renderPage();

    await openRowActionsFor(screen, 'Nominal set');
    await screen.getByRole('menuitem', { name: 'Manage concepts' }).click();

    await expect.poll(() => window.location.pathname).toBe('/management/concept-sets/concept-set-nominal/concepts');
  });

  it('hides the manage concepts sub page without concept read permission', async () => {
    const { screen } = await renderPage([nominalFixture], CONCEPT_SET_PERMISSIONS);

    await openRowActionsFor(screen, 'Nominal set');
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage concepts' }).query()).toBeNull();
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([nominalFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Nominal set' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
