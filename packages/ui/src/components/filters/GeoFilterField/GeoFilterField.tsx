import { Box } from '@mui/material';
import { CheckboxGroup } from '@gen-epix/ui-form/components/fields/CheckboxGroup';
import { Autocomplete } from '@gen-epix/ui-form/components/fields/Autocomplete';

import type { GeoFilter } from '../../../classes/filters/GeoFilter';

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
