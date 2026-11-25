import { container } from 'tsyringe';
import type { CommonDbUser } from '@gen-epix/api-commondb';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { FeatureFlagsService } from '../../../classes/services/FeatureFlagsService';
import {
  createOrganization,
  mockOrganizations,
  renderComponent,
} from '../../../test/lib';

import { ApplicationBarActionsOrganizationSwitcherItem } from './ApplicationBarActionsOrganizationSwitcherItem';

const DIALOG_TITLE = 'Switch organization';

const USER: CommonDbUser = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: [],
};

describe('ApplicationBarActionsOrganizationSwitcherItem', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).user = USER;
    mockOrganizations([
      createOrganization(),
      createOrganization({
        code: 'other',
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Other organization',
      }),
    ]);
  });

  afterEach(() => {
    container.resolve(FeatureFlagsService).featureFlags = {};
  });

  it('renders nothing when the own organization update feature flag is disabled', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { update_own_organization: false };
    const screen = await renderComponent(
      <ApplicationBarActionsOrganizationSwitcherItem />,
    );

    expect(screen.getByTitle('Change organization').query()).toBeNull();
    expect(screen.getByText(DIALOG_TITLE).query()).toBeNull();
  });

  it('renders the change organization button when the feature flag is enabled', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { update_own_organization: true };
    const screen = await renderComponent(
      <ApplicationBarActionsOrganizationSwitcherItem />,
    );

    await expect.element(screen.getByRole('button', { name: 'Change organization' })).toBeVisible();
  });

  it('opens the organization switcher dialog when the change organization button is clicked', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { update_own_organization: true };
    const screen = await renderComponent(
      <ApplicationBarActionsOrganizationSwitcherItem />,
    );

    expect(screen.getByText(DIALOG_TITLE).query()).toBeNull();

    await screen.getByRole('button', { name: 'Change organization' }).click();

    await expect.element(screen.getByText(DIALOG_TITLE)).toBeVisible();
  });

  it('closes the organization switcher dialog when the close button is clicked', async () => {
    container.resolve(FeatureFlagsService).featureFlags = { update_own_organization: true };
    const screen = await renderComponent(
      <ApplicationBarActionsOrganizationSwitcherItem />,
    );

    await screen.getByRole('button', { name: 'Change organization' }).click();
    await expect.element(screen.getByText(DIALOG_TITLE)).toBeVisible();

    await screen.getByTestId('OrganizationSwitcherDialog-close').click();

    await expect.poll(() => screen.getByText(DIALOG_TITLE).query()).toBeNull();
  });
});
