import { Box } from '@mui/material';
import { NumberRangeInput } from '../../../../../ui-core-form-components/src/components/fields/NumberRangeInput';

import type { NumberRangeFilter } from '../../../classes/filters/NumberRangeFilter';

export type NumberRangeFilterFieldProps = {
  readonly filter: NumberRangeFilter;
};
export const NumberRangeFilterField = ({ filter }: NumberRangeFilterFieldProps) => {
  return (
    <Box>
      <NumberRangeInput
        label={filter.label}
        max={filter.max}
        min={filter.min}
        name={filter.id}
      />
    </Box>
  );
};
