import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import type { TableColumnDimension } from '@gen-epix/ui-client-common/models/table.models';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { container } from 'tsyringe';

import type { CaseDbConfig } from '../../../models/config.models';
import { DashboardStoreContext } from '../../../stores/dashboardStore/dashboardStoreContext';
import { createDashboardStore } from '../../../stores/dashboardStore/dashboardStore';
import {
  clearDashboardStorage,
  createDashboardCase,
  mockDashboardApi,
} from '../../../test/fixtures/dashboard';
import { createLineListCompleteCaseType } from '../../../test/fixtures/lineListCompleteCaseType';
import { renderComponent } from '../../../test/lib';
import { CaseTypeUtil } from '../../../utils/CaseTypeUtil';

import { LineListWidgetTitle } from './LineListWidgetTitle';

type DashboardStoreInstance = ReturnType<typeof createDashboardStore>;

const STORAGE_NAME_POST_FIX = 'LineListWidgetTitle';
const CASE_SET_ID = 'case-set-1';
const CASES: CaseDbCase[] = [
  createDashboardCase({ content: {}, id: 'case-1' }),
  createDashboardCase({ content: {}, id: 'case-2' }),
  createDashboardCase({ content: {}, id: 'case-3' }),
];

let activeDashboardStore: DashboardStoreInstance | undefined;

const createStore = async (loadCases: boolean) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  const completeCaseType = createLineListCompleteCaseType();
  const dashboardStore = createDashboardStore({
    caseSetId: CASE_SET_ID,
    completeCaseType,
    config,
    idSelectorCallback: (row) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
  activeDashboardStore = dashboardStore;

  mockDashboardApi(completeCaseType);
  mockApiRequest('POST', '/v1/retrieve/case_ids_by_query', () => Response.json({ case_ids: CASES.map((caseItem) => caseItem.id), is_max_results_exceeded: false }));
  mockApiRequest('POST', '/v1/retrieve/cases_by_ids', () => Response.json(CASES));
  const tableColumnDimensions: TableColumnDimension[] = completeCaseType.ordered_dim_ids.map((dimId) => ({
    columnIds: completeCaseType.ordered_col_ids_by_dim[dimId],
    id: dimId,
    label: CaseTypeUtil.getDimLabel(completeCaseType, dimId),
  }));
  dashboardStore.getState().setColumnDimensions(tableColumnDimensions);
  if (loadCases) {
    await dashboardStore.getState().initialize(new AbortController().signal);
  }
  return dashboardStore;
};

const renderTitle = async (dashboardStore: DashboardStoreInstance, language: 'en' | 'nl' = 'en') => {
  const screen = await renderComponent(
    <DashboardStoreContext value={dashboardStore}>
      <LineListWidgetTitle />
    </DashboardStoreContext>,
    { language },
  );
  return { screen };
};

describe('LineListWidgetTitle', () => {
  beforeEach(() => {
    clearDashboardStorage();
  });

  afterEach(() => {
    activeDashboardStore?.getState().destroy();
    activeDashboardStore = undefined;
    container.resolve(QueryClientService).queryClient.clear();
    clearDashboardStorage();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
  });

  it('shows zero shown cases and zero selected cases when the store is empty', async () => {
    const dashboardStore = await createStore(false);
    const { screen } = await renderTitle(dashboardStore);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Line list: 0 cases, 0 selected');
  });

  it('shows the number of loaded cases', async () => {
    const dashboardStore = await createStore(true);
    const { screen } = await renderTitle(dashboardStore);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Line list: 3 cases, 0 selected');
  });

  it('updates the number of selected cases when the selection changes', async () => {
    const dashboardStore = await createStore(true);
    const { screen } = await renderTitle(dashboardStore);

    dashboardStore.getState().setSelectedIds(['case-1', 'case-3']);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Line list: 3 cases, 2 selected');
  });

  it('shows the translated text in dutch', async () => {
    const dashboardStore = await createStore(true);
    const { screen } = await renderTitle(dashboardStore, 'nl');

    dashboardStore.getState().setSelectedIds(['case-2']);

    await expect.element(screen.getByRole('status')).toHaveTextContent('Regel lijst: 3 casussen, 1 geselecteerd');
  });
});
