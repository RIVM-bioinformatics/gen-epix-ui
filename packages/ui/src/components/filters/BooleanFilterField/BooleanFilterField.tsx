import { Box } from '@mui/material';
import { useMemo } from 'react';

import type { BooleanFilter } from '../../../classes/filters/BooleanFilter';
import type { SelectOption } from '../../../models/form';
import { Select } from '../../form/fields/Select';


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
