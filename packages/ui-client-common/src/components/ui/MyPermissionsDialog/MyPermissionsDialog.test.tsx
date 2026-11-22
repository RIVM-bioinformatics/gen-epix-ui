import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { createRef } from 'react';
import { container } from 'tsyringe';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { renderComponent } from '../../../test/lib';

import { MyPermissionsDialog } from './MyPermissionsDialog';
import type { MyPermissionsDialogRefMethods } from './MyPermissionsDialog';

const renderDialog = async (permissions: CommonDbApiPermission[]) => {
  container.resolve(AuthorizationService).apiPermissions = permissions;
  const ref = createRef<MyPermissionsDialogRefMethods>();
  const screen = await renderComponent(
    <MyPermissionsDialog ref={ref} />,
  );
  ref.current?.open({});
  return screen;
};

const readRows = () => Array.from(document.querySelectorAll('tbody tr')).map((row) => {
  return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent);
});

describe('MyPermissionsDialog', () => {
  it('shows the title and the table headers', async () => {
    const screen = await renderDialog([]);

    await expect.element(screen.getByRole('heading', { name: 'My Permissions' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect.element(screen.getByRole('columnheader', { name: 'Permission' })).toBeVisible();
  });

  it('shows no rows when the user has no api permissions', async () => {
    const screen = await renderDialog([]);

    await expect.element(screen.getByTestId('MyPermissionsDialog')).toBeVisible();
    expect(readRows()).toEqual([]);
  });

  it('translates each permission type into a readable label', async () => {
    const screen = await renderDialog([
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.CREATE },
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.DELETE },
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.EXECUTE },
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.READ },
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
    ]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Create' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Delete' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Execute' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Read' })).toBeVisible();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Update' })).toBeVisible();
  });

  it('sorts the permissions by command name', async () => {
    await renderDialog([
      { command_name: CommonDbCommandName.ContactCrudCommand, permission_type: CommonDbPermissionType.READ },
      { command_name: CommonDbCommandName.AnonymizeUserCommand, permission_type: CommonDbPermissionType.EXECUTE },
      { command_name: CommonDbCommandName.DataCollectionCrudCommand, permission_type: CommonDbPermissionType.UPDATE },
    ]);

    await expect.poll(readRows).toEqual([
      [CommonDbCommandName.AnonymizeUserCommand, 'Execute'],
      [CommonDbCommandName.ContactCrudCommand, 'Read'],
      [CommonDbCommandName.DataCollectionCrudCommand, 'Update'],
    ]);
  });
});
