import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import {
  Box,
  Button,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import type { UnwrapArray } from '@gen-epix/ui-core/models/generic.models';

import type {
  Filters,
  FilterValues,
} from '../../../models/filter.models';
import { useTableStoreContext } from '../../../stores/tableStore';

import { TableFilter } from './TableFilter';

export type TableHeaderFilterProps = {
  readonly filter: UnwrapArray<Filters>;
  readonly onFilterChange: () => void;
};

export const TableHeaderFilter = <TRowData, TDataContext>({ filter, onFilterChange }: TableHeaderFilterProps) => {
  const tableStore = useTableStoreContext<TRowData, TDataContext>();
  const { t } = useTranslation();
  const setFilterValue = useStore(tableStore, (state) => state.setFilterValue);
  const showMissingValuesFilter = useStore(tableStore, (state) => state.showMissingValuesFilter);
  const missingValuesFormFieldName = filter.includeMissingValuesFormFieldName;

  const initialDefaultValues = useMemo<FilterValues>(() => {
    return {
      [filter.id]: filter.initialFilterValue,
      ...(showMissingValuesFilter ? { [missingValuesFormFieldName]: false } : {}),
    };
  }, [filter.id, filter.initialFilterValue, missingValuesFormFieldName, showMissingValuesFilter]);

  const initialValues = useMemo<FilterValues>(() => {
    return {
      [filter.id]: filter.filterValue ?? filter.initialFilterValue,
      ...(showMissingValuesFilter ? { [missingValuesFormFieldName]: filter.includeMissingValues } : {}),
    };
  }, [filter.id, filter.filterValue, filter.includeMissingValues, filter.initialFilterValue, missingValuesFormFieldName, showMissingValuesFilter]);

  const formMethods = useForm<FilterValues>({
    defaultValues: initialDefaultValues,
    values: initialValues,
  });

  const { formState: { isDirty }, handleSubmit } = formMethods;

  const onFormSubmit = useCallback(async (formFields: FilterValues) => {

    await setFilterValue(
      filter.id,
      formFields[filter.id],
      showMissingValuesFilter ? formFields[missingValuesFormFieldName] === true : undefined,
    );
    onFilterChange();
  }, [filter.id, missingValuesFormFieldName, onFilterChange, setFilterValue, showMissingValuesFilter]);

  const onResetButtonClick = useCallback(async () => {

    await setFilterValue(
      filter.id,
      filter.initialFilterValue,
      showMissingValuesFilter ? false : undefined,
    );
    onFilterChange();
  }, [filter.id, filter.initialFilterValue, onFilterChange, setFilterValue, showMissingValuesFilter]);

  return (
    <FormProvider {...formMethods}>
      <Box
        autoComplete={'off'}
        component={'form'}
        id={'Filters'}
        onSubmit={handleSubmit(onFormSubmit)}
        sx={{
          minWidth: '400px',
        }}
      >
        <TableFilter filter={filter} />
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'flex-end',
          }}
        >
          <Button
            disabled={!filter.isFilterActive()}
            onClick={onResetButtonClick}
            variant={'outlined'}
          >
            {t`Remove filter`}
          </Button>
          <Button
            disabled={!isDirty}
            type={'submit'}
            variant={'contained'}
          >
            {t`Apply`}
          </Button>

        </Box>
      </Box>
    </FormProvider>
  );
};
