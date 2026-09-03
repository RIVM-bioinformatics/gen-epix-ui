import { Box } from '@mui/material';
import { DateRangePicker } from '@gen-epix/ui-core-form/components/fields/DateRangePicker';

import type { DateFilter } from '../../../classes/filters/DateFilter';


export type DateFilterFieldProps = {
  readonly filter: DateFilter;
};

export const DateFilterField = ({ filter }: DateFilterFieldProps) => {
  return (
    <Box>
      <DateRangePicker
        dateFormat={filter.dateFormat}
        label={filter.label}
        maxDate={filter.maxDate}
        minDate={filter.minDate}
        name={filter.id}
      />
    </Box>
  );
};
