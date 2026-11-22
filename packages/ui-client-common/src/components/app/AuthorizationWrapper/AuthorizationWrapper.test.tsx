import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { AuthorizationWrapper } from './AuthorizationWrapper';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

const PERMISSIONS: CommonDbApiPermission[] = [
  {
    command_name: CommonDbCommandName.OrganizationCrudCommand,
    permission_type: CommonDbPermissionType.READ,
  },
];

const createRouter = (requiresUserProfile: boolean) => createMemoryRouter([
  {
    element: (
      <AuthorizationWrapper>
        <div>
          {'Protected content'}
        </div>
      </AuthorizationWrapper>
    ),
    handle: { requiresUserProfile },
    path: '/',
  },
]);

describe('AuthorizationWrapper', () => {
  it('renders children without loading the user profile when the route does not require it', async () => {
    const screen = await renderComponent(
      <RouterProvider router={createRouter(false)} />,
    );

    await expect.element(screen.getByText('Protected content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('LoadingUserDataPage')).not.toBeInTheDocument();
  });

  it('loads the user and permissions and renders children when the route requires a user profile', async () => {
    mockApiRequest('GET', '/v1/user_me', () => Response.json(USER));
    mockApiRequest('GET', '/v1/user_me/permissions', () => Response.json(PERMISSIONS));

    const screen = await renderComponent(
      <RouterProvider router={createRouter(true)} />,
    );

    await expect.element(screen.getByText('Protected content')).toBeInTheDocument();
    expect(container.resolve(AuthorizationService).user).toEqual(USER);
    expect(container.resolve(AuthorizationService).apiPermissions).toEqual(PERMISSIONS);
  });

  it('shows the loading user data page until the profile requests have completed', async () => {
    let releaseRequests: () => void = () => undefined;
    const requestsReleased = new Promise<void>((resolve) => {
      releaseRequests = resolve;
    });
    mockApiRequest('GET', '/v1/user_me', async () => {
      await requestsReleased;
      return Response.json(USER);
    });
    mockApiRequest('GET', '/v1/user_me/permissions', async () => {
      await requestsReleased;
      return Response.json(PERMISSIONS);
    });

    const screen = await renderComponent(
      <RouterProvider router={createRouter(true)} />,
    );

    await expect.element(screen.getByTestId('LoadingUserDataPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();

    releaseRequests();

    await expect.element(screen.getByText('Protected content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('LoadingUserDataPage')).not.toBeInTheDocument();
  });

  it('keeps the loading user data page and hides children when a profile request fails', async () => {
    mockApiRequest('GET', '/v1/user_me', () => Response.json({ detail: 'Server error' }, { status: 500 }));
    mockApiRequest('GET', '/v1/user_me/permissions', () => Response.json(PERMISSIONS));

    const screen = await renderComponent(
      <RouterProvider router={createRouter(true)} />,
    );

    await expect.element(screen.getByTestId('LoadingUserDataPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Protected content')).not.toBeInTheDocument();
  });
});
