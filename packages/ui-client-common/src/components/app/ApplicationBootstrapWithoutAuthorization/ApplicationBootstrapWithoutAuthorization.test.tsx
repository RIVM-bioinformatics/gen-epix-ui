import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { FeatureFlagsService } from '../../../classes/services/FeatureFlagsService';
import { I18nService } from '../../../classes/services/I18nService';
import {
  mockApiRequest,
  registerWindowServiceReloadSpy,
  renderComponent,
} from '../../../test/lib';

import { ApplicationBootstrapWithoutAuthorization } from './ApplicationBootstrapWithoutAuthorization';

const FEATURE_FLAGS_RESPONSE = {
  feature_flags: {
    SOME_FEATURE: true,
  },
};

describe('ApplicationBootstrapWithoutAuthorization', () => {
  it('loads the feature flags and renders children', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    expect(container.resolve(FeatureFlagsService).featureFlags).toEqual(FEATURE_FLAGS_RESPONSE.feature_flags);
  });

  it('hides children until the feature flags have loaded', async () => {
    let releaseRequest: () => void = () => undefined;
    const requestReleased = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    mockApiRequest('GET', '/v1/retrieve/feature_flags', async () => {
      await requestReleased;
      return Response.json(FEATURE_FLAGS_RESPONSE);
    });

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );

    await expect.element(screen.getByText('Application content')).not.toBeInTheDocument();

    releaseRequest();

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
  });

  it('renders the error page when the feature flags cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json({ detail: 'Server error' }, { status: 500 }));

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );

    await expect.element(screen.getByTestId('ErrorPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Application content')).not.toBeInTheDocument();
  });

  it('reloads the application after the user confirms a language change', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    const reload = registerWindowServiceReloadSpy();

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );
    await expect.element(screen.getByText('Application content')).toBeInTheDocument();

    container.resolve(I18nService).emit('onUserLanguageChange', 'nl');

    await expect.element(screen.getByText('Are you sure?')).toBeInTheDocument();
    await screen.getByRole('button', { name: 'Change language' }).click();

    await expect.element(screen.getByTestId('LanguageChangingPage')).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('keeps the application and does not reload when the user cancels a language change', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    const reload = registerWindowServiceReloadSpy();

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );
    await expect.element(screen.getByText('Application content')).toBeInTheDocument();

    container.resolve(I18nService).emit('onUserLanguageChange', 'nl');

    await expect.element(screen.getByText('Are you sure?')).toBeInTheDocument();
    await screen.getByRole('button', { name: 'Cancel' }).click();

    await expect.element(screen.getByText('Are you sure?')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('LanguageChangingPage')).not.toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not switch language or reload when the language change event carries an empty code', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    const reload = registerWindowServiceReloadSpy();

    const screen = await renderComponent(
      <ApplicationBootstrapWithoutAuthorization>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithoutAuthorization>,
    );
    await expect.element(screen.getByText('Application content')).toBeInTheDocument();

    container.resolve(I18nService).emit('onUserLanguageChange', '');

    await expect.element(screen.getByText('Are you sure?')).toBeInTheDocument();
    await screen.getByRole('button', { name: 'Change language' }).click();

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('LanguageChangingPage')).not.toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });
});
