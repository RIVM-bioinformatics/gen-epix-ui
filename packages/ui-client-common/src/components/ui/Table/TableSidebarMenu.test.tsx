import type { ReactNode } from 'react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { page } from 'vitest/browser';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { TextFilter } from '../../../classes/filters/TextFilter';
import type { Filters } from '../../../models/filter.models';
import type { TableColumn } from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableSidebarMenu } from './TableSidebarMenu';

type RecordedDownload = {
  fileName: string;
};

type TestFilter = Filters[number];

type TestRow = {
  id: string;
  name: string;
};

type TestStore = ReturnType<typeof createTableStore<TestRow>>;

const FILTER_PRIORITY = 'priority';
const MAIN_CONTENT_ID = 'main-content';
const DOWNLOAD_FILE_NAME = 'results';
const EXTRA_MENU_ITEM_LABEL = 'Extra action';

const createTextFilter = (id: string, filterValue: string): TextFilter => {
  const filter = new TextFilter({
    filterMode: FILTER_MODE.FRONTEND,
    filterPriority: FILTER_PRIORITY,
    id,
    label: `Label ${id}`,
  });
  filter.setFilterValue(filterValue);
  return filter;
};

const createColumnsForFilters = (filters: TestFilter[]): TableColumn<TestRow>[] => filters.map(filter => ({
  headerName: filter.label,
  id: filter.id,
  isInitiallyVisible: true,
  type: 'text',
  valueGetter: ({ row }) => row.name,
}));

const createStore = (filters: TestFilter[]): TestStore => {
  const store = createTableStore<TestRow>({
    defaultSortByField: 'id',
    idSelectorCallback: (row) => row.id,
    isRowEnabledCallback: () => true,
  });
  store.getState().setColumns(createColumnsForFilters(filters));
  store.getState().setBaseData([{ id: 'row-0', name: 'Name 0' }]);
  store.getState().setFilters(filters, [], [FILTER_PRIORITY]);
  return store;
};

// Records anchor downloads triggered by DownloadUtil and cancels navigation to the data URL
let stopRecordingDownloads: (() => void) | undefined;

const recordDownloads = (): RecordedDownload[] => {
  const downloads: RecordedDownload[] = [];
  const onClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLAnchorElement) || !target.hasAttribute('download')) {
      return;
    }
    event.preventDefault();
    downloads.push({ fileName: target.download });
  };
  document.addEventListener('click', onClick, true);
  stopRecordingDownloads = () => {
    document.removeEventListener('click', onClick, true);
  };
  return downloads;
};

afterEach(() => {
  stopRecordingDownloads?.();
  stopRecordingDownloads = undefined;
});

type RenderMenuOptions = {
  readonly downloadAsFileName?: string;
  readonly extraSidebarMenuItems?: ReactNode;
  readonly filters?: TestFilter[];
};

const renderMenu = async ({ downloadAsFileName, extraSidebarMenuItems, filters = [] }: RenderMenuOptions = {}) => {
  const store = createStore(filters);
  await store.getState().initialize(new AbortController().signal);
  await renderComponent(
    <TableStoreContextProvider store={store}>
      <div
        id={MAIN_CONTENT_ID}
        style={{
          height: '300px',
          left: 0,
          position: 'fixed',
          top: '60px',
          width: '200px',
        }}
      />
      <TableSidebarMenu
        downloadAsFileName={downloadAsFileName}
        extraSidebarMenuItems={extraSidebarMenuItems}
      />
    </TableStoreContextProvider>,
  );
  return store;
};

const getFiltersButton = () => page.getByRole('button', { exact: true, name: 'Open filters' });
const getDownloadButton = () => page.getByRole('button', { exact: true, name: 'Open download' });
const getFilterTextbox = (label: string) => page.getByRole('textbox', { exact: true, name: label });
const getDownloadAllCsvButton = () => page.getByRole('button', { exact: true, name: 'Download all rows as CSV' });
const getCloseButton = () => page.getByTestId('SidebarItem-CloseButton');

describe('TableSidebarMenu', () => {
  it('should render no badge count when no filters are active', async () => {
    await renderMenu({ filters: [createTextFilter('inactive-filter', '')] });

    await expect.element(getFiltersButton()).toBeVisible();
    expect(getFiltersButton().element().textContent?.trim()).toBe('');
  });

  it('should render the number of active filters on the filter button', async () => {
    await renderMenu({
      filters: [
        createTextFilter('active-filter-a', 'a'),
        createTextFilter('active-filter-b', 'b'),
        createTextFilter('inactive-filter', ''),
      ],
    });

    await expect.element(getFiltersButton()).toHaveTextContent('2');
  });

  it('should open the filters sidebar when the filter button is clicked', async () => {
    await renderMenu({ filters: [createTextFilter('text-filter', 'Search name')] });

    await getFiltersButton().click();

    await expect.element(getFilterTextbox('Label text-filter')).toBeVisible();
  });

  it('should open the download sidebar when the download button is clicked', async () => {
    await renderMenu();

    await getDownloadButton().click();

    await expect.element(getDownloadAllCsvButton()).toBeVisible();
  });

  it('should close the filters sidebar with its close button', async () => {
    await renderMenu({ filters: [createTextFilter('text-filter', 'Search name')] });
    await getFiltersButton().click();
    await expect.element(getFilterTextbox('Label text-filter')).toBeVisible();

    await getCloseButton().click();

    await expect.element(getFilterTextbox('Label text-filter')).not.toBeInTheDocument();
  });

  it('should close the download sidebar with its close button', async () => {
    await renderMenu();
    await getDownloadButton().click();
    await expect.element(getDownloadAllCsvButton()).toBeVisible();

    await getCloseButton().click();

    await expect.element(getDownloadAllCsvButton()).not.toBeInTheDocument();
  });

  it('should render the extra sidebar menu items', async () => {
    await renderMenu({
      extraSidebarMenuItems: (
        <button type={'button'}>
          {EXTRA_MENU_ITEM_LABEL}
        </button>
      ),
    });

    await expect.element(page.getByRole('button', { exact: true, name: EXTRA_MENU_ITEM_LABEL })).toBeVisible();
  });

  it('should prefix the download file name with the configured file name', async () => {
    const downloads = recordDownloads();
    await renderMenu({ downloadAsFileName: DOWNLOAD_FILE_NAME });
    await getDownloadButton().click();

    await getDownloadAllCsvButton().click();

    await vi.waitFor(() => {
      expect(downloads).toHaveLength(1);
    });
    expect(downloads[0]?.fileName).toBe(`${DOWNLOAD_FILE_NAME}.csv`);
  });
});
