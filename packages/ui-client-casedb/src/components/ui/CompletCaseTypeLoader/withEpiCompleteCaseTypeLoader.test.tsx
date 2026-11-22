import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import {
  COMPLETE_CASE_TYPE_ID,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { withEpiCompleteCaseTypeLoader } from './withEpiCompleteCaseTypeLoader';
import type { WithEpiCompleteCaseTypeLoaderProps } from './withEpiCompleteCaseTypeLoader';

const WRAPPED_TEST_ID = 'wrapped-component';

const WrappedComponent = ({ caseTypeId }: WithEpiCompleteCaseTypeLoaderProps) => (
  <div data-testid={WRAPPED_TEST_ID}>
    {caseTypeId}
  </div>
);

const WithLoader = withEpiCompleteCaseTypeLoader(WrappedComponent);

describe('withEpiCompleteCaseTypeLoader', () => {
  beforeEach(() => {
    mockCompleteCaseTypeLoaderApi();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the wrapped component with the given props once the complete case type is loaded', async () => {
    const screen = await renderComponent(
      <WithLoader caseTypeId={COMPLETE_CASE_TYPE_ID} />,
    );

    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).toHaveTextContent(COMPLETE_CASE_TYPE_ID);
  });

  it('does not render the wrapped component when the complete case type cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', () => Response.json({ detail: 'Case type failure' }, { status: 500 }));

    const screen = await renderComponent(
      <WithLoader caseTypeId={COMPLETE_CASE_TYPE_ID} />,
    );

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).not.toBeInTheDocument();
  });
});
