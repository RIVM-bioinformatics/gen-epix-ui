// FIXME split component
/* eslint-disable @eslint-react/kit/no-multi-comp */

import { useTranslation } from 'react-i18next';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import { useStore } from 'zustand';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';
import { NestedDropdown } from '@gen-epix/ui-core-components/components/NestedMenu';
import type { MenuItemData } from '@gen-epix/ui-core-components/models/nested-menu.models';

import { SidebarItem } from '../Sidebar';
import type { SidebarItemSharedProps } from '../Sidebar';
import type {
  FilterDimension,
  Filters,
  FilterValues,
} from '../../../models/filter.models';
import { useTableStoreContext } from '../../../stores/tableStore';

import { TableFilter } from './TableFilter';

export type TableFiltersSidebarItemProps = SidebarItemSharedProps;
type TableFiltersSidebarItemContentProps = Pick<TableFiltersSidebarItemProps, 'onClose'>;

export const TableFiltersSidebarItemIcon = FilterAltIcon;

type TableFiltersSidebarItemContentFilterDimensionProps = {
  readonly filterDimension: FilterDimension;
  readonly onFilterVisibilityChange: (filterDimensionId: string, filterId: string) => void;
  readonly showMissingValuesFilter: boolean;
  readonly visibleFilterWithinDimension: string;
};

const TableFiltersSidebarItemContentFilterDimension = <TRowData, TDataContext = null>({ filterDimension, onFilterVisibilityChange, showMissingValuesFilter, visibleFilterWithinDimension }: TableFiltersSidebarItemContentFilterDimensionProps) => {
  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const filters = useStoreWithEqualityFn(tableStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => [filter.filterValue, filter.includeMissingValues])) === JSON.stringify(b.map(filter => [filter.filterValue, filter.includeMissingValues])));
  const dimensionFilters = filterDimension.filterIds.map(filterId => filters.find(filter => filter.id === filterId));

  const { setValue } = useFormContext<FilterValues>();

  const filteredDimensionFilters = useMemo<Filters>(() => {
    if (filterDimension.allowOnlyPreferredFilter || filterDimension.filterIds.length === 1) {
      return [dimensionFilters.find(f => f?.id && f.id === filterDimension.preferredFilterId)].filter(x => !!x);
    }
    if (!filterDimension.allowMultipleVisibleFilters) {
      const visibleFilterId = visibleFilterWithinDimension ?? filterDimension.preferredFilterId;
      const visibleFilter = dimensionFilters.find(f => f?.id && f.id === visibleFilterId);
      return [visibleFilter].filter(x => !!x);
    }
    return dimensionFilters;
  }, [dimensionFilters, filterDimension.allowMultipleVisibleFilters, filterDimension.allowOnlyPreferredFilter, filterDimension.filterIds.length, filterDimension.preferredFilterId, visibleFilterWithinDimension]);

  const shouldShowDropDown = useMemo(() => {
    return dimensionFilters.length > 1 && !filterDimension.allowOnlyPreferredFilter && !filterDimension.allowMultipleVisibleFilters;
  }, [dimensionFilters.length, filterDimension.allowMultipleVisibleFilters, filterDimension.allowOnlyPreferredFilter]);

  const shouldShowDimensionTitle = useMemo(() => {
    if (dimensionFilters.length === 1) {
      return false;
    }
    if (filterDimension.allowOnlyPreferredFilter) {
      return false;
    }
    return true;
  }, [dimensionFilters.length, filterDimension.allowOnlyPreferredFilter]);

  const menuItems = useMemo<MenuItemData>(() => {
    return shouldShowDropDown
      ? {
        items: dimensionFilters.map(filter => ({
          active: filter === filteredDimensionFilters[0],
          callback: () => {
            onFilterVisibilityChange(filterDimension.id, filter.id);
            filterDimension.filterIds.forEach((id) => {
              if (id !== filter.id) {
                const otherFilter = filters.find(f => f.id === id);
                setValue(id, otherFilter.initialFilterValue, {
                  shouldDirty: true,
                });
                if (showMissingValuesFilter) {
                  setValue(otherFilter.includeMissingValuesFormFieldName, false, {
                    shouldDirty: true,
                  });
                }
              }
            });
          },
          label: filter.label,
        })),
        label: filteredDimensionFilters[0].label,
      }
      : null;
  }, [dimensionFilters, filterDimension.filterIds, filterDimension.id, filteredDimensionFilters, filters, setValue, onFilterVisibilityChange, shouldShowDropDown, showMissingValuesFilter]);

  if (!filteredDimensionFilters.length) {
    return null;
  }

  return (
    <Box
      key={filterDimension.id}
      sx={{ mb: 2 }}
    >
      {shouldShowDimensionTitle && (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              sx={{
                margin: 0,
                padding: 0,
              }}
              variant={'h6'}
            >
              {filterDimension.label}
            </Typography>
          </Box>
          {shouldShowDropDown && (
            <Box>
              <NestedDropdown
                ButtonProps={{
                  color: 'inherit',
                  size: 'small',
                  sx: {
                    '& span': {
                      margin: 0,
                    },
                    background: 'none !important',
                    margin: 0,
                    padding: 0,
                    textTransform: 'none',
                  },
                  variant: 'text',
                }}
                menuItemsData={menuItems}
              />
            </Box>
          )}
        </Box>
      )}
      {filteredDimensionFilters.map((filter) => (
        <Box
          key={filter.id}
          sx={{ my: 1 }}
        >
          <TableFilter filter={filter} />
        </Box>
      ))}
      <Divider />
    </Box>
  );
};

