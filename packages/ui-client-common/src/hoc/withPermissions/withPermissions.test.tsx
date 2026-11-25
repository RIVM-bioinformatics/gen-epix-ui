import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../classes/services/AuthorizationService';
import { renderComponent } from '../../test/lib';

import { withPermissions } from './withPermissions';

const READ_ORGANIZATION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.OrganizationCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const UPDATE_SITE: CommonDbApiPermission = {
  command_name: CommonDbCommandName.SiteCrudCommand,
  permission_type: CommonDbPermissionType.UPDATE,
};

const ProtectedComponent = ({ label }: { readonly label: string }) => (
  <div>
    {`Protected ${label}`}
  </div>
);

describe('withPermissions', () => {
  it('renders the wrapped component with its props when the user has the required permissions', async () => {
    container.resolve(AuthorizationService).apiPermissions = [READ_ORGANIZATION, UPDATE_SITE];
    const Wrapped = withPermissions(ProtectedComponent, { requiredPermissions: [READ_ORGANIZATION] });

    const screen = await renderComponent(
      <Wrapped label={'value'} />,
    );

    await expect.element(screen.getByText('Protected value')).toBeVisible();
  });

  it('renders nothing when the user lacks the required permissions and no fallback is given', async () => {
    container.resolve(AuthorizationService).apiPermissions = [UPDATE_SITE];
    const Wrapped = withPermissions(ProtectedComponent, { requiredPermissions: [READ_ORGANIZATION] });

    const screen = await renderComponent(
      <Wrapped label={'value'} />,
    );

    await expect.element(screen.getByText('Protected value')).not.toBeInTheDocument();
  });

  it('renders the fallback component when the user lacks the required permissions', async () => {
    container.resolve(AuthorizationService).apiPermissions = [];
    const Wrapped = withPermissions(ProtectedComponent, {
      fallback: () => 'Access denied',
      requiredPermissions: [READ_ORGANIZATION],
    });

    const screen = await renderComponent(
      <Wrapped label={'value'} />,
    );

    await expect.element(screen.getByText('Access denied')).toBeVisible();
    await expect.element(screen.getByText('Protected value')).not.toBeInTheDocument();
  });

  it('renders the wrapped component instead of the fallback when the user has the required permissions', async () => {
    container.resolve(AuthorizationService).apiPermissions = [READ_ORGANIZATION];
    const Wrapped = withPermissions(ProtectedComponent, {
      fallback: () => 'Access denied',
      requiredPermissions: [READ_ORGANIZATION],
    });

    const screen = await renderComponent(
      <Wrapped label={'value'} />,
    );

    await expect.element(screen.getByText('Protected value')).toBeVisible();
    await expect.element(screen.getByText('Access denied')).not.toBeInTheDocument();
  });

  it('sets a display name that includes the wrapped component name', () => {
    const Wrapped = withPermissions(ProtectedComponent, { requiredPermissions: [] });
    expect(Wrapped.displayName).toBe('withPermissions(ProtectedComponent)');
  });

  it('uses the displayName of the wrapped component when it is set', () => {
    const NamedComponent = Object.assign((): null => null, { displayName: 'CustomName' });
    const Wrapped = withPermissions(NamedComponent, { requiredPermissions: [] });
    expect(Wrapped.displayName).toBe('withPermissions(CustomName)');
  });
});
