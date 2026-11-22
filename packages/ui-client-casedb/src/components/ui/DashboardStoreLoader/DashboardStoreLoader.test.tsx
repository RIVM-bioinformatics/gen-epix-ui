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
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
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

import { DashboardStoreLoader } from './DashboardStoreLoader';

const CHILD_TEST_ID = 'dashboard-store-child';
const CASE_SET_ID_TEST_ID = 'dashboard-store-case-set-id';
const NO_CASE_SET_TEXT = 'no case set';

const DashboardStoreProbe = () => {
  const store = use(DashboardStoreContext);
  const caseSetId = useStore(store, (state) => state.caseSetId);
  return (
    <div {...TestIdUtil.createAttributes(CASE_SET_ID_TEST_ID)}>
      {caseSetId ?? NO_CASE_SET_TEXT}
    </div>
  );
};

const renderDashboardStoreLoader = async (caseSet?: CaseDbCaseSet) => {
  return renderComponent(
    <DashboardStoreLoader
      caseSet={caseSet}
      caseTypeId={COMPLETE_CASE_TYPE_ID}
    >
      <div {...TestIdUtil.createAttributes(CHILD_TEST_ID)}>
        <DashboardStoreProbe />
      </div>
    </DashboardStoreLoader>,
  );
};

describe('DashboardStoreLoader', () => {
  beforeEach(() => {
    mockDashboardApi();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    clearDashboardStorage();
  });

  it('shows a loading message while the complete case type is loading', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', async () => new Promise<Response>(() => undefined));

    const screen = await renderDashboardStoreLoader(createCaseSet());

    await expect.element(screen.getByText('Loading case type')).toBeInTheDocument();
    await expect.element(screen.getByTestId(CHILD_TEST_ID)).not.toBeInTheDocument();
  });

  it('renders the children with a dashboard store for the given case set once the complete case type is loaded', async () => {
    const screen = await renderDashboardStoreLoader(createCaseSet());

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument();
    await expect.element(screen.getByTestId(CASE_SET_ID_TEST_ID)).toHaveTextContent(CASE_SET_FIXTURE_ID);
  });

  it('renders the children with a dashboard store without a case set when no case set is given', async () => {
    const screen = await renderDashboardStoreLoader();

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument();
    await expect.element(screen.getByTestId(CASE_SET_ID_TEST_ID)).toHaveTextContent(NO_CASE_SET_TEXT);
  });

  it('shows an error and hides the children when the complete case type cannot be loaded', async () => {
    mockApiRequest('GET', '/v1/complete_case_types', () => Response.json({ detail: 'Case type failure' }, { status: 500 }));

    const screen = await renderDashboardStoreLoader(createCaseSet());

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByTestId(CHILD_TEST_ID)).not.toBeInTheDocument();
  });
});
