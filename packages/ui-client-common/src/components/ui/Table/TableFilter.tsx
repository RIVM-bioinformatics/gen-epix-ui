import {
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import type { UnwrapArray } from '@gen-epix/ui-core/models/generic.models';
import {
  useController,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import { DateFilter } from '../../../classes/filters/DateFilter';
import { GeoFilter } from '../../../classes/filters/GeoFilter';
import { MultiSelectFilter } from '../../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../../classes/filters/TextFilter';
import type {
  Filters,
  FilterValues,
} from '../../../models/filter.models';
import { useTableStoreContext } from '../../../stores/tableStore';
import { BooleanFilterField } from '../../filters/BooleanFilterField';
import { DateFilterField } from '../../filters/DateFilterField';
import { GeoFilterField } from '../../filters/GeoFilterField';
import { MultiSelectFilterField } from '../../filters/MultiSelectFilterField';
import { NumberRangeFilterField } from '../../filters/NumberRangeFilterField';
import { TextFilterField } from '../../filters/TextFilterField';

export type TableFilterProps = {
  readonly filter: UnwrapArray<Filters>;
};

export const TableFilter = ({ filter }: TableFilterProps) => {
  const { field } = useController({
    defaultValue: filter.includeMissingValues,
    name: filter.includeMissingValuesFormFieldName,
  });
  const { t } = useTranslation();
  const tableStore = useTableStoreContext();
  const showMissingValuesFilter = useStore(tableStore, (state) => state.showMissingValuesFilter);

  const currentFilterValue = useWatch<FilterValues>({ name: filter.id });
  const isInitialFilterValue = filter.isInitialFilterValue(currentFilterValue);
  const label = isInitialFilterValue ? t`Select missing values` : t`Include missing values`;
  const tooltipTitle = isInitialFilterValue
    ? t`When enabled, select only items with missing values.`
    : t`When enabled, include items with missing values alongside items matching the selected values.`;

  return (
    <>
      {filter instanceof TextFilter && <TextFilterField filter={filter} />}
      {filter instanceof BooleanFilter && <BooleanFilterField filter={filter} />}
      {filter instanceof NumberRangeFilter && <NumberRangeFilterField filter={filter} />}
      {filter instanceof MultiSelectFilter && <MultiSelectFilterField filter={filter} />}
      {filter instanceof GeoFilter && <GeoFilterField filter={filter} />}
      {filter instanceof DateFilter && <DateFilterField filter={filter} />}
      {showMissingValuesFilter && filter.supportsMissingValuesFilter && (
        <Tooltip
          arrow
          placement={'top'}
          title={tooltipTitle}
        >
          <FormControlLabel
            control={(
              <Checkbox
                checked={field.value === true}
                name={field.name}
                onBlur={field.onBlur}
                onChange={field.onChange}
              />
            )}
            label={label}
          />
        </Tooltip>
      )}
    </>
  );
};
