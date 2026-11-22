import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import { RouterService } from '@gen-epix/ui-client-common/classes/services/RouterService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';

import { CaseDbApp } from './CaseDbApp';

const FEATURE_FLAGS_RESPONSE = {
  feature_flags: {},
};

const registerRouter = () => {
  container.registerInstance(
    RouterService,
    new RouterService({
      adminRoutes: [],
      homePageComponent: () => (
        <div>
          {'Home page'}
        </div>
      ),
      routes: [
        {
          element: (
            <div>
              {'Application routes'}
            </div>
          ),
          path: '/',
        },
      ],
    }),
  );
};

describe('CaseDbApp', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the application routes once the feature flags have loaded', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();

    const screen = await renderComponent(
      <CaseDbApp />,
    );

    await expect.element(screen.getByText('Application routes')).toBeInTheDocument();
  });
});
