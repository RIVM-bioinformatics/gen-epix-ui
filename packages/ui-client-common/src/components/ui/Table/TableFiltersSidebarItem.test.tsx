import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { Mock } from 'vitest';
import {
  page,
  userEvent,
} from 'vitest/browser';

import { FILTER_MODE } from '../../../classes/abstracts/FilterAbstract';
import { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import { TextFilter } from '../../../classes/filters/TextFilter';
import type {
  FilterDimension,
  Filters,
} from '../../../models/filter.models';
import { createTableStore } from '../../../stores/tableStore/tableStore';
import { TableStoreContextProvider } from '../../../stores/tableStore/TableStoreContextProvider';
import { renderComponent } from '../../../test/lib';

import { TableFiltersSidebarItem } from './TableFiltersSidebarItem';

type TestFilter = Filters[number];

type TestRow = {
  id: string;
};

type TestStore = ReturnType<typeof createStore>;

const FILTER_PRIORITY = 'priority';
const MAIN_CONTENT_ID = 'main-content';
const MAIN_CONTENT_HEIGHT_PX = 300;
const MAIN_CONTENT_TOP_PX = 60;
const MISSING_VALUE_TEXT = 'Missing';
const NOT_APPLIED_MESSAGE = 'All filters have been removed, but have not yet been applied.';

const createBaseKwArgs = (id: string, label: string) => ({
  filterMode: FILTER_MODE.FRONTEND,
  filterPriority: FILTER_PRIORITY,
  id,
  label,
});

const createTextFilter = (id: string, label: string, filterValue = ''): TextFilter => {
  const filter = new TextFilter(createBaseKwArgs(id, label));
  filter.setFilterValue(filterValue);
  return filter;
};

const createDimension = (
  overrides: Partial<FilterDimension> & Pick<FilterDimension, 'filterIds' | 'id'>,
): FilterDimension => ({
  allowMultipleVisibleFilters: false,
  allowOnlyPreferredFilter: false,
  description: '',
  label: 'Dimension',
  preferredFilterId: overrides.filterIds[0],
  ...overrides,
});

const createStore = (showMissingValuesFilter: boolean) => createTableStore<TestRow>({
  defaultSortByField: 'id',
  idSelectorCallback: (row) => row.id,
  isRowEnabledCallback: () => true,
  showMissingValuesFilter,
});

type RenderSidebarOptions = {
  readonly dimensions?: FilterDimension[];
  readonly filters: TestFilter[];
  readonly includeMissingFilters?: TestFilter[];
  readonly onClose?: Mock<() => void>;
  readonly open?: boolean;
  readonly showMissingValuesFilter?: boolean;
  readonly visibleFilterWithinDimensions?: Record<string, string>;
};

const renderSidebar = async ({
  dimensions = [],
  filters,
  includeMissingFilters = [],
  onClose = vi.fn(),
  open = true,
  showMissingValuesFilter = false,
  visibleFilterWithinDimensions = {},
}: RenderSidebarOptions) => {
  const store: TestStore = createStore(showMissingValuesFilter);
  store.getState().setFilters(filters, dimensions, [FILTER_PRIORITY]);
  includeMissingFilters.forEach(filter => filter.setIncludeMissingValues(true));
  store.setState({ visibleFilterWithinDimensions });

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
      <TableFiltersSidebarItem
        onClose={onClose}
        open={open}
      />
    </TableStoreContextProvider>,
  );
  return { onClose, screen, store };
};

const getTextbox = (label: string) => page.getByRole('textbox', { exact: true, name: label });
const getRemoveChipButton = (label: string, value: string) => page.getByRole('button', {
  exact: true,
  name: `Remove filter with label ${label} and value ${value}`,
});
const getDropdownButton = (label: string) => page.getByRole('button', { exact: true, name: label });
const getMenuItem = (label: string) => page.getByRole('menuitem', { exact: true, name: label });
const getApplyButton = () => page.getByTestId('TableFiltersSidebarItem-apply');
const getResetButton = () => page.getByTestId('TableFiltersSidebarItem-reset');

