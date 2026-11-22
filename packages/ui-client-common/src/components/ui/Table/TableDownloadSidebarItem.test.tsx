import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  page,
  userEvent,
} from 'vitest/browser';

import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../../models/table.models';
import type {
  TableColumn,
  TableColumnSelectable,
  TableColumnText,
  TableColumnVisualSettings,
} from '../../../models/table.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableDownloadSidebarItem } from './TableDownloadSidebarItem';

type RecordedDownload = {
  fileName: string;
  href: string;
};

type TestDataContext = {
  label: string;
};

type TestRow = {
  code: string;
  id: string;
  name: string;
  notes: string;
};

type TestStore = ReturnType<typeof createStore>;

const DATA_CONTEXT: TestDataContext = {
  label: 'Context',
};
const ROW_1: TestRow = { code: 'A-1', id: 'row-1', name: 'Alpha', notes: 'Note A' };
const ROW_2: TestRow = { code: 'B-2', id: 'row-2', name: 'Beta', notes: 'Note B' };
const ROW_3: TestRow = { code: 'C-3', id: 'row-3', name: 'Gamma', notes: 'Note C' };
const ROWS: TestRow[] = [ROW_1, ROW_2, ROW_3];
const SELECTED_ROW_ID = ROW_2.id;
const RESULTS_FILE_NAME = 'results';
const MAIN_CONTENT_ID = 'main-content';
const MAIN_CONTENT_TOP_PX = 60;
const MAIN_CONTENT_HEIGHT_PX = 300;
const ALL_ROWS_CSV = 'Name,Notes\nAlpha,Note A\nBeta,Note B\nGamma,Note C\n';
const SELECTED_ROWS_CSV = 'Name,Notes\nBeta,Note B\n';
const XLSX_DATA_URL_PREFIX = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,';
const ZIP_SIGNATURE = 'PK';

const createStore = () => createTableStore<TestRow, TestDataContext>({
  defaultSortByField: 'name',
  idSelectorCallback: (row) => row.id,
  isRowEnabledCallback: () => true,
});

const createColumn = (
  overrides: Partial<TableColumnText<TestRow, TestDataContext>> & Pick<TableColumnText<TestRow, TestDataContext>, 'id'>,
): TableColumnText<TestRow, TestDataContext> => ({
  disableEllipsis: true,
  headerName: overrides.id,
  isInitiallyVisible: true,
  resizable: false,
  type: 'text',
  ...overrides,
});

const ROW_SELECT_COLUMN: TableColumnSelectable<TestRow, TestDataContext> = {
  disableEllipsis: true,
  frozen: TABLE_COLUMN_FROZEN.LEFT,
  headerName: 'Select',
  id: FIXED_COLUMN_ID.ROW_SELECT,
  isInitiallyVisible: true,
  resizable: false,
  type: 'selectable',
};

const COLUMNS: TableColumn<TestRow, TestDataContext>[] = [
  ROW_SELECT_COLUMN,
  createColumn({ headerName: 'Name', id: 'name' }),
  createColumn({ headerName: 'Code', id: 'code', isInitiallyVisible: false }),
  createColumn({ headerName: 'Notes', id: 'notes' }),
];

// Only name and notes are visible, so exports contain exactly those two columns
const VISUAL_SETTINGS: TableColumnVisualSettings[] = [
  { id: FIXED_COLUMN_ID.ROW_SELECT, isVisible: true, widthFlex: 1, widthPx: 100 },
  { id: 'name', isVisible: true, widthFlex: 1, widthPx: 100 },
  { id: 'code', isVisible: false, widthFlex: 1, widthPx: 100 },
  { id: 'notes', isVisible: true, widthFlex: 1, widthPx: 100 },
];

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
    downloads.push({ fileName: target.download, href: target.href });
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

type RenderDownloadSidebarItemOptions = {
  readonly downloadAsFileName?: string;
  readonly onClose?: () => void;
  readonly open?: boolean;
  readonly selectedIds?: string[];
  readonly store?: TestStore;
};

const renderDownloadSidebarItem = async ({
  downloadAsFileName,
  onClose = vi.fn(),
  open = true,
  selectedIds = [],
  store = createStore(),
}: RenderDownloadSidebarItemOptions = {}) => {
  store.setState({
    columns: COLUMNS,
    columnVisualSettingsUncondensed: VISUAL_SETTINGS,
    dataContext: DATA_CONTEXT,
    isCondensed: false,
    selectedIds,
    sortedData: ROWS,
  });
  const screen = await renderComponent(
    <TableStoreContextProvider store={store}>
      <div
        id={MAIN_CONTENT_ID}
        style={{
          height: `${MAIN_CONTENT_HEIGHT_PX}px`,
          left: 0,
          position: 'fixed',
          top: `${MAIN_CONTENT_TOP_PX}px`,
          width: '200px',
        }}
      />
      <TableDownloadSidebarItem
        downloadAsFileName={downloadAsFileName}
        onClose={onClose}
        open={open}
      />
    </TableStoreContextProvider>,
  );
  return { onClose, screen, store };
};

