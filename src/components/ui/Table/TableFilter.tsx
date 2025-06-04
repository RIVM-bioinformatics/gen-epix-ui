import { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import { DateFilter } from '../../../classes/filters/DateFilter';
import { GeoFilter } from '../../../classes/filters/GeoFilter';
import { MultiSelectFilter } from '../../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../../classes/filters/TextFilter';
import type { Filters } from '../../../models/filter';
import type { UnwrapArray } from '../../../models/generic';
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
  return (
    <>
      {filter instanceof TextFilter && <TextFilterField filter={filter} />}
      {filter instanceof BooleanFilter && <BooleanFilterField filter={filter} />}
      {filter instanceof NumberRangeFilter && <NumberRangeFilterField filter={filter} />}
      {filter instanceof MultiSelectFilter && <MultiSelectFilterField filter={filter} />}
      {filter instanceof GeoFilter && <GeoFilterField filter={filter} />}
      {filter instanceof DateFilter && <DateFilterField filter={filter} />}
    </>
  );
};
