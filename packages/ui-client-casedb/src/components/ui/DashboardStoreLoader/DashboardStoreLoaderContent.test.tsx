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
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  createDashboardCompleteCaseType,
  DASHBOARD_CASE_ID,
  DASHBOARD_GEO_COL_ID,
  DASHBOARD_GEO_DIM_ID,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import {
  CASE_SET_FIXTURE_ID,
  createCaseSet,
} from '../../../test/fixtures/caseSet';
import { COMPLETE_CASE_TYPE_TEXT_COL_ID } from '../../../test/fixtures/completeCaseType';
import { renderComponent } from '../../../test/lib';

import { DashboardStoreLoaderContent } from './DashboardStoreLoaderContent';

const CHILD_TEST_ID = 'dashboard-store-content-child';
const CASE_SET_ID_TEST_ID = 'dashboard-store-content-case-set-id';
const COLUMN_DIMENSIONS_TEST_ID = 'dashboard-store-content-column-dimensions';
const ROW_ID_TEST_ID = 'dashboard-store-content-row-id';
const NO_CASE_SET_TEXT = 'no case set';
const NO_COLUMN_DIMENSIONS_TEXT = 'no column dimensions';

const DashboardStoreContentProbe = () => {
  const store = use(DashboardStoreContext);
  const caseSetId = useStore(store, (state) => state.caseSetId);
  const columnDimensions = useStore(store, (state) => state.columnDimensions);
  const idSelectorCallback = useStore(store, (state) => state.idSelectorCallback);
  const columnDimensionsSummary = columnDimensions
    ? columnDimensions.map((dimension) => `${dimension.id}|${dimension.label}|${dimension.columnIds.join(',')}`).join(';')
    : NO_COLUMN_DIMENSIONS_TEXT;

  return (
    <>
      <div {...TestIdUtil.createAttributes(CASE_SET_ID_TEST_ID)}>
        {caseSetId ?? NO_CASE_SET_TEXT}
      </div>
      <div {...TestIdUtil.createAttributes(COLUMN_DIMENSIONS_TEST_ID)}>
        {columnDimensionsSummary}
      </div>
      <div {...TestIdUtil.createAttributes(ROW_ID_TEST_ID)}>
        {idSelectorCallback(createDashboardCase())}
      </div>
    </>
  );
};

const renderDashboardStoreLoaderContent = async (caseSet?: CaseDbCaseSet) => {
  return renderComponent(
    <DashboardStoreLoaderContent
      caseSet={caseSet}
      completeCaseType={createDashboardCompleteCaseType()}
    >
      <div {...TestIdUtil.createAttributes(CHILD_TEST_ID)}>
        <DashboardStoreContentProbe />
      </div>
    </DashboardStoreLoaderContent>,
  );
};

describe('DashboardStoreLoaderContent', () => {
  beforeEach(() => {
    mockDashboardApi();
  });

  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
    container.resolve(NotificationService).clearNotifications();
    clearDashboardStorage();
  });

  it('provides a dashboard store for the given case set to its children', async () => {
    const screen = await renderDashboardStoreLoaderContent(createCaseSet());

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument();
    await expect.element(screen.getByTestId(CASE_SET_ID_TEST_ID)).toHaveTextContent(CASE_SET_FIXTURE_ID);
  });

  it('provides a dashboard store without a case set when no case set is given', async () => {
    const screen = await renderDashboardStoreLoaderContent();

    await expect.element(screen.getByTestId(CHILD_TEST_ID)).toBeInTheDocument();
    await expect.element(screen.getByTestId(CASE_SET_ID_TEST_ID)).toHaveTextContent(NO_CASE_SET_TEXT);
  });

  it('sets the column dimensions of the complete case type on the store', async () => {
    const screen = await renderDashboardStoreLoaderContent();

    await expect.element(screen.getByTestId(COLUMN_DIMENSIONS_TEST_ID)).toHaveTextContent(`dim-other|other|${COMPLETE_CASE_TYPE_TEXT_COL_ID};${DASHBOARD_GEO_DIM_ID}|geo|${DASHBOARD_GEO_COL_ID}`);
  });

  it('identifies rows of the store by their id', async () => {
    const screen = await renderDashboardStoreLoaderContent();

    await expect.element(screen.getByTestId(ROW_ID_TEST_ID)).toHaveTextContent(DASHBOARD_CASE_ID);
  });
});