const getButton = (name: string) => page.getByRole('button', { exact: true, name });

const getHeading = (name: string) => page.getByRole('heading', { exact: true, name });

const decodeBase64DataUrl = (href: string): string => {
  const base64 = href.slice(href.indexOf(',') + 1);
  return atob(base64);
};

const DOWNLOAD_CASES = [
  {
    buttonName: 'Download all rows as CSV',
    configuredFileName: `${RESULTS_FILE_NAME}.csv`,
    defaultFileName: 'all_rows.csv',
    format: 'csv',
    isSelectedOnly: false,
  },
  {
    buttonName: 'Download all rows as Excel',
    configuredFileName: `${RESULTS_FILE_NAME}.xlsx`,
    defaultFileName: 'all_rows.xlsx',
    format: 'xlsx',
    isSelectedOnly: false,
  },
  {
    buttonName: 'Download selected rows as CSV',
    configuredFileName: `${RESULTS_FILE_NAME}__selected_rows.csv`,
    defaultFileName: 'selected_rows.csv',
    format: 'csv',
    isSelectedOnly: true,
  },
  {
    buttonName: 'Download selected rows as Excel',
    configuredFileName: `${RESULTS_FILE_NAME}__selected_rows.xlsx`,
    defaultFileName: 'selected_rows.xlsx',
    format: 'xlsx',
    isSelectedOnly: true,
  },
] as const;

const expectDownloadContent = (download: RecordedDownload, format: 'csv' | 'xlsx', isSelectedOnly: boolean) => {
  if (format === 'csv') {
    expect(decodeBase64DataUrl(download.href)).toBe(isSelectedOnly ? SELECTED_ROWS_CSV : ALL_ROWS_CSV);
    return;
  }
  expect(download.href.startsWith(XLSX_DATA_URL_PREFIX)).toBe(true);
  expect(decodeBase64DataUrl(download.href).startsWith(ZIP_SIGNATURE)).toBe(true);
};

describe('TableDownloadSidebarItem', () => {
  it('should not render the download actions when closed', async () => {
    const { screen } = await renderDownloadSidebarItem({ open: false });

    expect(screen.getByRole('button', { name: 'Download all rows as CSV' }).query()).toBeNull();
    expect(getHeading('All rows').query()).toBeNull();
  });

  it('should render the all rows downloads and hide the selected rows section when nothing is selected', async () => {
    await renderDownloadSidebarItem();

    await expect.element(getHeading('All rows')).toBeVisible();
    await expect.element(getButton('Download all rows as Excel')).toBeVisible();
    await expect.element(getButton('Download all rows as CSV')).toBeVisible();
    expect(getHeading('Selected rows').query()).toBeNull();
  });

  it('should render the selected rows section when rows are selected', async () => {
    await renderDownloadSidebarItem({ selectedIds: [SELECTED_ROW_ID] });

    await expect.element(getHeading('Selected rows')).toBeVisible();
    await expect.element(getButton('Download selected rows as Excel')).toBeVisible();
    await expect.element(getButton('Download selected rows as CSV')).toBeVisible();
  });

  it('should hide the selected rows section when the selection is cleared', async () => {
    const { store } = await renderDownloadSidebarItem({ selectedIds: [SELECTED_ROW_ID] });
    await expect.element(getHeading('Selected rows')).toBeVisible();

    store.setState({ selectedIds: [] });

    await expect.element(getHeading('Selected rows')).not.toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', async () => {
    const { onClose } = await renderDownloadSidebarItem();

    await userEvent.click(page.getByTestId('SidebarItem-CloseButton'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it.each(DOWNLOAD_CASES)('should download with the default file name when clicking "$buttonName"', async ({ buttonName, defaultFileName, format, isSelectedOnly }) => {
    const downloads = recordDownloads();
    await renderDownloadSidebarItem({ selectedIds: [SELECTED_ROW_ID] });

    await userEvent.click(getButton(buttonName));

    await vi.waitFor(() => {
      expect(downloads).toHaveLength(1);
    });
    expect(downloads[0]?.fileName).toBe(defaultFileName);
    expectDownloadContent(downloads[0], format, isSelectedOnly);
  });

  it.each(DOWNLOAD_CASES)('should prefix the file name when clicking "$buttonName" with the configured file name', async ({ buttonName, configuredFileName, format, isSelectedOnly }) => {
    const downloads = recordDownloads();
    await renderDownloadSidebarItem({ downloadAsFileName: RESULTS_FILE_NAME, selectedIds: [SELECTED_ROW_ID] });

    await userEvent.click(getButton(buttonName));

    await vi.waitFor(() => {
      expect(downloads).toHaveLength(1);
    });
    expect(downloads[0]?.fileName).toBe(configuredFileName);
    expectDownloadContent(downloads[0], format, isSelectedOnly);
  });
});
