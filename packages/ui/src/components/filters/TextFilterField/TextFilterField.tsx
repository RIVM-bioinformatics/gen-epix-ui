import { Box } from '@mui/material';
import { TextField } from '../../../../../ui-core-form-components/src/components/fields/TextField';

import type { TextFilter } from '../../../classes/filters/TextFilter';

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
