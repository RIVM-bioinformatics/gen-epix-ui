import { useTranslation } from 'react-i18next';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CheckIcon from '@mui/icons-material/Check';
import { useStore } from 'zustand';
import {
  Divider,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  useMemo,
  useCallback,
  useState,
} from 'react';
import {
  useForm,
  useWatch,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import CloseIcon from '@mui/icons-material/Close';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { SidebarItem } from '../Sidebar';
import type { SidebarItemSharedProps } from '../Sidebar';
import { NestedDropdown } from '../NestedMenu';
import { SelectionFilter } from '../../../classes/filters/SelectionFilter';
import { TreeFilter } from '../../../classes/filters/TreeFilter';
import type {
  FilterDimension,
  FilterValues,
  Filters,
} from '../../../models/filter';
import type { MenuItemData } from '../../../models/nestedMenu';
import { useTableStoreContext } from '../../../stores/tableStore';
import { TestIdUtil } from '../../../utils/TestIdUtil';

import { TableFilter } from './TableFilter';

export type TableFiltersSidebarItemProps = SidebarItemSharedProps;
type TableFiltersSidebarItemContentProps = Pick<TableFiltersSidebarItemProps, 'onClose'>;

export const TableFiltersSidebarItemIcon = FilterAltIcon;

type TableFiltersSidebarItemContentFilterDimensionProps = {
  readonly filterDimension: FilterDimension;
  readonly onFilterVisibilityChange: (filterDimensionId: string, filterId: string) => void;
  readonly visibleFilterWithinDimension: string;
};

const TableFiltersSidebarItemContentFilterDimension = <TRowData, >({ filterDimension, onFilterVisibilityChange, visibleFilterWithinDimension }: TableFiltersSidebarItemContentFilterDimensionProps) => {
  const tableStore = useTableStoreContext<TRowData>();
  const filters = useStoreWithEqualityFn(tableStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const dimensionFilters = filterDimension.filterIds.map(filterId => filters.find(filter => filter.id === filterId));

  const { setValue } = useFormContext<FilterValues>();

  const filteredDimensionFilters = useMemo<Filters>(() => {
    if (filterDimension.allowOnlyPreferredFilter || filterDimension.filterIds.length === 1) {
      return [dimensionFilters.find(f => f?.id && f.id === filterDimension.preferredFilterId)].filter(x => !!x) as Filters;
    }
    if (!filterDimension.allowMultipleVisibleFilters) {
      const visibleFilterId = visibleFilterWithinDimension ?? filterDimension.preferredFilterId;
      const visibleFilter = dimensionFilters.find(f => f?.id && f.id === visibleFilterId);
      return [visibleFilter].filter(x => !!x) as Filters;
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
        label: filteredDimensionFilters[0].label,
        items: dimensionFilters.map(filter => ({
          label: filter.label,
          active: filter === filteredDimensionFilters[0],
          callback: () => {
            onFilterVisibilityChange(filterDimension.id, filter.id);
            filterDimension.filterIds.forEach((id) => {
              if (id !== filter.id) {
                setValue(id, filters.find(f => f.id === id).initialFilterValue, {
                  shouldDirty: true,
                });
              }
            });
          },
        })),
      }
      : null;
  }, [dimensionFilters, filterDimension.filterIds, filterDimension.id, filteredDimensionFilters, filters, setValue, onFilterVisibilityChange, shouldShowDropDown]);

  if (!filteredDimensionFilters.length) {
    return null;
  }

  return (
    <Box
      key={filterDimension.id}
      marginBottom={2}
    >
      {shouldShowDimensionTitle && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
                  variant: 'text',
                  size: 'small',
                  color: 'inherit',
                  sx: {
                    margin: 0,
                    padding: 0,
                    background: 'none !important',
                    '& span': {
                      margin: 0,
                    },
                    textTransform: 'none',
                  },
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
          marginY={1}
        >
          <TableFilter filter={filter} />
        </Box>
      ))}

      <Divider />
    </Box>
  );
};

export const TableFiltersSidebarItemContent = <TRowData, >({ onClose }: TableFiltersSidebarItemContentProps) => {
  const [t] = useTranslation();

  const tableStore = useTableStoreContext<TRowData>();
  const setFilterValues = useStore(tableStore, (state) => state.setFilterValues);
  const filterDimensions = useStore(tableStore, (state) => state.filterDimensions);
  const filters = useStoreWithEqualityFn(tableStore, (state) => state.filters, (a, b) => JSON.stringify(a.map(filter => filter.filterValue)) === JSON.stringify(b.map(filter => filter.filterValue)));
  const hasActiveFilter = useStore(tableStore, (state) => state.filters.some(filter => !filter.isInitialFilterValue(filter.filterValue)));
  const resetFilters = useStore(tableStore, (state) => state.resetFilters);
  const visibleFilterWithinDimensions = useStore(tableStore, (state) => state.visibleFilterWithinDimensions);
  const setVisibleFilterWithinDimensions = useStore(tableStore, (state) => state.setVisibleFilterWithinDimensions);
  const [internalVisibleFilterWithinDimensions, setInternalVisibleFilterWithinDimensions] = useState(visibleFilterWithinDimensions);

  const initialDefaultValues = useMemo(() => {
    return Object.fromEntries(filters.map(filter => [filter.id, filter.initialFilterValue]));
  }, [filters]);

  const initialValues = useMemo(() => {
    return Object.fromEntries(filters.map(filter => [filter.id, filter.filterValue ?? filter.initialFilterValue]));
  }, [filters]);

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

  const { handleSubmit, control, reset, setValue, formState: { isDirty } } = formMethods;
  const formValues = useWatch({ control, defaultValue: initialValues });

  const hasActiveFormFilters = useMemo(() => {
    return Object.entries(formValues).some(([id, value]) => !filters.find(f => f.id === id).isInitialFilterValue(value));
  }, [filters, formValues]);

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
  }, [filters, setValue]);

  const filteredFilters = useMemo(() => filters.filter(filter => !(filter instanceof TreeFilter) && !(filter instanceof SelectionFilter)), [filters]);

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
              height: '100%',
              display: 'grid',
              gridTemplateRows: 'max-content auto',
            }}
          >

            {/* Active filters */}
            <Box >
              {isDirty && hasActiveFilter && !hasActiveFormFilters && (
                <Box marginY={1}>
                  {t`All filters have been removed, but have not yet been applied.`}
                </Box>
              )}
              <Box>
                {Object.entries(formValues).map(([id, value]) => {
                  const filter = filters.find(f => f.id === id);
                  if (!filter.isInitialFilterValue(formValues[id])) {
                    return (
                      <Box
                        key={id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'auto max-content',
                          gap: 1,
                          alignItems: 'center',
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
                            {filter.getPresentationValue(value, t)}
                          </Box>
                        </Box>
                        <IconButton
                          // eslint-disable-next-line react/jsx-no-bind
                          onClick={() => removeFilter(id)}
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
                  marginY={1}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    marginRight: 1,
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
                    startIcon={<CheckIcon />}
                    type={'submit'}
                  >
                    {t`Apply`}
                  </Button>
                </Box>
              )}
            </Box>

            {/* Render filters */}
            <Box sx={{
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
                      marginY={2}
                    >
                      <Box
                        marginY={1}
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

export const TableFiltersSidebarItem = ({ open, onClose }: TableFiltersSidebarItemProps) => {
  const [t] = useTranslation();

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
