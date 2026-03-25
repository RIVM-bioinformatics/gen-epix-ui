import { Box } from '@mui/material';

import type { MultiSelectFilter } from '../../../classes/filters/MultiSelectFilter';
import { CheckboxGroup } from '../../form/fields/CheckboxGroup';
import { Autocomplete } from '../../form/fields/Autocomplete';

export type MultiSelectFilterFieldProps = {
  readonly filter: MultiSelectFilter;
};

export const MultiSelectFilterField = ({ filter }: MultiSelectFilterFieldProps) => {
  return (
    <Box>
      {filter.options.length <= filter.maxNumOptionsExpanded && (
        <CheckboxGroup
          label={filter.label}
          name={filter.id}
          options={filter.options}
        />
      )}
      {filter.options.length > filter.maxNumOptionsExpanded && (
        <Autocomplete
          multiple
          label={filter.label}
          name={filter.id}
          options={filter.options}
        />
      )}
    </Box>
  );
};