export const TableFiltersSidebarItemContent = <TRowData, TDataContext = null>({ onClose }: TableFiltersSidebarItemContentProps) => {
  const { t } = useTranslation();

  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const setFilterValues = useStore(tableStore, (state) => state.setFilterValues);
  const filterDimensions = useStore(tableStore, (state) => state.filterDimensions);
  const filters = useStoreWithEqualityFn(tableStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => [filter.filterValue, filter.includeMissingValues])) === JSON.stringify(b.map(filter => [filter.filterValue, filter.includeMissingValues])));
  const hasActiveFilter = useStore(tableStore, (state) => state.filters.some(filter => filter.isFilterActive()));
  const showMissingValuesFilter = useStore(tableStore, (state) => state.showMissingValuesFilter);
  const resetFilters = useStore(tableStore, (state) => state.resetFilters);
  const visibleFilterWithinDimensions = useStore(tableStore, (state) => state.visibleFilterWithinDimensions);
  const setVisibleFilterWithinDimensions = useStore(tableStore, (state) => state.setVisibleFilterWithinDimensions);
  const [internalVisibleFilterWithinDimensions, setInternalVisibleFilterWithinDimensions] = useState(visibleFilterWithinDimensions);

  const initialDefaultValues = useMemo<FilterValues>(() => {
    const values: FilterValues = Object.fromEntries(filters.map(filter => [filter.id, filter.initialFilterValue]));
    if (showMissingValuesFilter) {
      filters.forEach(filter => {
        values[filter.includeMissingValuesFormFieldName] = false;
      });
    }
    return values;
  }, [filters, showMissingValuesFilter]);

  const initialValues = useMemo<FilterValues>(() => {
    const values: FilterValues = Object.fromEntries(filters.map(filter => [filter.id, filter.filterValue ?? filter.initialFilterValue]));
    if (showMissingValuesFilter) {
      filters.forEach(filter => {
        values[filter.includeMissingValuesFormFieldName] = filter.includeMissingValues;
      });
    }
    return values;
  }, [filters, showMissingValuesFilter]);

  const formMethods = useForm<FilterValues>({
    defaultValues: initialDefaultValues,
    values: initialValues,
  });

  const onFilterVisibilityChange = useCallback((filterDimensionId: string, filterId: string) => {
    setInternalVisibleFilterWithinDimensions((prev) => ({
      ...prev,
      [filterDimensionId]: filterId,
    }));
  }, []);

  const { control, formState: { isDirty }, handleSubmit, reset, setValue } = formMethods;
  const formValues = useWatch({ control, defaultValue: initialValues });

  const hasActiveFormFilters = useMemo(() => {
    return filters.some(filter => filter.isFilterActive(
      formValues[filter.id],
      showMissingValuesFilter && formValues[filter.includeMissingValuesFormFieldName] === true,
    ));
  }, [filters, formValues, showMissingValuesFilter]);

  const onFormSubmit = useCallback(async (formFields: FilterValues): Promise<void> => {

    await setFilterValues(formFields);
    reset(formFields);
    setVisibleFilterWithinDimensions(internalVisibleFilterWithinDimensions);
    onClose();
  }, [internalVisibleFilterWithinDimensions, onClose, reset, setFilterValues, setVisibleFilterWithinDimensions]);

  const onResetButtonClick = useCallback(async () => {
    reset(initialDefaultValues);

    await resetFilters();
    setVisibleFilterWithinDimensions(internalVisibleFilterWithinDimensions);
    onClose();
  }, [initialDefaultValues, internalVisibleFilterWithinDimensions, onClose, reset, resetFilters, setVisibleFilterWithinDimensions]);

  const removeFilter = useCallback((id: string) => {
    const filter = filters.find(f => f.id === id);

    setValue(id, filter.initialFilterValue, {
      shouldDirty: true,
    });
    if (showMissingValuesFilter) {
      setValue(filter.includeMissingValuesFormFieldName, false, {
        shouldDirty: true,
      });
    }
  }, [filters, setValue, showMissingValuesFilter]);

  const filteredFilters = useMemo(() => filters.filter(filter => filter.showInSidebar), [filters]);

  return (
    <>
      {!!filters && !!initialValues && !!initialDefaultValues && (
        <FormProvider {...formMethods}>
          <Box
            autoComplete={'off'}
            component={'form'}
            id={'Filters'}
            onSubmit={handleSubmit(onFormSubmit)}
            sx={{
              display: 'grid',
              gridTemplateRows: 'max-content auto',
              height: '100%',
            }}
          >

            {/* Active filters */}
            <Box>
              {isDirty && hasActiveFilter && !hasActiveFormFilters && (
                <Box sx={{ my: 1 }}>
                  {t`All filters have been removed, but have not yet been applied.`}
                </Box>
              )}
              <Box>
                {filters.map(filter => {
                  const value = formValues[filter.id];
                  const includeMissingValues = showMissingValuesFilter
                    && formValues[filter.includeMissingValuesFormFieldName] === true;
                  if (filter.isFilterActive(value, includeMissingValues)) {
                    const selectedValues = filter.isInitialFilterValue(value) ? '' : filter.getPresentationValue(value, t);
                    const presentationValue = [selectedValues, includeMissingValues ? t`Missing` : '']
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <Box
                        key={filter.id}
                        sx={{
                          alignItems: 'center',
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns: 'auto max-content',
                        }}
                      >
                        <Box>
                          <Box
                            component={'span'}
                          >
                            {filter.label}
                          </Box>
                          <Box component={'span'}>
                            {': '}
                          </Box>
                          <Box
                            component={'strong'}
                          >
                            {presentationValue}
                          </Box>
                        </Box>
                        <IconButton
                          aria-label={t('Remove filter with label {{filterLabel}} and value {{filterValue}}', { filterLabel: filter.label, filterValue: presentationValue })}
                          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
                          onClick={() => removeFilter(filter.id)}
                          size={'small'}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                    );
                  }
                  return null;
                })}
              </Box>
              {(hasActiveFilter || isDirty) && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                    marginRight: 1,
                    my: 1,
                  }}
                >
                  <Button
                    {...TestIdUtil.createAttributes('TableFiltersSidebarItem-reset')}
                    color={'primary'}
                    onClick={onResetButtonClick}
                    startIcon={<RestartAltIcon />}
                    variant={'outlined'}
                  >
                    {t`Reset`}
                  </Button>
                  <Button
                    {...TestIdUtil.createAttributes('TableFiltersSidebarItem-apply')}
                    color={'secondary'}
                    startIcon={<CheckIcon />}
                    type={'submit'}
                  >
                    {t`Apply`}
                  </Button>
                </Box>
              )}
            </Box>
            {/* Render filters */}
            <Box
              sx={{
                overflowY: 'auto',
                paddingRight: 1,
              }}
            >
              {filterDimensions.length > 0 && (
                <>
                  {filterDimensions.filter(x => x.filterIds.length).map((filterDimension) => {
                    return (
                      <TableFiltersSidebarItemContentFilterDimension
                        filterDimension={filterDimension}
                        key={filterDimension.id}
                        onFilterVisibilityChange={onFilterVisibilityChange}
                        showMissingValuesFilter={showMissingValuesFilter}
                        visibleFilterWithinDimension={internalVisibleFilterWithinDimensions[filterDimension.id]}
                      />
                    );
                  })}
                </>
              )}
              {filterDimensions.length === 0 && (
                <>
                  {filteredFilters.map((filter) => (
                    <Box
                      key={filter.id}
                      sx={{ my: 2 }}
                    >
                      <Box
                        sx={{ my: 1 }}
                      >
                        <TableFilter filter={filter} />
                      </Box>
                      <Divider />
                    </Box>
                  ))}
                </>
              )}
            </Box>

          </Box>
        </FormProvider>
      )}
    </>
  );
};

export const TableFiltersSidebarItem = ({ onClose, open }: TableFiltersSidebarItemProps) => {
  const { t } = useTranslation();

  return (
    <SidebarItem
      closeIcon={<TableFiltersSidebarItemIcon />}
      closeIconTooltipText={t`Close filters`}
      onClose={onClose}
      open={open}
      testIdAttributes={{ name: 'tableFiltersSidebarItem' }}
      title={t`Filters`}
      width={60}
    >
      {open && <TableFiltersSidebarItemContent onClose={onClose} />}
    </SidebarItem>
  );
};
