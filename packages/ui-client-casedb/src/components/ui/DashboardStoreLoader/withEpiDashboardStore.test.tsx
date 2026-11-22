import { container } from 'tsyringe';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { use } from 'react';
import { useStore } from 'zustand';
import type { CaseDbCaseSet } from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import {
  clearDashboardStorage,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  CASE_SET_FIXTURE_ID,
  createCaseSet,
} from '../../../test/fixtures/caseSet';
import { COMPLETE_CASE_TYPE_ID } from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import type { WithEpiDashboardStoreProps } from './withEpiDashboardStore';
import { withEpiDashboardStore } from './withEpiDashboardStore';

const WRAPPED_TEST_ID = 'with-epi-dashboard-store-wrapped';
const NO_CASE_SET_TEXT = 'no case set';
const WRAPPED_LABEL = 'Wrapped panel';

type WrappedProbeProps = {
  readonly label: string;
} & WithEpiDashboardStoreProps;

const WrappedProbe = (props: WrappedProbeProps) => {
  const store = use(DashboardStoreContext);
  const caseSetId = useStore(store, (state) => state.caseSetId);
  return (
    <div {...TestIdUtil.createAttributes(WRAPPED_TEST_ID)}>
      {`${props.label}|${props.caseTypeId}|${caseSetId ?? NO_CASE_SET_TEXT}`}
    </div>
  );
};

const WithStoreWrappedProbe = withEpiDashboardStore(WrappedProbe);

const renderWithEpiDashboardStore = async (caseSet?: CaseDbCaseSet) => {
  return renderComponent(
    <WithStoreWrappedProbe
      caseSet={caseSet}
      caseTypeId={COMPLETE_CASE_TYPE_ID}
      label={WRAPPED_LABEL}
    />,
  );
};

describe('withEpiDashboardStore', () => {
  beforeEach(() => {
    mockDashboardApi();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    clearDashboardStorage();
  });

  it('shows a loading message and hides the wrapped component while the complete case type is loading', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', async () => new Promise<Response>(() => undefined));

    const screen = await renderWithEpiDashboardStore(createCaseSet());

    await expect.element(screen.getByText('Loading case type')).toBeInTheDocument();
    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders the wrapped component with its props and a dashboard store for the given case set', async () => {
    const screen = await renderWithEpiDashboardStore(createCaseSet());

    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).toHaveTextContent(`${WRAPPED_LABEL}|${COMPLETE_CASE_TYPE_ID}|${CASE_SET_FIXTURE_ID}`);
  });

  it('renders the wrapped component with a dashboard store without a case set when no case set is given', async () => {
    const screen = await renderWithEpiDashboardStore();

    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).toHaveTextContent(`${WRAPPED_LABEL}|${COMPLETE_CASE_TYPE_ID}|${NO_CASE_SET_TEXT}`);
  });

  it('shows an error and hides the wrapped component when the complete case type cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', () => Response.json({ detail: 'Case type failure' }, { status: 500 }));

    const screen = await renderWithEpiDashboardStore(createCaseSet());

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId(WRAPPED_TEST_ID)).not.toBeInTheDocument();
  });
});
