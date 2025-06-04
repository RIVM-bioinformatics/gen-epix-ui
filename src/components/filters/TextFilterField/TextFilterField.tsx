import { Box } from '@mui/material';

import type { TextFilter } from '../../../classes/filters/TextFilter';
import { TextField } from '../../form/fields/TextField';

export type TextFilterFieldProps = {
  readonly filter: TextFilter;
};
export const TextFilterField = ({ filter }: TextFilterFieldProps) => {
  return (
    <Box>
      <TextField
        label={filter.label}
        name={filter.id}
      />
    </Box>
  );
};
