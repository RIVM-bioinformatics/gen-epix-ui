import { Box } from '@mui/material';

import type { GeoFilter } from '../../../classes/filters/GeoFilter';
import { CheckboxGroup } from '../../form/fields/CheckboxGroup';
import { Autocomplete } from '../../form/fields/Autocomplete';

export type GeoFilterFieldProps = {
  readonly filter: GeoFilter;
};

export const GeoFilterField = ({ filter }: GeoFilterFieldProps) => {
  return (
    <Box>
      {filter.options.length <= 5 && (
        <CheckboxGroup
          label={filter.label}
          name={filter.id}
          options={filter.options}
        />
      )}
      {filter.options.length > 5 && (
        <Autocomplete
          label={filter.label}
          multiple
          name={filter.id}
          options={filter.options}
          shouldSortOptions
        />
      )}
    </Box>
  );
};
