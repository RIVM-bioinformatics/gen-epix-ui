import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import { userEvent } from 'vitest/browser';

import { AuthenticationService } from '../../classes/services/AuthenticationService';
import type { IdentityProviderWithAvailability } from '../../models/auth.models';
import type { ConfigBase } from '../../models/config.models';
import { renderComponent } from '../../test/lib';
import { DependencyContainerUtil } from '../../utils/DependencyContainerUtil';

import { ChooseIdentityProviderPage } from './ChooseIdentityProviderPage';

const NO_PROVIDERS_TITLE = 'No identity providers are currently available. Please try again later.';
const SOME_UNAVAILABLE_TITLE = 'Some identity providers are currently unavailable.';
const UNAVAILABLE_TOOLTIP = 'This identity provider is currently unavailable. Please try again later.';
const LOGIN_PROMPT = 'Please login with one of the following identity providers:';

const createIdentityProviderWithAvailability = (
  name: string,
  isAvailable: boolean,
): IdentityProviderWithAvailability => ({
  isAvailable,
  provider: {
    auth_protocol: 'OIDC',
    issuer: `https://${name}.example.com`,
    label: `${name} label`,
    name,
  },
});

const AVAILABLE_PROVIDER = createIdentityProviderWithAvailability('available', true);
const OTHER_AVAILABLE_PROVIDER = createIdentityProviderWithAvailability('other', true);
const UNAVAILABLE_PROVIDER = createIdentityProviderWithAvailability('unavailable', false);

const renderChooseIdentityProviderPage = async (
  identityProvidersWithAvailability: IdentityProviderWithAvailability[],
  configure?: (config: ConfigBase) => void,
) => renderComponent(
  <ChooseIdentityProviderPage identityProvidersWithAvailability={identityProvidersWithAvailability} />,
  { configure },
);

describe('ChooseIdentityProviderPage', () => {
  afterEach(() => {
    DependencyContainerUtil.resolveConfig().login = undefined;
    vi.restoreAllMocks();
  });

  it('shows an error alert when no identity provider is available', async () => {
    const screen = await renderChooseIdentityProviderPage([UNAVAILABLE_PROVIDER]);

    await expect.element(screen.getByText(NO_PROVIDERS_TITLE)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Refresh' })).toBeVisible();
    await expect.element(screen.getByText(SOME_UNAVAILABLE_TITLE)).not.toBeInTheDocument();
  });

  it('shows an error alert when the list of identity providers is empty', async () => {
    const screen = await renderChooseIdentityProviderPage([]);

    await expect.element(screen.getByText(NO_PROVIDERS_TITLE)).toBeVisible();
    await expect.element(screen.getByText(LOGIN_PROMPT)).toBeVisible();
  });

  it('shows an info alert when only some identity providers are available', async () => {
    const screen = await renderChooseIdentityProviderPage([
      AVAILABLE_PROVIDER,
      UNAVAILABLE_PROVIDER,
    ]);

    await expect.element(screen.getByText(SOME_UNAVAILABLE_TITLE)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Refresh' })).toBeVisible();
    await expect.element(screen.getByText(NO_PROVIDERS_TITLE)).not.toBeInTheDocument();
  });

  it('shows no alert when all identity providers are available', async () => {
    const screen = await renderChooseIdentityProviderPage([
      AVAILABLE_PROVIDER,
      OTHER_AVAILABLE_PROVIDER,
    ]);

    await expect.element(screen.getByText(LOGIN_PROMPT)).toBeVisible();
    await expect.element(screen.getByText(NO_PROVIDERS_TITLE)).not.toBeInTheDocument();
    await expect.element(screen.getByText(SOME_UNAVAILABLE_TITLE)).not.toBeInTheDocument();
  });

  it('renders an enabled button for each available identity provider', async () => {
    const screen = await renderChooseIdentityProviderPage([
      AVAILABLE_PROVIDER,
      OTHER_AVAILABLE_PROVIDER,
    ]);

    await expect.element(screen.getByRole('button', { name: 'available label' })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'other label' })).toBeEnabled();
  });

  it('renders a disabled button with an unavailable tooltip for unavailable identity providers', async () => {
    const screen = await renderChooseIdentityProviderPage([
      AVAILABLE_PROVIDER,
      UNAVAILABLE_PROVIDER,
    ]);

    const unavailableButton = screen.getByRole('button', { name: 'unavailable label' });
    await expect.element(unavailableButton).toBeDisabled();

    const wrapper = unavailableButton.element().closest('span');
    if (!wrapper) {
      throw new Error('Tooltip wrapper span not found');
    }
    await userEvent.hover(wrapper);
    await expect.element(screen.getByText(UNAVAILABLE_TOOLTIP)).toBeVisible();
  });

  it('starts the login with the identity provider of the clicked button', async () => {
    const nextSpy = vi.spyOn(container.resolve(AuthenticationService), 'next').mockImplementation(() => undefined);
    const screen = await renderChooseIdentityProviderPage([
      AVAILABLE_PROVIDER,
      OTHER_AVAILABLE_PROVIDER,
    ]);

    await screen.getByRole('button', { name: 'other label' }).click();

    expect(nextSpy).toHaveBeenCalledTimes(1);
    expect(nextSpy).toHaveBeenCalledWith(OTHER_AVAILABLE_PROVIDER.provider);
  });

  it('renders the configured element after the identity provider selection', async () => {
    const screen = await renderChooseIdentityProviderPage(
      [AVAILABLE_PROVIDER],
      (config) => {
        config.login = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          AfterIdentityProviderSelection: () => (
            <div>
              {'After identity provider selection'}
            </div>
          ),
        };
      },
    );

    await expect.element(screen.getByText('After identity provider selection')).toBeVisible();
  });

  it('renders no element after the identity provider selection when none is configured', async () => {
    const screen = await renderChooseIdentityProviderPage([AVAILABLE_PROVIDER]);

    await expect.element(screen.getByText('After identity provider selection')).not.toBeInTheDocument();
  });
});
