import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import {
  COMPLETE_CASE_TYPE_DESCRIPTION,
  COMPLETE_CASE_TYPE_ID,
  COMPLETE_CASE_TYPE_NAME,
  createCompleteCaseType,
  mockCompleteCaseTypeLoaderApi,
} from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { CompletCaseTypeLoader } from './CompletCaseTypeLoader';

const CHILD_TEST_ID = 'loaded-child';

describe('CompletCaseTypeLoader', () => {
  beforeEach(() => {
    mockCompleteCaseTypeLoaderApi();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the children once the complete case type and its side-effect data are loaded', async () => {
    const screen = await renderComponent(
      <CompletCaseTypeLoader caseTypeId={COMPLETE_CASE_TYPE_ID}>
        <div data-testid={CHILD_TEST_ID}>
          {COMPLETE_CASE_TYPE_DESCRIPTION}
        </div>
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toHaveTextContent(COMPLETE_CASE_TYPE_DESCRIPTION);
  });

  it('calls onCompleteCaseTypeLoaded with the loaded complete case type', async () => {
    const onCompleteCaseTypeLoaded = vi.fn();
    const screen = await renderComponent(
      <CompletCaseTypeLoader
        caseTypeId={COMPLETE_CASE_TYPE_ID}
        onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
      >
        <div data-testid={CHILD_TEST_ID} />
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument();
    expect(onCompleteCaseTypeLoaded).toHaveBeenCalledTimes(1);
    expect(onCompleteCaseTypeLoaded).toHaveBeenCalledWith(expect.objectContaining({
      id: COMPLETE_CASE_TYPE_ID,
      name: COMPLETE_CASE_TYPE_NAME,
    }));
  });

  it('shows an error and hides the children when the complete case type cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', () => Response.json({ detail: 'Case type failure' }, { status: 500 }));

    const screen = await renderComponent(
      <CompletCaseTypeLoader caseTypeId={COMPLETE_CASE_TYPE_ID}>
        <div data-testid={CHILD_TEST_ID} />
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId(CHILD_TEST_ID)).not.toBeInTheDocument();
  });

  it('shows an error and hides the children when side-effect data cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/organizations', () => Response.json({ detail: 'Organizations failure' }, { status: 500 }));

    const screen = await renderComponent(
      <CompletCaseTypeLoader caseTypeId={COMPLETE_CASE_TYPE_ID}>
        <div data-testid={CHILD_TEST_ID} />
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId(CHILD_TEST_ID)).not.toBeInTheDocument();
  });

  it('ignores a canceled side-effect request when the loader is unmounted', async () => {
    mockApiRequest('GET', '/v1/organizations', async () => new Promise<Response>(() => undefined));

    const screen = await renderComponent(
      <CompletCaseTypeLoader caseTypeId={COMPLETE_CASE_TYPE_ID}>
        <div data-testid={CHILD_TEST_ID} />
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByText('Loading case type')).toBeInTheDocument();
    await screen.unmount();
  });

  it('loads the complete case type without an onCompleteCaseTypeLoaded callback', async () => {
    mockCompleteCaseTypeLoaderApi(createCompleteCaseType({ description: 'Other description' }));

    const screen = await renderComponent(
      <CompletCaseTypeLoader caseTypeId={COMPLETE_CASE_TYPE_ID}>
        <div data-testid={CHILD_TEST_ID}>
          {'Other description'}
        </div>
      </CompletCaseTypeLoader>,
    );

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toHaveTextContent('Other description');
  });
});