describe('TableFiltersSidebarItem', () => {
  describe('wrapper', () => {
    it('does not render the filter form when closed', async () => {
      await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name')],
        open: false,
      });

      expect(document.getElementById('Filters')).toBeNull();
    });

    it('renders the title when open and calls onClose from the close button', async () => {
      const { onClose } = await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name')],
      });

      await expect.element(page.getByText('Filters', { exact: true })).toBeVisible();
      await userEvent.click(page.getByTestId('SidebarItem-CloseButton'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('flat filters', () => {
    it('renders filters shown in the sidebar and hides the others', async () => {
      const hiddenFilter = createTextFilter('hidden-filter', 'Hidden filter');
      hiddenFilter.showInSidebar = false;
      await renderSidebar({
        filters: [
          createTextFilter('text-filter', 'Search name'),
          new BooleanFilter(createBaseKwArgs('boolean-filter', 'Is active')),
          hiddenFilter,
        ],
      });

      await expect.element(getTextbox('Search name')).toBeVisible();
      await expect.element(page.getByText('Is active', { exact: true }).first()).toBeVisible();
      expect(getTextbox('Hidden filter').query()).toBeNull();
    });
  });

  describe('dimensions', () => {
    it('skips dimensions without filter ids, so unrelated filters are not rendered', async () => {
      await renderSidebar({
        dimensions: [createDimension({ filterIds: [], id: 'empty-dimension' })],
        filters: [createTextFilter('orphan-filter', 'Orphan filter')],
      });

      expect(getTextbox('Orphan filter').query()).toBeNull();
    });

    it('renders a single-filter dimension without a title or dropdown', async () => {
      await renderSidebar({
        dimensions: [createDimension({ filterIds: ['single'], id: 'single-dimension', label: 'Single dimension' })],
        filters: [createTextFilter('single', 'Single filter')],
      });

      await expect.element(getTextbox('Single filter')).toBeVisible();
      expect(page.getByText('Single dimension', { exact: true }).query()).toBeNull();
    });

    it('renders nothing for a single-filter dimension whose preferred filter is unknown', async () => {
      await renderSidebar({
        dimensions: [createDimension({ filterIds: ['single'], id: 'single-dimension', label: 'Single dimension', preferredFilterId: 'unknown' })],
        filters: [createTextFilter('single', 'Single filter')],
      });

      expect(getTextbox('Single filter').query()).toBeNull();
      expect(page.getByText('Single dimension', { exact: true }).query()).toBeNull();
    });

    it('renders only the preferred filter without title or dropdown when allowOnlyPreferredFilter is set', async () => {
      await renderSidebar({
        dimensions: [createDimension({
          allowOnlyPreferredFilter: true,
          filterIds: ['first', 'second'],
          id: 'only-dimension',
          label: 'Only preferred dimension',
          preferredFilterId: 'second',
        })],
        filters: [
          createTextFilter('first', 'First filter'),
          createTextFilter('second', 'Second filter'),
        ],
      });

      await expect.element(getTextbox('Second filter')).toBeVisible();
      expect(getTextbox('First filter').query()).toBeNull();
      expect(page.getByText('Only preferred dimension', { exact: true }).query()).toBeNull();
      expect(getDropdownButton('Second filter').query()).toBeNull();
    });

    it('renders all filters with a title and no dropdown when allowMultipleVisibleFilters is set', async () => {
      await renderSidebar({
        dimensions: [createDimension({
          allowMultipleVisibleFilters: true,
          filterIds: ['first', 'second'],
          id: 'multi-dimension',
          label: 'Multi dimension',
        })],
        filters: [
          createTextFilter('first', 'First filter'),
          createTextFilter('second', 'Second filter'),
        ],
      });

      await expect.element(page.getByText('Multi dimension', { exact: true })).toBeVisible();
      await expect.element(getTextbox('First filter')).toBeVisible();
      await expect.element(getTextbox('Second filter')).toBeVisible();
      expect(getDropdownButton('First filter').query()).toBeNull();
    });

    it('shows the preferred filter with a dropdown when no other filter is visible', async () => {
      await renderSidebar({
        dimensions: [createDimension({
          filterIds: ['first', 'second'],
          id: 'dropdown-dimension',
          label: 'Dropdown dimension',
        })],
        filters: [
          createTextFilter('first', 'First filter'),
          createTextFilter('second', 'Second filter'),
        ],
      });

      await expect.element(page.getByText('Dropdown dimension', { exact: true })).toBeVisible();
      await expect.element(getDropdownButton('First filter')).toBeVisible();
      await expect.element(getTextbox('First filter')).toBeVisible();
      expect(getTextbox('Second filter').query()).toBeNull();
    });

    it('shows the stored visible filter instead of the preferred one', async () => {
      await renderSidebar({
        dimensions: [createDimension({
          filterIds: ['first', 'second'],
          id: 'dropdown-dimension',
          label: 'Dropdown dimension',
        })],
        filters: [
          createTextFilter('first', 'First filter'),
          createTextFilter('second', 'Second filter'),
        ],
        visibleFilterWithinDimensions: { 'dropdown-dimension': 'second' },
      });

      await expect.element(getTextbox('Second filter')).toBeVisible();
      expect(getTextbox('First filter').query()).toBeNull();
    });

    it('does not crash and renders nothing for a dropdown dimension whose preferred filter is unknown', async () => {
      await renderSidebar({
        dimensions: [
          createDimension({
            filterIds: ['first', 'second'],
            id: 'broken-dimension',
            label: 'Broken dimension',
            preferredFilterId: 'unknown',
          }),
          createDimension({
            filterIds: ['standalone'],
            id: 'standalone-dimension',
            label: 'Standalone dimension',
          }),
        ],
        filters: [
          createTextFilter('first', 'First filter'),
          createTextFilter('second', 'Second filter'),
          createTextFilter('standalone', 'Standalone filter'),
        ],
      });

      await expect.element(getTextbox('Standalone filter')).toBeVisible();
      expect(page.getByText('Broken dimension', { exact: true }).query()).toBeNull();
      expect(getTextbox('First filter').query()).toBeNull();
      expect(getTextbox('Second filter').query()).toBeNull();
    });

    it('switches the visible filter from the dropdown, clears the previous filter and stores the choice on apply', async () => {
      const { onClose, store } = await renderSidebar({
        dimensions: [createDimension({
          filterIds: ['first', 'second'],
          id: 'dropdown-dimension',
          label: 'Dropdown dimension',
        })],
        filters: [
          createTextFilter('first', 'First filter', 'abc'),
          createTextFilter('second', 'Second filter'),
        ],
      });

      await userEvent.click(getDropdownButton('First filter'));
      await userEvent.click(getMenuItem('Second filter'));

      await expect.element(getTextbox('Second filter')).toBeVisible();
      expect(getTextbox('First filter').query()).toBeNull();
      expect(getRemoveChipButton('First filter', 'abc').query()).toBeNull();

      await userEvent.click(getApplyButton());

      await expect.poll(() => onClose.mock.calls.length).toBe(1);
      expect(store.getState().visibleFilterWithinDimensions['dropdown-dimension']).toBe('second');
      expect(store.getState().filters.find(filter => filter.id === 'first').filterValue).toBe('');
    });

    it('keeps the selection when the active dropdown item is clicked and resets missing values of the other filter', async () => {
      const firstFilter = createTextFilter('first', 'First filter', 'abc');
      await renderSidebar({
        dimensions: [createDimension({
          filterIds: ['first', 'second'],
          id: 'dropdown-dimension',
          label: 'Dropdown dimension',
        })],
        filters: [
          firstFilter,
          createTextFilter('second', 'Second filter'),
        ],
        includeMissingFilters: [firstFilter],
        showMissingValuesFilter: true,
      });

      await expect.element(getRemoveChipButton('First filter', 'abc, Missing')).toBeVisible();

      await userEvent.click(getDropdownButton('First filter'));
      await userEvent.click(getMenuItem('First filter'));

      await expect.element(getTextbox('First filter')).toBeVisible();
      await expect.element(getRemoveChipButton('First filter', 'abc, Missing')).toBeVisible();

      await userEvent.click(getDropdownButton('First filter'));
      await userEvent.click(getMenuItem('Second filter'));

      await expect.element(getTextbox('Second filter')).toBeVisible();
      expect(getRemoveChipButton('First filter', 'abc, Missing').query()).toBeNull();
    });
  });

  describe('active filter chips', () => {
    it('shows the value of an active filter as a chip', async () => {
      await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name', 'abc')],
      });

      await expect.element(getRemoveChipButton('Search name', 'abc')).toBeVisible();
    });

    it('shows Missing as the presentation when only missing values are included', async () => {
      const filter = createTextFilter('text-filter', 'Search name');
      await renderSidebar({
        filters: [filter],
        includeMissingFilters: [filter],
        showMissingValuesFilter: true,
      });

      await expect.element(getRemoveChipButton('Search name', MISSING_VALUE_TEXT)).toBeVisible();
    });

    it('does not show a chip for missing values when showMissingValuesFilter is disabled', async () => {
      const filter = createTextFilter('text-filter', 'Search name');
      await renderSidebar({
        filters: [filter],
        includeMissingFilters: [filter],
        showMissingValuesFilter: false,
      });

      expect(getRemoveChipButton('Search name', MISSING_VALUE_TEXT).query()).toBeNull();
    });

    it('removes a chip, showing the not-yet-applied message and the reset and apply buttons', async () => {
      await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name', 'abc')],
      });

      await userEvent.click(getRemoveChipButton('Search name', 'abc'));

      await expect.element(page.getByText(NOT_APPLIED_MESSAGE)).toBeVisible();
      await expect.element(getResetButton()).toBeVisible();
      await expect.element(getApplyButton()).toBeVisible();
      expect(getRemoveChipButton('Search name', 'abc').query()).toBeNull();
    });

    it('removes the value and the missing values of a filter when showMissingValuesFilter is enabled', async () => {
      const filter = createTextFilter('text-filter', 'Search name', 'abc');
      await renderSidebar({
        filters: [filter],
        includeMissingFilters: [filter],
        showMissingValuesFilter: true,
      });

      await userEvent.click(getRemoveChipButton('Search name', 'abc, Missing'));

      await expect.element(page.getByText(NOT_APPLIED_MESSAGE)).toBeVisible();
      expect(getRemoveChipButton('Search name', 'abc, Missing').query()).toBeNull();
    });

    it('does not show the not-yet-applied message while another filter is still active', async () => {
      await renderSidebar({
        filters: [
          createTextFilter('first', 'First filter', 'abc'),
          createTextFilter('second', 'Second filter', 'def'),
        ],
      });

      await userEvent.click(getRemoveChipButton('First filter', 'abc'));

      await expect.element(getRemoveChipButton('Second filter', 'def')).toBeVisible();
      expect(page.getByText(NOT_APPLIED_MESSAGE).query()).toBeNull();
    });
  });

  describe('reset and apply', () => {
    it('hides the reset and apply buttons when no filter is active and nothing changed', async () => {
      await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name')],
      });

      await expect.element(getTextbox('Search name')).toBeVisible();
      expect(getResetButton().query()).toBeNull();
      expect(getApplyButton().query()).toBeNull();
    });

    it('shows the reset and apply buttons after typing, without the not-yet-applied message', async () => {
      await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name')],
      });

      await userEvent.fill(getTextbox('Search name'), 'typed');

      await expect.element(getResetButton()).toBeVisible();
      await expect.element(getApplyButton()).toBeVisible();
      expect(page.getByText(NOT_APPLIED_MESSAGE).query()).toBeNull();
    });

    it('applies the typed value to the store and closes the sidebar', async () => {
      const { onClose, store } = await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name')],
      });

      await userEvent.fill(getTextbox('Search name'), 'xyz');
      await userEvent.click(getApplyButton());

      await expect.poll(() => onClose.mock.calls.length).toBe(1);
      expect(store.getState().filters[0].filterValue).toBe('xyz');
    });

    it('resets the active filters in the store and closes the sidebar', async () => {
      const { onClose, store } = await renderSidebar({
        filters: [createTextFilter('text-filter', 'Search name', 'abc')],
      });

      await userEvent.click(getResetButton());

      await expect.poll(() => onClose.mock.calls.length).toBe(1);
      expect(store.getState().filters[0].filterValue).toBe('');
    });
  });
});
