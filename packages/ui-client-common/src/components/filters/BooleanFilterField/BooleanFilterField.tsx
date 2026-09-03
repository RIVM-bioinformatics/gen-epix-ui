import { Box } from '@mui/material';
import { useMemo } from 'react';
import type { SelectOption } from '@gen-epix/ui-core-form/models/form';
import { Select } from '@gen-epix/ui-core-form/components/fields/Select';

import type { BooleanFilter } from '../../../classes/filters/BooleanFilter';


export type BooleanFilterFieldProps = {
  readonly filter: BooleanFilter;
};
export const BooleanFilterField = ({ filter }: BooleanFilterFieldProps) => {
  const options = useMemo<SelectOption<boolean>[]>(() => [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ], []);
  return (
    <Box>
      <Select
        label={filter.label}
        name={filter.id}
        options={options}
      />
    </Box>
  );
};
