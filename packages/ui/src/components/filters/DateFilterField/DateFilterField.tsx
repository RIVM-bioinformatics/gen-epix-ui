import { Box } from '@mui/material';

import type { DateFilter } from '../../../classes/filters/DateFilter';
import { DateRangePicker } from '../../form/fields/DateRangePicker';


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
